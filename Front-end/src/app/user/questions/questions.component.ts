import { Component, OnInit } from "@angular/core";
import { TripService } from "../../services/trip.service";
import { Router } from "@angular/router";
import { FormGroup, FormBuilder } from "@angular/forms";
import * as _ from "lodash";
import { AlertService } from "../../alert/alert.service";
import { FileUploadService } from "../../services/file-upload.service";

@Component({
  selector: "app-questions",
  templateUrl: "./questions.component.html",
  styleUrls: ["./questions.component.scss"]
})
export class QuestionsComponent implements OnInit {
  private tripID: number;
  questionList = [];
  queForm: FormGroup;
  typeList = [];
  answers = {};
  uploadedFiles = {};
  lodash = _;

  constructor(
    private formBuilder1: FormBuilder,
    private tripService: TripService,
    private router: Router,
    private alert: AlertService,
    private fileUpload: FileUploadService
  ) {
    // If checklist already completed
    if (
      this.tripService.currentTripValue &&
      this.tripService.currentTripValue.declaration &&
      this.tripService.currentTripValue.checklist
    ) {
      this.checklistComplete();
    }
    // If declaration not done
    if (
      !this.tripService.currentTripValue ||
      (this.tripService.currentTripValue &&
        !this.tripService.currentTripValue.declaration)
    ) {
      this.router.navigate(["/declaration"]);
    }
  }

  ngOnInit() {
    if (
      this.tripService.currentTripValue &&
      this.tripService.currentTripValue.declaration
    ) {
      this.tripID = this.tripService.currentTripValue.tripID;
    }
    this.queForm = this.formBuilder1.group({});

    this.getQuestionsList();
    this.getQuestionTypes();
  }

  getQuestionsList() {
    this.questionList = [];
    this.tripService.getQuestionsList().subscribe(
      val => {
        this.questionList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve question details");
      }
    );
  }

  getQuestionTypes() {
    this.tripService.getQuestionType().subscribe(
      val => {
        this.typeList = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve question details");
      }
    );
  }

  getQuestion(type: number): Array<string> {
    let options: Array<string> = _.get(
      _.map(
        _.filter(this.typeList, q => {
          return q.type === type;
        }),
        q => {
          return q.typeDesc.split("|~|");
        }
      ),
      0
    );
    return options;
  }

  updateAnswers() {
    // If all answers are not given
    if (this.isFormNotvalid()) return;

    let ans = _.map(_.keys(this.answers), key => {
      return { id: key, ans: this.answers[key] };
    });
    this.tripService.ansUpdated({ tripID: this.tripID, ans: ans }).subscribe(
      val => {
        if (val.status === 200 && val.response == this.questionList.length) {
          let currentTrip = this.tripService.currentTripValue;
          currentTrip.checklist = true;
          this.tripService.setTripData(currentTrip);
          if (_.keys(this.uploadedFiles).length > 0) {
            this.upload();
          } else {
            this.checklistComplete();
          }
        }
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to submit details");
      }
    );
  }

  private checklistComplete() {
    this.router.navigate(["/trip"]);
  }

  fileChange(event, type) {
    this.uploadedFiles[type] = _.get(event, "fileList");
  }

  upload() {
    let formData = new FormData();
    for (let que of _.keys(this.uploadedFiles)) {
      let uploadedFiles = this.uploadedFiles[que];
      for (let i = 0; i < uploadedFiles.length; i++) {
        formData.append(
          "uploads[]",
          _.get(uploadedFiles[i], "FileBlob"),
          `${this.tripID}|~|checklist|~|${que}|~|${_.get(
            uploadedFiles[i],
            "fileName"
          )}`
        );
      }
    }
    this.fileUpload.uploadFile(formData).subscribe(
      response => {
        console.log("response received is ", response);
        this.checklistComplete();
      },
      err => {
        this.alert.error("Unable to submit details");
      }
    );
  }

  isFormNotvalid(): boolean {
    let ans = _.keys(this.answers).length !== this.questionList.length;
    let imgReq = _.filter(
      _.filter(this.questionList, que => {
        return que.imgReq;
      }),
      q => {
        return (
          (this.answers[q["qID"]] || "").toLowerCase() ==
          (q.imgReq || "").toLowerCase()
        );
      }
    );
    let img = _.filter(imgReq, q => {
      return (
        !this.uploadedFiles[q["qID"]] ||
        (this.uploadedFiles[q["qID"]] &&
          this.uploadedFiles[q["qID"]].length == 0)
      );
    });
    return ans || img.length > 0;
  }
}
