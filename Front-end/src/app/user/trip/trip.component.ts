import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  AbstractControl,
  FormArray
} from "@angular/forms";
import { TruckService } from "../../services/truck.service";
import { AuthService } from "../../auth/auth.service";
import { TripService, Trip } from "../../services/trip.service";
import { Router } from "@angular/router";
import { AlertService } from "../../alert/alert.service";
import { FileUploadService } from "../../services/file-upload.service";
import * as _ from "lodash";
import * as moment from "moment";
import { JobTypeService } from "../../services/job-type.service";
import { debounceTime, startWith } from "rxjs/operators";
import { combineLatest } from "rxjs";

const JOB_TYPE: string = "selectedJType";
const REGO_NUM: string = "selectedRegoNumber";

@Component({
  selector: "app-trip",
  templateUrl: "./trip.component.html",
  styleUrls: ["./trip.component.scss"]
})
export class TripComponent implements OnInit {
  tripForm: FormGroup;
  private tripID: number;
  regoList = [];
  jobList = [];
  public lat;
  public long;
  lodash = _;
  currentTrip: Trip;
  uploadedFiles = {};
  public busySaving: boolean = false;

  private updatingDropDetails: number = -1;

  constructor(
    private formBuilder1: FormBuilder,
    private truckService: TruckService,
    private jobtypeService: JobTypeService,
    private tripService: TripService,
    public auth: AuthService,
    private router: Router,
    private fileUpload: FileUploadService,
    private alert: AlertService
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

    this.currentTrip = this.tripService.currentTripValue;
    // If declaration not done
    if (
      !this.currentTrip ||
      (this.currentTrip && !this.currentTrip.declaration)
    ) {
      this.router.navigate(["/declaration"]);
    }

    // If checklist not done
    if (this.currentTrip && !this.currentTrip.checklist) {
      this.router.navigate(["/checklist"]);
    }

    this.tripService.currentTrip.subscribe(trip => {
      this.currentTrip = trip;
    });

    // If trip ended
    if (this.currentTrip && this.currentTrip.ended) {
      this.tripService.setTripData(null);
      if (!this.auth.isAdmin) this.router.navigate(["/declaration"]);
    }
    this.tripID = this.tripService.currentTripValue.tripID;
  }

  ngOnInit() {
    this.initializeTripForm();
  }

  extraFormValidation(c: AbstractControl) {
    // Start time can not be less than current time - 2 hours
    if (!c.get("startKM").value || !c.get("startDate").value) {
      if (
        new Date(c.get("jTimeStart").value) <
          new Date(c.get("startDate").value) ||
        new Date(c.get("jTimeStart").value) >
          new Date(c.get("lastEndtDate").value)
      ) {
        return { invalidEndDate: true };
      }
      return null;
    }
    // End KM can not be less than start KM
    // End time can not be less than start time and not more than next 24 hours
    if (
      c.get("oMeter").value >= c.get("startKM").value &&
      new Date(c.get("jTimeStart").value) >=
        new Date(c.get("startDate").value) &&
      new Date(c.get("jTimeStart").value) <=
        new Date(c.get("lastEndtDate").value)
    ) {
      return null;
    }
    // if valid, return null,
    // if invalid, return an error object (any arbitrary name), like,
    return { invalidEndDate: true };
    // make sure it always returns a 'null' for valid or non-relevant cases, and a 'non-null' object for when an error should be raised on the formGroup
  }

