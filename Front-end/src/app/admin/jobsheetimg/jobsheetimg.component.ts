import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";

import { TripService, Trip } from "../../services/trip.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertService } from "../../alert/alert.service";
import { FileUploadService } from "../../services/file-upload.service";
import * as _ from "lodash";
import { DomSanitizer } from "@angular/platform-browser";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { HttpResponse } from "@angular/common/http";
"use strict";

@Component({
  selector: "app-jobsheetimg",
  templateUrl: "./jobsheetimg.component.html",
  styleUrls: ["./jobsheetimg.component.scss"]
})
export class JobsheetimgComponent implements OnInit {
  jobSheetImages = {};
  lodash = _;
  jobsheetimg: FormGroup;

  constructor(
    private formBuilder1: FormBuilder,
    private fileUpload: FileUploadService
  ) {}

  ngOnInit() {
    this.jobsheetimg = this.formBuilder1.group({
      sDate: [this.getDate(-7), [Validators.required]],
      eDate: [this.getDate(0), [Validators.required]]
    });
  }

  downloadFile(blob, fName) {
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(blob, fName);
    } else {
      const blobUrl = URL.createObjectURL(blob);
      var a = window.document.createElement("a");
      a.href = blobUrl;
      a.download = fName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  getDate(days: number): string {
    let date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().substring(0, 10);
  }

  downloadFIlteredReport() {
    this.fileUpload
      .downloadFilteredImages(this.jobsheetimg.value)
      .subscribe((resp: HttpResponse<Blob>) => {
        const blob = resp.body;
        const fName = `${+new Date()}.zip`;
        this.downloadFile(blob, fName);
      });
  }
}
