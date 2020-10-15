import { Component, OnInit } from "@angular/core";
import { TripService, Trip, TripDetail } from "../../services/trip.service";
import { TruckService } from "../../services/truck.service";

import { AlertService } from "../../alert/alert.service";
import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  FormArray
} from "@angular/forms";
import * as moment from "moment";
import * as _ from "lodash";
import { FileUploadService } from "../../services/file-upload.service";
import { JobTypeService } from "src/app/services/job-type.service";
import { debounceTime } from "rxjs/operators";
import { combineLatest, Subscription } from "rxjs";

const JOB_TYPE: string = "selectedJType";
const EXTRA_DROP: string = "extraDrop";

@Component({
  selector: "app-edit-trip",
  templateUrl: "./edit-trip.component.html",
  styleUrls: ["./edit-trip.component.scss"]
})
export class EditTripComponent implements OnInit {
  editTripForm: FormGroup;
  tripData = [];
  tripID: number;
  regoList = [];
  jobList = [];
  userList = [];
  zoneList = [];
  uploadedFiles = {};
  lodash = _;

  actionType = "Update";

  showZoneDropdown: { [key: string]: boolean } = {};

  changesSubscriber: { [key: string]: Subscription } = {};

  constructor(
    private formBuilder: FormBuilder,
    private truckService: TruckService,
    private jobtypeService: JobTypeService,
    private tripService: TripService,
    private route: ActivatedRoute,
    private fileUpload: FileUploadService,
    private alert: AlertService,
    private router: Router
  ) {
    moment.locale("en-AU", {
      longDateFormat: {
        LT: "HH:mm",
        LTS: "HH:mm:ss",
        L: "DD/MM/YYYY",
        LL: "D MMMM YYYY",
        LLL: "D MMMM YYYY HH:mm",
        LLLL: "dddd D MMMM YYYY HH:mm"
      }
    });

    this.tripID = +this.route.snapshot.paramMap.get("tpID");
  }

  ngOnInit() {
    if (this.tripID === 0) {
      this.actionType = "Add";
      this.initialiseForm();
    } else {
      this.getTripData();
    }
  }

  extraFormValidation(c: AbstractControl) {
    if (
      c.get("eKm").value >= c.get("sKm").value &&
      new Date(c.get("ejTime").value) >= new Date(c.get("sjTime").value)
    ) {
      return null;
    }
    // if valid, return null,
    // if invalid, return an error object (any arbitrary name), like,
    return { invalidEndDate: true };
    // make sure it always returns a 'null' for valid or non-relevant cases, and a 'non-null' object for when an error should be raised on the formGroup
  }

  initialiseForm(tData?: TripDetail) {
    let data = tData || new TripDetail();
    if (!tData) data.palletDetails = this.formBuilder.array([]);
    this.editTripForm = this.formBuilder.group(
      {
        truckID: [data.truckID, [Validators.required]],
        jType: [data.jID, [Validators.required]],
        userID: [],
        driverName: [data.driverName],
        sKm: [data.sKm, [Validators.required]],
        eKm: [data.eKm, [Validators.required]],
        wHrs: [data.wHrs, []],
        sjTime: ["", [Validators.required]],
        ejTime: ["", [Validators.required]],
        fLoad: [data.fLoad],
        load: [data.load],
        delivery: [data.delivery],
        jobBy: [data.jobBy],
        loadNum: [data.loadNum],
        palletDetails: data.palletDetails
      },
      { validator: this.extraFormValidation }
    );
    if (tData) {
      this.editTripForm.get("sjTime").setValue(new Date(data.sjTime));
      this.editTripForm.get("ejTime").setValue(new Date(data.ejTime));
    }
    this.getTruckNameList();
    this.getUserList();
    this.getZoneNameList();
    this.getJobTypeList();

    if (this.changesSubscriber["jType"])
      this.changesSubscriber["jType"].unsubscribe();

    this.changesSubscriber["jType"] = this.editTripForm
      .get("jType")
      .valueChanges.subscribe(val => {
        let jobBy = this.editTripForm.get("jobBy");
        jobBy.setValue(
          _.get(
            _.get(
              _.filter(this.jobList, j => {
                return j.jID == val;
              }),
              0
            ),
            "jobBy"
          )
        );
      });

    if (this.changesSubscriber["loadNum"])
      this.changesSubscriber["loadNum"].unsubscribe();

    this.changesSubscriber["loadNum"] = this.editTripForm
      .get("loadNum")
      .valueChanges.pipe(debounceTime(200))
      .subscribe(loadNum => {
        this.addPallet(loadNum, {});
      });
  }

