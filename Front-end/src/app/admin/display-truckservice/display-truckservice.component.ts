import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  Renderer
} from "@angular/core";
import { TruckService } from "../../services/truck.service";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { AlertService } from "../../alert/alert.service";
import { DataTableDirective } from "angular-datatables";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import * as _ from "lodash";

export enum FilterTypes {
  Truck = "Truck",
  NoFilter = "No Filter"
}

@Component({
  selector: "app-display-truckservice",
  templateUrl: "./display-truckservice.component.html",
  styleUrls: ["./display-truckservice.component.scss"]
})
export class DisplayTruckserviceComponent
  implements OnInit, AfterViewInit, OnDestroy {
  //regoList = [];
  serviceList = [];
  filteredServiceList = [];
  reportBy: Array<string> = [FilterTypes.NoFilter, FilterTypes.Truck];
  serviceByFilter: string;
  filteredService = [];
  buttons: string[] = ["colvis", "print", "excel"];
  dtOptions: any = {};
  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger = new Subject();
  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  @ViewChild("dtTableElement", { static: false }) dtTableElement: ElementRef;

  constructor(
    private truckService: TruckService,
    private router: Router,
    private renderer: Renderer,
    private alert: AlertService,
    private confirmationDialogService: ConfirmationDialogService
  ) {}

  ngOnInit() {
    this.serviceByFilter = FilterTypes.Truck;
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      // Use this attribute to enable the responsive extension
      responsive: true,
      // Declare the use of the extension in the dom parameter
      dom: "Bfrtip",
      // Configure the buttons
      buttons: this.buttons,
      columns: []
    };
    this.dtOptions.order = [1, "desc"];
    //this.getTruckNameList();
  }

  ngAfterViewInit() {
    this.setDTColumns();
    this.getServiceList();
    this.renderer.listenGlobal(
      this.dtTableElement.nativeElement,
      "click",
      event => {
        if (event.target.hasAttribute("update-service")) {
          this.updateService(event.target.attributes["update-service"].value);
        } else if (event.target.hasAttribute("delete-service")) {
          this.deleteService(event.target.attributes["delete-service"].value);
        }
      }
    );
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  setDTColumns() {
    this.dtOptions.columns = [
      { data: "regoNum", title: "Rego Number", type: 1 },
      { data: "sDate", title: "Service Date", type: 1 },
      { data: "sKm", title: "Service Km", type: 1 },
      { data: "sFrom", title: "Service From", type: 1 },
      { data: "sNextDueDate", title: "Due Date", type: 1 },
      { data: "sNextDueKm", title: "Due Km", type: 1 },
      { data: "sDesc", title: "Description", type: 1 },
      { data: "tsID", title: "Actions", type: 2 }
    ];
    // if (FilterTypes.Truck === this.serviceByFilter) {
    //   this.dtOptions.columns.splice(1, 0, {
    //     data: "oldSDate",
    //     title: "Old Service Date",
    //     type: 1
    //   });
    // }
  }

  getServiceList() {
    this.serviceList = [];
    this.truckService.getServiceList().subscribe(
      val => {
        this.serviceList = val.response || [];
        // Calling the DT trigger to manually render the table
        // this.rerender();
        this.filterService();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve service details");
      }
    );
  }

  addService() {
    this.router.navigate(["/truckServices"]);
  }

  updateService(truckServiceID: number) {
    this.router.navigate(["/truckServices"], {
      queryParams: { tsID: btoa(truckServiceID.toString()) }
    });
  }

  deleteService(truckServiceID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this truck service?"
      },
      () => {
        this.truckService.deleteService(truckServiceID).subscribe(val => {
          if (val.status === 200) {
            this.alert.success("Details successfully deleted");
            this.serviceList = this.serviceList.filter(t => {
              return t.tsID != truckServiceID;
            });
          }
          this.alert.success("Details successfully deleted");
          this.filterService();
          // this.rerender();
        });
      },
      () => {
        // Do nothing if NO
      }
    );
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
  // rerender(): void {
  //   this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
  //     // Destroy the table first
  //     dtInstance.destroy();
  //     // Call the dtTrigger to rerender again
  //     this.dtTrigger.next();
  //   });
  // }
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
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

  filterService() {
    if (this.serviceByFilter === FilterTypes.Truck) {
      this.filteredServiceList = _.map(
        _.groupBy(this.serviceList, "regoNum"),
        (a, b) => {
          a = _.map(a, service => {
            service.soDate = new Date(service.sDate);
            return service;
          });
          let ser = _.get(_.orderBy(a, ["soDate"], ["desc"]), 0);
          // ser.oldSDate = _.get(
          //   _.get(_.orderBy(a, ["soDate"], ["desc"]), 1),
          //   "sDate"
          // );
          return ser;
        }
      );
    } else if (this.serviceByFilter === FilterTypes.NoFilter) {
      this.filteredServiceList = this.serviceList;
    }
    this.setDTColumns();
    this.rerender();
  }
}
