import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { TruckService, TruckDetail } from "../../services/truck.service";
import { ActivatedRoute } from "@angular/router";
import { AlertService } from "../../alert/alert.service";

@Component({
  selector: "app-truck",
  templateUrl: "./truck.component.html",
  styleUrls: ["./truck.component.scss"]
})
export class TruckComponent implements OnInit {
  truckForm: FormGroup;
  tID: number;
  truckType: string;

  constructor(
    private formBuilder1: FormBuilder,
    private truckService: TruckService,
    private route: ActivatedRoute,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params.tID) this.tID = Number(atob(params.tID));
    });
    this.truckType = "Add";
    if (this.tID) (this.truckType = "Update"), this.getTruckDetails();
    this.initialiseForm();
  }

  initialiseForm(data?: TruckDetail) {
    data = data || new TruckDetail();
    this.truckForm = this.formBuilder1.group({
      regoNum: [data.regoNum, [Validators.required]],
      cName: [data.cName, [Validators.required]],
      model: [data.model, [Validators.required]],
      maftYear: [data.maftYear, [Validators.required]]
    });
  }

  getTruckDetails() {
    this.truckService.getTruckDetails(this.tID).subscribe(
      val => {
        if (val.response.length === 1) this.initialiseForm(val.response[0]);
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retieve truck details");
      }
    );
  }

  addTruck() {
    if (this.tID) {
      // * Update
      this.truckService.updateTruck(this.tID, this.truckForm.value).subscribe(
        val => {
          if (val.status === 200 && val.response > 0)
            this.alert.success("Details are successfully submitted");
        },
        err => {
          console.warn(err);
          this.alert.error("Unable to submit details");
        }
      );
    } else {
      // * Insert new
      this.truckService.addTruck(this.truckForm.value).subscribe(
        val => {
          if (val.status === 200 && val.response > 0) {
            this.alert.success("Details are successfully submitted");
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
}