  onPalletDropValueChanged(groupIndex, dropNum): void {
    this.addDrop(groupIndex, dropNum, {});
  }

  private addPallet(loadNum: number, options: any) {
    let palletDetails = options["palletDetails"] || this.palletDetails;

    if (loadNum == null || loadNum < 0 || loadNum === palletDetails.length) {
      return;
    }

    // To prevent old data
    if (loadNum > palletDetails.length) {
      loadNum = loadNum - palletDetails.length;
    } else {
      let arr = new Array(loadNum).fill(0);
      _.forEach(arr, (val, idx) => {
        palletDetails.removeAt(palletDetails.length - 1);
      });
      return;
    }

    let arr = new Array(loadNum).fill(0);
    _.forEach(arr, (val, idx) => {
      let drops = _.get(_.get(_.get(options, "data"), idx), "dropNum") || 0;
      let extraDropNum =
        _.get(_.get(_.get(options, "data"), idx), "extraDropNum") || 0;
      let extraRate =
        _.get(_.get(_.get(options, "data"), idx), "extraRate") ||
        +localStorage.getItem(EXTRA_DROP) ||
        0;
      const itemToAdd = this.formBuilder.group({
        groupIndex: "",
        dropNum: drops,
        extraDropNum: extraDropNum,
        extraRate: extraRate,
        dropDetail: this.formBuilder.array([])
      });

      //subscribe to valueChanges
      combineLatest([
        itemToAdd.get("groupIndex").valueChanges,
        itemToAdd.get("dropNum").valueChanges
      ])
        .pipe(debounceTime(200))
        .subscribe(([groupIndex, dropNum]) =>
          this.onPalletDropValueChanged(groupIndex, dropNum)
        );

      //set groupIndex
      itemToAdd.get("groupIndex").patchValue(palletDetails.length);

      // Load drop details if any
      if (drops > 0) {
        this.addDrop(
          itemToAdd.get("groupIndex").value,
          itemToAdd.get("dropNum").value,
          {
            dropDetails: itemToAdd.get("dropDetail"),
            data: _.get(_.get(_.get(options, "data"), idx), "dropDetails") || []
          }
        );
      }
      palletDetails.push(itemToAdd);
    });
  }

  private addDrop(groupIndex: number, dropNum: number, options: any) {
    let dropDetails: FormArray =
      options["dropDetails"] || this.dropDetails(groupIndex);
    if (dropNum == null || dropNum < 0 || dropNum === dropDetails.length) {
      return;
    }

    // To prevent old data
    if (dropNum > dropDetails.length) {
      dropNum = dropNum - dropDetails.length;
    } else {
      dropNum = dropDetails.length - dropNum;
      let arr = new Array(dropNum).fill(0);
      _.forEach(arr, (val, idx) => {
        dropDetails.removeAt(dropDetails.length - 1);
      });
      return;
    }

    let arr = new Array(dropNum).fill(0);

    _.forEach(arr, (val, idx) => {
      let data = _.get(_.get(options, "data"), idx) || {};

      const itemToAdd = this.formBuilder.group({
        groupIndex: "",
        zone: _.get(data, "zone") || "",
        nDpallet: _.get(data, "nDpallet") || 0,
        nFpallet: _.get(data, "nFpallet") || 0,
        rDpallet: _.get(data, "rDpallet") || 0,
        rFpallet: _.get(data, "rFpallet") || 0
      });

      //subscribe to valueChanges
      combineLatest([
        itemToAdd.get("groupIndex").valueChanges,
        itemToAdd.get("zone").valueChanges
      ])
        .pipe(debounceTime(200))
        .subscribe(([groupIndex, zone]) => {
          let selectedZone = _.get(
            _.filter(this.zoneList, z => z.zID == zone),
            0
          );
          itemToAdd
            .get("rDpallet")
            .setValue(_.get(selectedZone, "rDpallet") || 0);
          itemToAdd
            .get("rFpallet")
            .setValue(_.get(selectedZone, "rFpallet") || 0);
        });

      //set groupIndex
      itemToAdd.get("groupIndex").patchValue(dropDetails.length);
      dropDetails.push(itemToAdd);
    });
  }

  get palletDetails() {
    return this.editTripForm.get("palletDetails") as FormArray;
  }
  public dropDetails(groupIndex): FormArray {
    const myFormArray = this.palletDetails.controls[groupIndex];
    return myFormArray.get("dropDetail") as FormArray;
  }