  initializeTripForm() {
    this.tripForm = this.formBuilder1.group(
      {
        jType: [""],
        fLoad: ["0"],
        load: ["0"],
        dropNum: ["0"],
        loadNum: ["0"],
        delivery: ["0"],
        regoNum: ["", [Validators.required]],
        oMeter: ["", [Validators.required]],
        jTimeStart: ["", [Validators.required]],
        startOmeterImg: [""],
        sLocation: [""],
        startKM: [this.currentTrip.startKM],
        startDate: [
          new Date(
            this.currentTrip.startDate ||
              new Date(new Date().setHours(new Date().getHours() - 2))
          )
        ],
        lastEndtDate: [
          new Date(new Date().setHours(new Date().getHours() + 24))
        ],
        palletDetails: this.formBuilder1.array([])
      },
      { validator: this.extraFormValidation }
    );

    // Load rego number list if trip is not started
    if (this.currentTrip && !this.currentTrip.started) {
      this.getTruckNameList();
      this.getJobTypeList();
    } else {
      // Set trip ID in rego number for future use
      this.tripForm.get("regoNum").setValue(this.currentTrip.tripID);
      this.tripForm.get("jType").setValue(this.currentTrip.jobBy);

      this.tripForm.get("loadNum").valueChanges.subscribe(loadNum => {
        if (
          loadNum == null ||
          loadNum < 0 ||
          loadNum === this.palletDetails.length
        ) {
          return;
        }

        // To prevent old data
        if (loadNum > this.palletDetails.length) {
          loadNum = loadNum - this.palletDetails.length;
        } else {
          loadNum = this.palletDetails.length - loadNum;
          let arr = new Array(loadNum).fill(0);
          _.forEach(arr, (val, idx) => {
            console.log(this.palletDetails.value);
            delete this.uploadedFiles[`loadImage_${this.palletDetails.length}`];
            this.palletDetails.removeAt(this.palletDetails.length - 1);
          });
          return;
        }

        let arr = new Array(loadNum).fill(0);

        for (let pd of arr) {
          const itemToAdd = this.formBuilder1.group({
            groupIndex: "",
            dropNum: 0,
            dropDetail: this.formBuilder1.array([])
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
          itemToAdd.get("groupIndex").patchValue(this.palletDetails.length);

          this.palletDetails.push(itemToAdd);
        }
      });
    }
  }

  onPalletDropValueChanged(groupIndex, dropNum): void {
    let dropDetails: FormArray = this.dropDetails(groupIndex);

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

    for (let pd of arr) {
      dropDetails.push(this.formBuilder1.group({ nDpallet: 0, nFpallet: 0 }));
    }
  }

  get palletDetails() {
    return this.tripForm.get("palletDetails") as FormArray;
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
        this.tripForm
          .get("regoNum")
          .setValue(atob(localStorage.getItem(REGO_NUM) || ""));
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
        // get job type in localstorage
        this.tripForm
          .get("jType")
          .setValue(atob(localStorage.getItem(JOB_TYPE) || ""));
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }

  startTrip() {
    if (this.isStartFormNotvalid()) {
      return;
    }
    this.busySaving = true;
    if (_.keys(this.uploadedFiles).length > 0) {
      this.upload("start");
    } else {
      this.saveStartTrip();
    }
  }

  saveStartTrip() {
    this.getLocation((lat, long) => {
      let details = this.tripForm.value;
      details["sLocation"] = `${lat},${long}`;
      details["tripID"] = this.currentTrip.tripID;
      // set job type in localstorage
      localStorage.setItem(JOB_TYPE, btoa(details["jType"]));
      localStorage.setItem(REGO_NUM, btoa(details["regoNum"]));

      this.tripService.startTrip(details).subscribe(
        val => {
          if (val.status == 200) {
            this.tripStarted();
          }
        },
        err => {
          console.warn(err);
          this.alert.error("Unable to submit details");
          this.busySaving = false;
        }
      );
    });
  }

  tripStarted() {
    this.currentTrip.started = true;
    this.currentTrip.startKM = this.tripForm.get("oMeter").value;
    this.currentTrip.startDate = new Date(
      this.tripForm.get("jTimeStart").value
    );

    let currentJobType = this.tripForm.get("jType").value;
    this.currentTrip.jobBy = _.get(
      _.get(
        _.filter(this.jobList, j => {
          return j.jID == currentJobType;
        }),
        0
      ),
      "jobBy"
    );

    this.tripService.setTripData(this.currentTrip);
    this.uploadedFiles = {};
    // Reset form for end trip
    this.initializeTripForm();
    this.busySaving = false;
    this.alert.success("Trip Started");
  }

  endTrip() {
    if (this.isEndFormNotvalid()) {
      return;
    }
    this.busySaving = true;
    if (_.keys(this.uploadedFiles).length > 0) {
      this.upload("end");
    } else {
      this.saveEndTrip();
    }
  }

  saveEndTrip() {
    this.getLocation((lat, long) => {
      let details = this.tripForm.value;
      details["eLocation"] = `${lat},${long}`;
      this.tripService.endTrip(details).subscribe(
        val => {
          if (val.status == 200) {
            this.tripEnded();
          }
        },
        err => {
          console.warn(err);
          this.alert.error("Unable to submit details");
          this.busySaving = false;
        }
      );
    });
  }

  tripEnded() {
    // If admin redirect to dashboard
    if (this.auth.isAdmin) {
      // reset trip details
      this.tripService.setTripData(null);
      this.busySaving = false;
      // redirect
      this.router.navigate(["/"]);
    } else {
      this.notYou();
    }
    this.uploadedFiles = {};
  }

  notYou() {
    this.auth.logout();
  }

  getLocation(callback) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: Position) => {
          if (position) {
            this.lat = position.coords.latitude;
            this.long = position.coords.longitude;
            callback(this.lat, this.long);
          }
        },
        (error: PositionError) => console.log(error)
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  }

