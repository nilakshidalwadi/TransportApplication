import {
  Component,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  ElementRef,
  Renderer
} from "@angular/core";
import { ReportService } from "../../services/report.service";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Subject, Subscription } from "rxjs";
import * as _ from "lodash";
import { DataTableDirective } from "angular-datatables";
import { AlertService } from "../../alert/alert.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { TripService } from "../../services/trip.service";
import { JobTypeService } from "src/app/services/job-type.service";

export enum FilterTypes {
  Driver = "Driver",
  Truck = "Truck",
  NoFilter = "No Filter",
  PalletByDay = "Pallet By Day",
  PalletByTrip = "Pallet By Trip",
  PalletByTripLoad = "Pallet By Trip & Load"
}

export enum JobTypes {
  Kilometers = "Kilometers",
  Hours = "Hours",
  Pallet = "Pallet",
  Load = "Load",
  NoFilter = "No Filter"
}

const REPORT_FILTER_CACHE = "reportFilters";

@Component({
  selector: "app-report",
  templateUrl: "./report.component.html",
  styleUrls: ["./report.component.scss"]
})
export class ReportComponent implements OnInit, OnDestroy, AfterViewInit {
  reportFilter: FormGroup;
  palletDetails = [];
  totalDryPallet = 0;

  reportBy: Array<string> = [
    FilterTypes.NoFilter,
    FilterTypes.Driver,
    FilterTypes.Truck
  ];
  reportByFilter: string;
  jobTypeFilter: string;
  jobByFilter: string;
  report = [];
  jobList = [];

  allColumns: {
    data: string;
    title: string;
    type: number;
    showTotal?: boolean;
  }[] = [];

  filteredReport = [];

  buttons: string[] = ["colvis", "print", "excel"];
  dtOptions: any = {};
  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger = new Subject();
  dtTriggerSub: Subscription;
  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  @ViewChild("dtTableElement", { static: false }) dtTableElement: ElementRef;

  dtRendering: boolean = false;