  getTruckNameList() {
    this.regoList = [];
    this.truckService.getTruckNameList().subscribe(
      val => {
        this.regoList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }
  getJobTypeList() {
    this.jobList = [];
    this.jobtypeService.getJobTypeList().subscribe(
      val => {
        this.jobList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }
  getUserList() {
    this.userList = [];
    this.truckService.getUserList().subscribe(
      val => {
        this.userList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }

  getZoneNameList() {
    this.zoneList = [];
    this.truckService.getZoneNameList().subscribe(
      val => {
        this.zoneList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }

  getTripData() {
    this.tripService.getTripData(this.tripID).subscribe(
      val => {
        if (val && val.status == 200 && val.response[0]) {
          this.tripData = val.response;
          let palletDetails = [];
          for (let td of this.tripData) {
            palletDetails.push({
              loadNum: td.loadNum,
              dropNum: td.dropNum,
              nDpallet: td.dryPallet,
              nFpallet: td.fridgePallet,
              rDpallet: td.dryPalletRate,
              rFpallet: td.fridgePalletRate,
              zone: td.zone,
              extraDropNum: td.extraDropNum,
              extraRate: td.extraRate
            });
          }

          let palletFormArray = this.formBuilder.array([]);

          this.tripData[0]["loadNum"] = _.size(
            _.groupBy(palletDetails, "loadNum")
          );
          this.tripData[0]["palletDetails"] = palletFormArray;

          let loadDetails = [];
          _.forEach(_.groupBy(palletDetails, "loadNum"), drops => {
            let filteredDrops = _.filter(drops, t => t.dropNum !== 0);
            let extraDrop = _.get(
              _.filter(drops, t => t.extraDropNum > 0),
              0
            );
            loadDetails.push({
              dropNum: _.size(filteredDrops),
              extraDropNum: _.get(extraDrop, "extraDropNum"),
              extraRate: _.get(extraDrop, "extraRate"),
              dropDetails: filteredDrops
            });
          });

          this.addPallet(this.tripData[0]["loadNum"], {
            palletDetails: palletFormArray,
            data: loadDetails
          });

          this.initialiseForm(this.tripData[0]);
        }
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve trip details");
      }
    );
  }

  getDate(d) {
    if (!d) return "";
    return new Date(d);
  }

  updateTrip() {
    let extraDropRate: string = _.get(
      _.get(
        _.filter(
          _.get(this.editTripForm.value, "palletDetails"),
          pd => pd.extraRate > 0
        ),
        0
      ),
      "extraRate"
    );
    localStorage.setItem(EXTRA_DROP, extraDropRate);
    if (this.tripID) {
      // * Update
      this.tripService
        .updateTrip(this.tripID, this.editTripForm.value)
        .subscribe(
          val => {
            if (val.status === 200 && val.response > 0) {
              this.alert.success("Details are successfully submitted");
              this.upload();
            }
          },
          err => {
            console.warn(err);
            this.alert.error("Unable to submit details");
          }
        );
    } else {
      // * Insert new
      this.tripService.addTrip(this.editTripForm.value).subscribe(
        val => {
          if (val.status === 200 && val.response > 0) {
            this.alert.success("Details are successfully submitted");
            this.tripID = val.response;
            this.upload();
            this.initialiseForm();
          }
        },
        err => {
          console.warn(err);
          this.alert.error("Unable to submit details");
        }
      );
    }
  }

  fileChange(event, type) {
    this.uploadedFiles[type] = _.get(event, "fileList");
  }

  upload() {
    let formData = new FormData();
    let y = this.uploadedFiles;

    for (let type of _.keys(y)) {
      let uploadedFiles = this.uploadedFiles[type];
      for (let i = 0; i < uploadedFiles.length; i++) {
        formData.append(
          "uploads[]",
          _.get(uploadedFiles[i], "FileBlob"),
          `${this.tripID}|~|${type}|~|${_.get(uploadedFiles[i], "fileName")}`
        );
      }
    }

    this.fileUpload.uploadFile(formData).subscribe(
      response => {
        if (response && response.status == 200) {
          this.tripUpdated();
        }
      },
      err => {
        this.alert.error("Unable to submit details");
      }
    );
  }

  private tripUpdated() {
    setTimeout(() => {
      this.router.navigate(["/report"]);
    }, 5000);
  }

  public toggleZoneDropdown(event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    this.showZoneDropdown[id] = !this.showZoneDropdown[id];
  }

  public onZoneSearch(event, id: string) {
    event.stopPropagation();
    event.preventDefault();
    let filter: string = _.toLower(event.target.value);
    let options = _.get(_.get($(`#${id}`), 0), "options") || [];
    _.forEach(options, z => {
      if ((filter && _.toLower(z.text).indexOf(filter) > -1) || !filter) {
        z.style.display = "block";
      } else {
        z.style.display = "none";
      }
    });
  }
}
