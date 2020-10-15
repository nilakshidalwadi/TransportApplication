import { Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { JobTypeService, JobDetail } from "src/app/services/job-type.service";
import { AlertService } from "src/app/alert/alert.service";

@Component({
  selector: "app-job-type",
  templateUrl: "./job-type.component.html",
  styleUrls: ["./job-type.component.scss"]
})
export class JobTypeComponent implements OnInit {
  jobTypeForm: FormGroup;
  jobType: string;
  jID: number;

  constructor(
    private formBuilder1: FormBuilder,
    private router: Router,
    private jobTypeService: JobTypeService,
    private route: ActivatedRoute,
    private alert: AlertService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params.jID) this.jID = Number(atob(params.jID));
    });
    this.jobType = "Add";
    if (this.jID) (this.jobType = "Update"), this.getJobDetails();
    this.initialiseForm();
  }

  initialiseForm(data?: JobDetail) {
    data = data || new JobDetail();
    this.jobTypeForm = this.formBuilder1.group({
      jId: [data.jID],
      jType: [data.jType, [Validators.required]],
      reportBy: [data.reportBy, [Validators.required]]
    });
  }

  getJobDetails() {
    this.jobTypeService.getJobDetails(this.jID).subscribe(
      val => {
        if (val.response.length === 1) this.initialiseForm(val.response[0]);
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retieve truck details");
      }
    );
  }

  addJob() {
    if (this.jID) {
      // * Update
      this.jobTypeService.updateJob(this.jID, this.jobTypeForm.value).subscribe(
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
      this.jobTypeService.addJob(this.jobTypeForm.value).subscribe(
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