  fileChange(event, type) {
    this.uploadedFiles[type] = _.get(event, "fileList");
  }

  upload(tripType: string) {
    let uploadFile = [];
    _.forEach(_.keys(this.uploadedFiles), type => {
      _.forEach(this.uploadedFiles[type], (fileToUpload, idx) => {
        let formData = new FormData();
        formData.append(
          "uploads[]",
          _.get(fileToUpload, "FileBlob"),
          `${this.tripID}|~|${type}|~|${_.get(fileToUpload, "fileName")}`
        );
        uploadFile.push(this.fileUpload.uploadFile(formData));
      });
    });

    combineLatest(uploadFile).subscribe(
      response => {
        console.log("response received is ", response);
        if (tripType === "start") {
          this.saveStartTrip();
        } else if (tripType === "end") {
          this.saveEndTrip();
        }
      },
      err => {
        this.alert.error("Unable to submit details");
        this.busySaving = false;
      }
    );
  }

  isStartFormNotvalid(): boolean {
    let imgReq = ["startOdometer"];
    let img = _.filter(imgReq, image => {
      return (
        !this.uploadedFiles[image] ||
        (this.uploadedFiles[image] && this.uploadedFiles[image].length == 0)
      );
    });

    return (
      this.tripForm.invalid ||
      !this.tripForm.get("jType").value ||
      img.length > 0
    );
  }

  isEndFormNotvalid(): boolean {
    let imgReq = ["endOdometer", "jobSheet"];
    if (this.currentTrip.jobBy == "Pallet") {
      let totalLoad = this.tripForm.get("loadNum").value;
      // If pallet, than load should not be 0
      if (!totalLoad || totalLoad <= 0) {
        return true;
      }
      for (let i = 0; i < totalLoad; i++) {
        imgReq.push(`loadImage_${i + 1}`);
      }
    }
    let img = _.filter(imgReq, image => {
      return (
        !this.uploadedFiles[image] ||
        (this.uploadedFiles[image] && this.uploadedFiles[image].length == 0)
      );
    });
    // console.log(this.tripForm, this.tripForm.invalid, img.length);
    return this.tripForm.invalid || img.length > 0;
  }

  toDateTimeString(date: Date): string {
    if (!date) return "";
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    return (
      this.str_pad_left(day, "0", 2) +
      " " +
      monthNames[monthIndex] +
      " " +
      year +
      ", " +
      this.str_pad_left(date.getHours(), "0", 2) +
      ":" +
      this.str_pad_left(date.getMinutes(), "0", 2)
    );
  }

  private str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  }
}