  constructor(
    private formBuilder1: FormBuilder,
    private cdr: ChangeDetectorRef,
    private reportService: ReportService,
    private tripService: TripService,
    private jobtypeService: JobTypeService,
    private alert: AlertService,
    private renderer: Renderer,
    private confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnInit() {
    jQuery.extend(jQuery.fn["dataTableExt"].oSort, {
      "2-pre": function(a) {
        a = a.replace(/[\s,]+/g, "");
        let matches = a.match(/>\d+\.?\d*</g);
        return Number(_.replace(_.get(matches, 0) || 0, /[\<\>]/g, ""));
      },

      "2-asc": function(a, b) {
        return a - b;
      },

      "2-desc": function(a, b) {
        return b - a;
      }
    });

    // Set all the columns
    this.setAllCOlumns();

    // Get cached filters
    let cachedFilters = JSON.parse(
      atob(localStorage.getItem(REPORT_FILTER_CACHE) || "") || "{}"
    );

    // Default no filter
    this.reportByFilter = cachedFilters["filterBy"] || FilterTypes.NoFilter;
    this.jobTypeFilter = cachedFilters["jobType"] || JobTypes.NoFilter;
    this.jobByFilter = cachedFilters["jobBy"] || JobTypes.NoFilter;

    // Filter form
    this.reportFilter = this.formBuilder1.group({
      sDate: [
        cachedFilters["sDate"] || this.getDate(-7),
        [Validators.required]
      ],
      eDate: [cachedFilters["eDate"] || this.getDate(0), [Validators.required]]
    });

    // Datatable options
    this.dtOptions = {
      destroy: true,
      pagingType: "full_numbers",
      pageLength: 15,
      // Use this attribute to enable the responsive extension
      responsive: true,
      // Declare the use of the extension in the dom parameter
      dom: "Bfrtip",
      bDestroy: true,
      // Configure the buttons
      buttons: this.buttons,
      columns: []
    };
    this.getJobTypeList();

    this.dtTriggerSub = this.dtTrigger.subscribe(() => {
      setTimeout(() => {
        this.dtRendering = false;
        this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
          const _this = this;
          dtInstance.columns().every(function() {
            const $header = $(this.header());
            $header.remove("span.total");

            let total = _.round(_this.getTotal(`${this.dataSrc()}`), 2);
            if (total > 0) {
              const $span = $("<span>")
                .addClass("total")
                .text(` (${_this.numberWithCommas(total)})`);
              $header.append($span);
            }
          });
        });
      });
    });
  }

  ngAfterViewInit(): void {
    // Set columns
    this.setDTColumns();
    // Get report
    this.getReport();
    this.renderer.listenGlobal(
      this.dtTableElement.nativeElement,
      "click",
      event => {
        if (event.target.hasAttribute("set-0-km")) {
          this.openConfirmationDialog(
            event.target.attributes["set-0-km"].value
          );
        } else if (event.target.hasAttribute("delete-trip")) {
          this.delete(event.target.attributes["delete-trip"].value);
        }
      }
    );
    this.dtTrigger.next();
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
    this.dtTriggerSub.unsubscribe();
  }

  private getJobTypeList() {
    this.jobList = [];

    this.jobtypeService.getJobTypeList().subscribe(
      val => {
        this.jobList = val.response || [];
        this.jobList.splice(0, 0, {
          jobBy: FilterTypes.NoFilter,
          jType: FilterTypes.NoFilter
        });
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }

  public getReport() {
    // Remember the selected filters
    localStorage.setItem(
      REPORT_FILTER_CACHE,
      btoa(
        JSON.stringify(
          _.merge(this.reportFilter.value, {
            filterBy: this.reportByFilter,
            jobBy: this.jobByFilter,
            jobType: this.jobTypeFilter
          })
        )
      )
    );
    // Get the report based on new filters
    this.report = [];
    this.reportService.getReport(this.reportFilter.value).subscribe(
      val => {
        this.report = _.map(val.response || [], r => {
          r.id = r.tripID;

          // Set zone name
          r.zone = `${r.zoneNumber || "-"}`;

          // Set total cost
          r.dTotalCost = (r.rDpallet || 0) * (r.nDpallet || 0);
          r.fTotalCost = (r.rFpallet || 0) * (r.nFpallet || 0);
          r.zTotalExtraCost = (r.extraRate || 0) * (r.extraDropNum || 0);
          r.zTotalCost =
            (r.dTotalCost || 0) +
            (r.fTotalCost || 0) +
            (r.zTotalExtraCost || 0);

          // Set working hours
          if (r.totalHrs > 10.5) r.workingHrs = r.totalHrs - 1;
          else if (r.totalHrs > 7.75) r.workingHrs = r.totalHrs - 0.5;
          else if (r.totalHrs > 5.25) r.workingHrs = r.totalHrs - 0.25;
          else r.workingHrs = r.totalHrs;

          // Update from backend if any
          if (r.wHrs != null) r.workingHrs = r.wHrs;
          return r;
        });
        this.filterReport();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve report");
      }
    );
  }

  getDate(days: number): string {
    let date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().substring(0, 10);
  }

  private setAllCOlumns() {
    this.allColumns = [
      { data: "id", title: "ID", type: 2 },
      { data: "uName", title: "Driver Name", type: 1 },
      { data: "regoNum", title: "Rego Number", type: 1 },
      { data: "totalKM", title: "Total KM", type: 2, showTotal: true },
      { data: "totalHrs", title: "Total Hours", type: 2, showTotal: true },
      { data: "workingHrs", title: "Working Hours", type: 2, showTotal: true },
      { data: "sJTime", title: "Job Start Time", type: 3 },
      { data: "eJTime", title: "Job End Time", type: 3 },
      { data: "sTime", title: "Actual Start Time", type: 3 },
      { data: "eTime", title: "Actual End Time", type: 3 },
      { data: "sOMeter", title: "Start KM", type: 2 },
      { data: "eOMeter", title: "End KM", type: 2 },
      { data: "jType", title: "Job Type", type: 1 },
      { data: "loadNum", title: "Load(s)", type: 2, showTotal: true },
      { data: "dropNum", title: "Drop(s)", type: 2, showTotal: true },
      { data: "zone", title: "Zone", type: 1 },
      { data: "nDpallet", title: "Total Dry Pallet", type: 2, showTotal: true },
      {
        data: "nFpallet",
        title: "Total Fridge Pallet",
        type: 2,
        showTotal: true
      },
      { data: "zTotalPallet", title: "Total Pallet", type: 2, showTotal: true },
      {
        data: "dTotalCost",
        title: "Cost of Dry Pallet",
        type: 2,
        showTotal: true
      },
      {
        data: "fTotalCost",
        title: "Cost of Fridge Pallet",
        type: 2,
        showTotal: true
      },
      {
        data: "zTotalExtraCost",
        title: "Extra Cost",
        type: 2,
        showTotal: true
      },
      { data: "zTotalCost", title: "Total Cost", type: 2, showTotal: true },
      { data: "fLoad", title: "Full Load", type: 2, showTotal: true },
      { data: "load", title: "Load", type: 2, showTotal: true },
      { data: "delivery", title: "Total Delivery", type: 2, showTotal: true },
      { data: "tripID", title: "Actions", type: 4 }
    ];
  }

  filterReport() {
    this.jobByFilter = this.getJobByFromType(this.jobTypeFilter);

    // Update report filters based on selection
    this.reportBy = [
      FilterTypes.NoFilter,
      FilterTypes.Driver,
      FilterTypes.Truck
    ];
    if (this.jobByFilter === JobTypes.Pallet) {
      this.reportBy.push(
        FilterTypes.PalletByDay,
        FilterTypes.PalletByTrip,
        FilterTypes.PalletByTripLoad
      );
    }

    // Reset to no filter if reportByFilter no longer exists
    if (_.indexOf(this.reportBy, this.reportByFilter) === -1)
      this.reportByFilter = FilterTypes.NoFilter;

    // for filtering report by jobtype
    let jobFilteredRecords =
      this.jobTypeFilter === JobTypes.NoFilter
        ? this.report
        : _.filter(this.report, f => f["jType"] == this.jobTypeFilter);

    // for getting unique records
    if (
      this.jobByFilter !== JobTypes.Pallet ||
      this.reportByFilter === FilterTypes.Driver ||
      this.reportByFilter === FilterTypes.Truck
    ) {
      jobFilteredRecords = _.uniqBy(jobFilteredRecords, "tripID");
    }

    // filter based on report
    if (this.reportByFilter === FilterTypes.Driver) {
      let rec = _.groupBy(jobFilteredRecords, "uID");
      this.filteredReport = _.map(_.keys(rec), key => {
        return {
          uName: _.get(_.first(rec[key]), "uName"),
          totalKM: _.sumBy(rec[key], v => {
            return v["totalKM"] > 0 ? v["totalKM"] : 0;
          }),
          totalHrs: _.sumBy(rec[key], v => {
            return v["totalHrs"] > 0 ? v["totalHrs"] : 0;
          }),
          workingHrs: _.sumBy(rec[key], v => {
            return v["workingHrs"] > 0 ? v["workingHrs"] : 0;
          })
        };
      });
    } else if (this.reportByFilter === FilterTypes.Truck) {
      let rec = _.groupBy(jobFilteredRecords, "tID");
      this.filteredReport = _.map(_.keys(rec), key => {
        return {
          regoNum: _.get(_.first(rec[key]), "regoNum"),
          totalKM: _.sumBy(rec[key], v => {
            return v["totalKM"] > 0 ? v["totalKM"] : 0;
          }),
          totalHrs: _.sumBy(rec[key], v => {
            return v["totalHrs"] > 0 ? v["totalHrs"] : 0;
          }),
          workingHrs: _.sumBy(rec[key], v => {
            return v["workingHrs"] > 0 ? v["workingHrs"] : 0;
          })
        };
      });
    } else if (this.reportByFilter === FilterTypes.NoFilter) {
      this.filteredReport = jobFilteredRecords;
    } else if (this.reportByFilter === FilterTypes.PalletByDay) {
      this.filteredReport = _.map(
        _.groupBy(
          _.map(jobFilteredRecords, val => {
            val["sJDay"] = _.get(_.split(val["sJTime"], " "), 0);
            return val;
          }),
          "sJDay"
        ),
        (data, day) => {
          let totalLoad: number = 0,
            totalDrop: number = 0,
            totalDPallet: number = 0,
            totalFPallet: number = 0,
            totalPallet: number = 0,
            totalDCost: number = 0,
            totalFCost: number = 0,
            totalCost: number = 0,
            totalExtraCost: number = 0;
          _.forEach(_.groupBy(data, "tripID"), (trips, tripId) => {
            let tripByLoad = _.groupBy(trips, "loadNum");
            totalLoad += _.size(tripByLoad);
            totalDrop += _.size(_.filter(trips, t => t.dropNum !== 0));
            totalDPallet += _.sumBy(trips, t => {
              return t["nDpallet"] || 0;
            });
            totalFPallet += _.sumBy(trips, t => {
              return t["nFpallet"] || 0;
            });
            totalDCost += _.sumBy(trips, t => {
              return t["dTotalCost"] || 0;
            });
            totalFCost += _.sumBy(trips, t => {
              return t["fTotalCost"] || 0;
            });
            totalExtraCost += _.sumBy(trips, t => {
              return t["zTotalExtraCost"] || 0;
            });
          });

          totalPallet = totalDPallet + totalFPallet;
          totalCost = totalDCost + totalFCost + totalExtraCost;
          return {
            sJTime: day,
            loadNum: totalLoad,
            dropNum: totalDrop,
            nDpallet: totalDPallet,
            nFpallet: totalFPallet,
            dTotalCost: totalDCost,
            fTotalCost: totalFCost,
            zTotalCost: totalCost,
            zTotalPallet: totalPallet,
            zTotalExtraCost: totalExtraCost
          };
        }
      );
    } else if (this.reportByFilter === FilterTypes.PalletByTrip) {
      this.filteredReport = [];
      let tripDetails = {};
      _.forEach(_.groupBy(jobFilteredRecords, "tripID"), (trip, tripId) => {
        tripDetails["tripID"] = tripId;
        tripDetails["loadNum"] = _.size(_.groupBy(trip, "loadNum")) || 0;
        tripDetails["dropNum"] = _.size(_.filter(trip, t => t.dropNum !== 0));
        tripDetails["sJTime"] = _.get(_.get(trip, 0), "sJTime");
        tripDetails["eJTime"] = _.get(_.get(trip, 0), "eJTime");
        tripDetails["uName"] = _.get(_.get(trip, 0), "uName");
        tripDetails["nDpallet"] = _.sumBy(trip, "nDpallet") || 0;
        tripDetails["nFpallet"] = _.sumBy(trip, "nFpallet") || 0;
        tripDetails["dTotalCost"] = _.sumBy(trip, "dTotalCost") || 0;
        tripDetails["fTotalCost"] = _.sumBy(trip, "fTotalCost") || 0;
        tripDetails["zTotalPallet"] =
          (tripDetails["nDpallet"] || 0) + (tripDetails["nFpallet"] || 0);
        tripDetails["zTotalExtraCost"] = _.sumBy(trip, "zTotalExtraCost") || 0;
        tripDetails["zTotalCost"] =
          (tripDetails["dTotalCost"] || 0) +
          (tripDetails["fTotalCost"] || 0) +
          tripDetails["zTotalExtraCost"];
        this.filteredReport.push(_.clone(tripDetails));
      });
    } else if (this.reportByFilter === FilterTypes.PalletByTripLoad) {
      this.filteredReport = [];
      let tripDetails = {};
      _.forEach(_.groupBy(jobFilteredRecords, "tripID"), (trip, tripId) => {
        tripDetails["tripID"] = tripId;
        _.forEach(_.groupBy(trip, "loadNum"), (load, loadNum) => {
          tripDetails["loadNum"] = loadNum;
          tripDetails["dropNum"] = _.size(_.filter(load, t => t.dropNum !== 0));
          tripDetails["sJTime"] = _.get(_.get(load, 0), "sJTime");
          tripDetails["eJTime"] = _.get(_.get(load, 0), "eJTime");
          tripDetails["uName"] = _.get(_.get(load, 0), "uName");
          tripDetails["nDpallet"] = _.sumBy(load, "nDpallet") || 0;
          tripDetails["nFpallet"] = _.sumBy(load, "nFpallet") || 0;
          tripDetails["dTotalCost"] = _.sumBy(load, "dTotalCost") || 0;
          tripDetails["fTotalCost"] = _.sumBy(load, "fTotalCost") || 0;
          tripDetails["zTotalPallet"] =
            (tripDetails["nDpallet"] || 0) + (tripDetails["nFpallet"] || 0);
          tripDetails["zTotalExtraCost"] =
            _.sumBy(load, "zTotalExtraCost") || 0;
          tripDetails["zTotalCost"] =
            (tripDetails["dTotalCost"] || 0) +
            (tripDetails["fTotalCost"] || 0) +
            tripDetails["zTotalExtraCost"];
          this.filteredReport.push(_.clone(tripDetails));
        });
      });
    }
    this.setDTColumns();
    this.rerender();
  }

  private setDTColumns() {
    // columns for job filter
    if (this.jobByFilter === JobTypes.NoFilter) {
      this.dtOptions.order = [6, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "id",
            "uName",
            "regoNum",
            "totalKM",
            "totalHrs",
            "workingHrs",
            "sJTime",
            "eJTime",
            "sOMeter",
            "eOMeter",
            "jType",
            "tripID"
          ].indexOf(d.data) > -1
        );
      });
    } else if (this.jobByFilter === JobTypes.Hours) {
      this.dtOptions.order = [4, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "uName",
            "regoNum",
            "totalHrs",
            "workingHrs",
            "sJTime",
            "eJTime",
            "tripID"
          ].indexOf(d.data) > -1
        );
      });
    } else if (this.jobByFilter === JobTypes.Kilometers) {
      this.dtOptions.order = [5, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "uName",
            "regoNum",
            "totalKM",
            "sOMeter",
            "eOMeter",
            "sJTime",
            "eJTime",
            "tripID",
            "totalHrs",
            "workingHrs"
          ].indexOf(d.data) > -1
        );
      });
    } else if (this.jobByFilter === JobTypes.Pallet) {
      this.dtOptions.order = [2, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "uName",
            "regoNum",
            "zone",
            "loadNum",
            "dropNum",
            "nDpallet",
            "nFpallet",
            "dTotalCost",
            "fTotalCost",
            "zTotalCost",
            "zTotalExtraCost",
            "sJTime",
            "eJTime",
            "tripID"
          ].indexOf(d.data) > -1
        );
      });
    } else if (this.jobByFilter === JobTypes.Load) {
      this.dtOptions.order = [4, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "uName",
            "regoNum",
            "totalHrs",
            "workingHrs",
            "sJTime",
            "eJTime",
            "fLoad",
            "load",
            "delivery",
            "tripID"
          ].indexOf(d.data) > -1
        );
      });
    }

    // columns for report filter
    if (this.reportByFilter === FilterTypes.Driver) {
      this.dtOptions.order = [0, "asc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          ["uName", "totalKM", "totalHrs", "workingHrs"].indexOf(d.data) > -1
        );
      });
    } else if (this.reportByFilter === FilterTypes.Truck) {
      this.dtOptions.order = [0, "asc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          ["regoNum", "totalKM", "totalHrs", "workingHrs"].indexOf(d.data) > -1
        );
      });
    } else if (this.reportByFilter === FilterTypes.PalletByDay) {
      this.dtOptions.order = [0, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "sJTime",
            "loadNum",
            "dropNum",
            "nDpallet",
            "nFpallet",
            "dTotalCost",
            "fTotalCost",
            "zTotalCost",
            "zTotalPallet",
            "zTotalExtraCost"
          ].indexOf(d.data) > -1
        );
      });
    } else if (
      this.reportByFilter === FilterTypes.PalletByTrip ||
      this.reportByFilter === FilterTypes.PalletByTripLoad
    ) {
      this.dtOptions.order = [1, "desc"];
      this.dtOptions.columns = _.filter(this.allColumns, d => {
        return (
          [
            "uName",
            "sJTime",
            "eJTime",
            "loadNum",
            "dropNum",
            "nDpallet",
            "nFpallet",
            "dTotalCost",
            "fTotalCost",
            "zTotalCost",
            "zTotalPallet",
            "zTotalExtraCost"
          ].indexOf(d.data) > -1
        );
      });
    }
  }

  private rerender(): void {
    this.dtRendering = true;
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      this.dtRendering = true;
      // Destroy the table first
      dtInstance.destroy();
      // Empty thead to filter dt columns
      $(this.dtTableElement.nativeElement)
        .children("thead")
        .empty();

      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }

  numberWithCommas(x) {
    if (x != 0 && !x) return "";
    try {
      if (Number(x) < 0) return "";
    } catch (e) {
      console.warn(e);
      return "";
    }
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  private openConfirmationDialog(tripID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to set KM to 0?"
      },
      () => {
        this.tripService.resetKM(tripID).subscribe(
          val => {
            if (val.status == 200 && val.response > 0) {
              this.report = this.report.map(r => {
                if (r.tripID == tripID) {
                  r["totalKM"] = 0;
                }
                return r;
              });
              this.filterReport();
            }
          },
          err => {
            this.alert.error("Unable to update KM to 0");
            console.warn(err);
          }
        );
      },
      () => {
        // Do nothing if NO
      }
    );
  }

  delete(TripID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this trip?"
      },
      () => {
        this.reportService.deleteTrip(TripID).subscribe(val => {
          this.alert.success("Details successfully updated");
          this.report = this.report.filter(t => {
            return t.tripID != TripID;
          });
          this.filterReport();
        });
      },
      () => {
        // Do nothing if NO
      }
    );
  }

  public getTotal(columnName: string): number {
    if (
      _.get(
        _.get(
          _.filter(this.dtOptions.columns, col => col.data === columnName),
          0
        ),
        "showTotal"
      )
    )
      return _.sumBy(this.filteredReport, columnName) || 0;
    return 0;
  }

  public getJobByFromType(type: string): string {
    if (type == JobTypes.NoFilter) return JobTypes.NoFilter;
    return _.get(
      _.get(
        _.filter(this.jobList, j => j.jType == type),
        0
      ),
      "jobBy"
    );
  }
}
