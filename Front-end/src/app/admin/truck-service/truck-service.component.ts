import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { TruckService, ServiceDetail } from "../../services/truck.service";
import { Router, ActivatedRoute } from "@angular/router";
import { AlertService } from "../../alert/alert.service";

export class NgbdDropdownBasic {}

@Component({
  selector: "app-truck-service",
  templateUrl: "./truck-service.component.html",
  styleUrls: ["./truck-service.component.scss"]
})
export class TruckServiceComponent implements OnInit {
  truckServiceForm: FormGroup;
  regoList = [];
  tsID: number;
  serviceType: string;

  constructor(
    private formBuilder1: FormBuilder,
    private truckService: TruckService,
    private router: Router,
    private route: ActivatedRoute,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params.tsID) this.tsID = Number(atob(params.tsID));
    });
    this.serviceType = "Add";
    if (this.tsID) (this.serviceType = "Update"), this.getServiceDetails();
    this.getTruckNameList();

    this.initialiseForm();
  }

  initialiseForm(data?: ServiceDetail) {
    data = data || new ServiceDetail();
    this.truckServiceForm = this.formBuilder1.group({
      // tName: [data.tName, [Validators.required]],
      tID: [data.tID, [Validators.required]],
      sDate: [this.getDate(data.sDate), [Validators.required]],
      sKm: [data.sKm, [Validators.required]],
      sFrom: [data.sFrom, [Validators.required]],
      sNextDueDate: [this.getDate(data.sNextDueDate), []],
      sNextDueKm: [data.sNextDueKm, []],
      sDesc: [data.sDesc, []]
    });
  }

  getDate(d) {
    if (!d) return "";
    return new Date(d).toISOString().substring(0, 10);
  }

  getServiceDetails() {
    this.truckService.getServiceDetails(this.tsID).subscribe(
      val => {
        if (val.response.length === 1) this.initialiseForm(val.response[0]);
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve service details");
      }
    );
  }

  getTruckNameList() {
    this.regoList = [];
    this.truckService.getTruckNameList().subscribe(
      val => {
        this.regoList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve rego number list");
      }
    );
  }

  addTruckService() {
    if (this.tsID) {
      // * Update
      this.truckService
        .updateService(this.tsID, this.truckServiceForm.value)
        .subscribe(
          val => {
            if (val.status === 200)
              this.alert.success("Details are successfully submitted");
          },
          err => {
            console.warn(err);
            this.alert.error("Unable to submit details");
          }
        );
    } else {
      // * Insert new
      this.truckService.addTruckService(this.truckServiceForm.value).subscribe(
        val => {
          if (val.status === 200 && val.response >= 1) {
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
