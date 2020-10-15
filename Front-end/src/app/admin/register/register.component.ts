import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { UserService, UserDetail } from "../../services/user.service";
import { ActivatedRoute } from "@angular/router";
import { AlertService } from "../../alert/alert.service";
import { FileUploadService } from "../../services/file-upload.service";
import * as _ from "lodash";

@Component({
  selector: "app-register-component",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"]
})
export class RegisterComponent implements OnInit {
  userDetailForm: FormGroup;
  uID: number;
  userType: string;
  uploadedFiles = {};
  lodash = _;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private alert: AlertService,
    private route: ActivatedRoute,
    private fileUpload: FileUploadService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params.uID) this.uID = Number(atob(params.uID));
    });
    this.userType = "Add";
    if (this.uID) (this.userType = "Update"), this.getUserDetail();
    this.initialiseForm();
  }

  initialiseForm(data?: UserDetail) {
    data = data || new UserDetail();
    this.userDetailForm = this.formBuilder.group({
      uName: [data.uName, [Validators.required]],
      fName: [data.fName, [Validators.required]],
      lName: [data.lName, [Validators.required]],
      phoneNum: [data.phoneNum, [Validators.required]],
      address: [data.address, [Validators.required]],
      drivingLicence: [data.drivingLicence, [Validators.required]],
      licenceExpiryDate: [
        this.getDate(data.licenceExpiryDate),
        [Validators.required]
      ],
      inductionExpiryDate: [
        this.getDate(data.inductionExpiryDate),
        [Validators.required]
      ]
    });
  }

  getDate(d) {
    if (!d) return "";
    return new Date(d).toISOString().substring(0, 10);
  }

  getUserDetail() {
    this.userService.getUserDetails(this.uID).subscribe(
      val => {
        if (val.response.length === 1) this.initialiseForm(val.response[0]);
      },
      err => {
        console.warn(err);
      }
    );
  }

  driver() {
    if (this.uID) {
      // * Update
      this.userService
        .updateUser(this.uID, this.userDetailForm.value)
        .subscribe(
          val => {
            if (val.status === 200) {
              this.alert.success("Details are successfully submitted");
              this.upload();
            } else if (val.status === 400)
              this.alert.error("Username already exists");
          },
          err => {
            console.warn(err);
            this.alert.error("Unable to submit details");
          }
        );
    } else {
      // * Insert new
      this.userService.addUser(this.userDetailForm.value).subscribe(
        val => {
          if (val.status === 200 && val.response > 0) {
            this.uID = val.response;
            this.upload();
            this.alert.success("Details are successfully submitted");
            this.initialiseForm();
          } else if (val.status === 400)
            this.alert.error("Username already exists");
        },
        err => {
          console.warn(err);
          this.alert.error("Unable to submit details");
        }
      );
    }
  }

  fileChange(event) {
    this.uploadedFiles["userDocs"] = _.get(event, "fileList");
  }

  upload() {
    let formData = new FormData();
    for (let type of _.keys(this.uploadedFiles)) {
      let uploadedFiles = this.uploadedFiles[type];
      for (let i = 0; i < uploadedFiles.length; i++) {
        formData.append(
          "uploads[]",
          _.get(uploadedFiles[i], "FileBlob"),
          `|~|${type}|~|${this.uID}|~|${_.get(uploadedFiles[i], "fileName")}`
        );
      }
    }
    this.fileUpload.uploadFile(formData).subscribe(
      response => {
        console.log("response received is ", response);
      },
      err => {
        this.alert.error("Unable to submit details");
      }
    );
  }
}
