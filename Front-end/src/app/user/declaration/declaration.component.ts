import { Component, OnInit } from "@angular/core";
import {
  FormGroup,
  FormBuilder,
  Validators,
  ValidatorFn,
  ValidationErrors
} from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { TripService, Trip } from "../../services/trip.service";
import { AlertService } from "../../alert/alert.service";

@Component({
  selector: "app-declaration",
  templateUrl: "./declaration.component.html",
  styleUrls: ["./declaration.component.scss"]
})
export class DeclarationComponent implements OnInit {
  declareForm: FormGroup;
  public userName: string = "";

  constructor(
    private router: Router,
    private formBuilder1: FormBuilder,
    private auth: AuthService,
    private tripService: TripService,
    private alert: AlertService
  ) {
    // If declaration already completed
    // if (
    //   this.tripService.currentTripValue &&
    //   this.tripService.currentTripValue.declaration
    // ) {
    //   this.declarationComplete();
    // } else {
    let userDetails = this.auth.currentUserValue;
    this.userName = `${userDetails.firstName} ${userDetails.lastName}`.toUpperCase();
    this.tripService.getUserTrip(userDetails.id).subscribe(val => {
      if (val.response.length > 0) {
        let oldTrip = val.response[0];
        let trip = new Trip();
        trip.tripID = oldTrip.tripID;
        trip.declaration = oldTrip.declaration;
        trip.checklist = oldTrip.checklist;
        trip.jobBy = oldTrip.jobBy;
        trip.started = oldTrip.tripStarted;
        trip.ended = oldTrip.tripEnded;
        trip.startKM = oldTrip.sKM;
        trip.startDate = oldTrip.sjTime;
        this.tripService.setTripData(trip);

        if (trip.ended) {
          // Do nothing
          this.tripService.setTripData(null);
        } else if ((!trip.ended && trip.started) || trip.checklist) {
          this.router.navigate(["/trip"]);
        } else if (trip.declaration) {
          this.declarationComplete();
        }
      }
    });
    // }
  }

  validateIfChecked(): ValidatorFn {
    return (form: FormGroup): ValidationErrors | null => {
      const declare = form.get("declare").value;
      if (!declare) {
        return {
          err: true
        };
      }
      return null;
    };
  }

  ngOnInit() {
    this.declareForm = this.formBuilder1.group(
      {
        declare: ["", [Validators.requiredTrue]]
      }
      // { validators: this.validateIfChecked() }
    );
  }

  next() {
    if (this.declareForm.invalid) return null;
    this.tripService.declaration().subscribe(
      val => {
        if (val.status === 200 && val.response > 0) {
          this.tripService.setTripData({
            tripID: val.response,
            declaration: true
          });
          this.declarationComplete();
        }
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }

  private declarationComplete() {
    this.router.navigate(["/checklist"]);
  }
}
