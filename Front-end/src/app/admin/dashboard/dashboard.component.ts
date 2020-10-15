import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { TripService, Trip } from "../../services/trip.service";
import { AlertService } from "../../alert/alert.service";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"]
})
export class DashboardComponent implements OnInit {
  displayTripForm: FormGroup;
  tripList = [];

  constructor(
    private formBuilder1: FormBuilder,
    private tripService: TripService,
    private router: Router,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.displayTripForm = this.formBuilder1.group({
      regoNum: ["", [Validators.required]],
      driverName: ["", [Validators.required]],
      sKm: ["", [Validators.required]],
      eKm: ["", [Validators.required]],
      sLocation: ["", [Validators.required]]
    });
    this.getTripList();
  }

  getTripList() {
    this.tripList = [];
    this.tripService.getTripList().subscribe(
      val => {
        this.tripList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve trip details");
      }
    );
  }

  dateHourDifference(dt2, dt1) {
    if (!dt2 || !dt1) return 0;
    let date1, date2;

    date1 = new Date(dt2);
    date2 = new Date(dt1);

    let res = Math.abs(date1 - date2) / 1000;

    // get total days between two dates
    let days = Math.floor(res / 86400);

    /*
    *get hours
     ? If in hours by day use
     TODO % 24
    */
    let hours = Math.floor(res / 3600);

    // get minutes
    let minutes = Math.floor(res / 60) % 60;

    // get seconds
    let seconds = res % 60;
    return `${hours}:${minutes}:${seconds}`;
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

  retrieveTripDetails(tripID: number) {
    this.tripService.getTripDetails(tripID).subscribe(
      val => {
        if (val.status === 200 && val.response.length > 0) {
          let oldTrip = val.response[0];
          let trip = new Trip();
          trip.tripID = oldTrip.tripID;
          trip.declaration = oldTrip.declaration;
          trip.checklist = oldTrip.checklist;
          trip.started = oldTrip.tripStarted;
          trip.ended = oldTrip.tripEnded;
          trip.startKM = oldTrip.sKM;
          trip.startDate = oldTrip.sjTime;
          trip.jobBy = oldTrip.jobBy;
          this.tripService.setTripData(trip);
          this.router.navigate(["/trip"]);
        } else {
          this.alert.error("Unable to retrieve trip details");
        }
      },
      err => {
        this.alert.error("Unable to retrieve trip details");
      }
    );
  }
}
