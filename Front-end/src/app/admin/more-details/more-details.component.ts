import { Component, OnInit } from "@angular/core";
import { TripService, Trip } from "../../services/trip.service";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertService } from "../../alert/alert.service";
import { FileUploadService } from "../../services/file-upload.service";
import * as _ from "lodash";
import { DomSanitizer } from "@angular/platform-browser";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import FileSaver from "file-saver";

"use strict";

@Component({
  selector: "app-more-details",
  templateUrl: "./more-details.component.html",
  styleUrls: ["./more-details.component.scss"]
})
export class MoreDetailsComponent implements OnInit {
  checklistData = [];
  tripData = [];
  tripImages = {};
  tripID: number;
  lodash = _;
  palletDetails = {};

  constructor(
    private tripService: TripService,
    private alert: AlertService,
    private upload: FileUploadService,
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
    private confirmationDialogService: ConfirmationDialogService,
    private fileUpload: FileUploadService
  ) {
    this.tripID = +this.route.snapshot.paramMap.get("tpID");
  }

  ngOnInit() {
    this.getChecklistData();
    this.getTripData();
    this.getTripImagesData();
  }

  getChecklistData() {
    this.checklistData = [];
    this.tripService.getChecklistData(this.tripID).subscribe(
      val => {
        this.checklistData = val.response || [];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve question details");
      }
    );
  }

  getTripData() {
    this.tripService.getTripData(this.tripID).subscribe(
      val => {
        console.log(val);
        this.tripData = val.response || [];
        let palletDetails = [];
        for (let td of this.tripData) {
          palletDetails.push({
            loadNum: td.loadNum,
            dropNum: td.dropNum,
            nDpallet: td.dryPallet,
            nFpallet: td.fridgePallet,
            zone: `${td.zoneNumber || "-"} : ${td.zoneName || "-"}`
          });
        }
        this.palletDetails = _.groupBy(palletDetails, "loadNum");
        _.forEach(this.palletDetails, (trip, tripID) => {
          this.palletDetails[tripID] = _.filter(trip, t => t.dropNum !== 0);
        });
        this.tripData = [_.get(this.tripData, 0)];
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve trip details");
      }
    );
  }

  public get declarationChecked(): boolean {
    return !!_.get(_.get(this.tripData, 0), "dTime");
  }

  public set declarationChecked(val: boolean) {
    // Set to declaration
  }

  getTripImagesData() {
    this.tripService.getTripImgData(this.tripID).subscribe(
      val => {
        if (val.status == 200 && val.response) {
          for (let f of val.response) {
            if (/\.(gif|jpg|jpeg|tiff|png)$/i.test(f.originalName)) {
              this.tripImages[f.ID] = f;
              this.tripImages[f.ID]["fType"] = "img";
            } else {
              this.tripImages[f.ID] = f;
              this.tripImages[f.ID]["fType"] = "other";
            }
            this.getImage(f.ID, btoa(f.path));
          }
        }
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve trip image details");
      }
    );
  }

  getImage(id: number, path: string) {
    this.upload.downloadFile(path).subscribe(
      file => {
        if (file.status == 200) {
          this.tripImages[id]["file"] = this.sanitizeFile(file.response);
          this.tripImages[id]["fileB64"] = file.response;
        } else {
          this.alert.error(file.error);
        }
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve file");
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

  sanitizeFile(fileB64: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      window.URL.createObjectURL(this.b64toBlob(fileB64, ""))
    );
  }

  private b64toBlob(b64Data, contentType) {
    var sliceSize = 512;
    var byteCharacters = atob(b64Data);
    var byteArrays = [];
    for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      var slice = byteCharacters.slice(offset, offset + sliceSize);
      var byteNumbers = new Array(slice.length);
      for (var i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      var byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    var blob;
    if (contentType) blob = new Blob(byteArrays, { type: contentType });
    else blob = new Blob(byteArrays);

    return blob;
  }

  downloadFile(params, content) {
    var fileNamePresent =
      params && params.fileName && params.fileName.length !== 0;
    var fileName = fileNamePresent ? params.fileName : "noName";
    if (typeof content == "string") {
      content = this.b64toBlob(
        content.substring(content.indexOf(",") + 1),
        null
      );
    }
    FileSaver.saveAs(content, fileName);
  }

  // downloadFile(fName, b64) {
  //   const blob = this.b64toBlob(b64);
  //   if (window.navigator.msSaveOrOpenBlob) {
  //     window.navigator.msSaveBlob(blob, fName);
  //   } else {
  //     const blobUrl = URL.createObjectURL(blob);
  //     var a = window.document.createElement("a");
  //     a.href = blobUrl;
  //     a.download = fName;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //   }
  // }

  delete(attachID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this document?"
      },
      () => {
        this.fileUpload.deleteDoc(attachID).subscribe(val => {
          if (val.status === 200 && val.response) {
            this.alert.success("Details successfully updated");
            delete this.tripImages[attachID];
          }
        });
      },
      () => {
        // Do nothing if NO
      }
    );
  }
}
