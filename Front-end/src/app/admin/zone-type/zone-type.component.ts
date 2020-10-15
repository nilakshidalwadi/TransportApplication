import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import {
  JobTypeService,
  JobDetail,
  ZoneDetail
} from "src/app/services/job-type.service";
import { AlertService } from "src/app/alert/alert.service";

@Component({
  selector: "app-zone-type",
  templateUrl: "./zone-type.component.html",
  styleUrls: ["./zone-type.component.scss"]
})
export class ZoneTypeComponent implements OnInit {
  zoneTypeForm: FormGroup;
  zoneType: string;
  zID: number;

  constructor(
    private formBuilder1: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private jobTypeService: JobTypeService,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params.zID) this.zID = Number(atob(params.zID));
    });
    this.zoneType = "Add";
    if (this.zID) (this.zoneType = "Update"), this.getZoneDetails();
    this.initialiseForm();
  }

  initialiseForm(data?: ZoneDetail) {
    data = data || new ZoneDetail();
    this.zoneTypeForm = this.formBuilder1.group({
      zId: [data.zID],
      zNumber: [data.zNumber, [Validators.required]],
      zName: [data.zName, [Validators.required]],
      rDpallet: [data.rDpallet || 0, [Validators.required]],
      rFpallet: [data.rFpallet || 0, [Validators.required]],
      applyToAll: [true]
    });
  }
  getZoneDetails() {
    this.jobTypeService.getZoneDetails(this.zID).subscribe(
      val => {
        if (val.response.length === 1) this.initialiseForm(val.response[0]);
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retieve truck details");
      }
    );
  }

  addZone() {
    if (this.zID) {
      // * Update
      this.jobTypeService
        .updateZone(this.zID, this.zoneTypeForm.value)
        .subscribe(
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
      this.jobTypeService.addZone(this.zoneTypeForm.value).subscribe(
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
