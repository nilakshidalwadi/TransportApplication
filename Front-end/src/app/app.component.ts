import { Component } from "@angular/core";
import { AuthService } from "./auth/auth.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.scss"]
})
export class AppComponent {
  title = "JK Sandhu";
  name: string = "";
  constructor(private auth: AuthService, public router: Router) {
    let cameraOptions = JSON.parse(localStorage.getItem("cameraOptions"));
    this.auth.checkAuth();
    if (cameraOptions)
      this.getCameraPermissions({ audio: false, video: true }).then(
        stream => {
          try {
            if (stream) stream.getTracks().forEach(track => track.stop());
          } catch (e) {}

          cameraOptions["havingPermission"] = true;
          localStorage.setItem("cameraOptions", JSON.stringify(cameraOptions));
        },
        err => {
          cameraOptions["havingPermission"] = false;
          localStorage.setItem("cameraOptions", JSON.stringify(cameraOptions));
        }
      );
    else this.findMaximum_WidthHeight_ForCamera();
  }

  // Camera options

  private havingCameraPermission: boolean = false;

  private resolutionsToCheck = [
    { width: 160, height: 120 },
    { width: 320, height: 180 },
    { width: 320, height: 240 },
    { width: 640, height: 360 },
    { width: 640, height: 480 },
    { width: 768, height: 576 },
    { width: 1024, height: 576 },
    { width: 1280, height: 720 },
    { width: 1280, height: 768 },
    { width: 1280, height: 800 },
    { width: 1280, height: 900 },
    { width: 1280, height: 1000 },
    { width: 1920, height: 1080 },
    { width: 1920, height: 1200 },
    { width: 2560, height: 1440 },
    { width: 3840, height: 2160 },
    { width: 4096, height: 2160 }
  ];
  private leftRes: number = 0;
  private rightRes: number = this.resolutionsToCheck.length;
  private midRes: number;
  private selectedResWidth: number;
  private selectedResHeight: number;

  private findMaximum_WidthHeight_ForCamera() {
    console.log("left:right = ", this.leftRes, ":", this.rightRes);
    if (this.leftRes > this.rightRes) {
      console.log(
        "Selected Height:Width = ",
        this.selectedResWidth,
        ":",
        this.selectedResHeight
      );
      localStorage.setItem(
        "cameraOptions",
        JSON.stringify({
          havingPermission: this.havingCameraPermission,
          selectedWidth: this.selectedResWidth,
          selectedHeight: this.selectedResHeight
        })
      );
      return;
    }

    this.midRes = Math.floor((this.leftRes + this.rightRes) / 2);

    let temporaryConstraints = {
      audio: false,
      video: {
        mandatory: {
          minWidth: this.resolutionsToCheck[this.midRes].width,
          minHeight: this.resolutionsToCheck[this.midRes].height,
          maxWidth: this.resolutionsToCheck[this.midRes].width,
          maxHeight: this.resolutionsToCheck[this.midRes].height
        },
        optional: []
      }
    };

    this.getCameraPermissions(temporaryConstraints)
      .then(stream => {
        // Having camera permission
        this.havingCameraPermission = true;

        console.log(
          "Success for --> ",
          this.midRes,
          " ",
          this.resolutionsToCheck[this.midRes]
        );
        this.selectedResWidth = this.resolutionsToCheck[this.midRes].width;
        this.selectedResHeight = this.resolutionsToCheck[this.midRes].height;

        this.leftRes = this.midRes + 1;

        try {
          if (stream) stream.getTracks().forEach(track => track.stop());
        } catch (e) {}

        this.findMaximum_WidthHeight_ForCamera();
      })
      .catch(error => {
        console.log(
          "Failed for --> " + this.midRes,
          " ",
          this.resolutionsToCheck[this.midRes],
          " ",
          error
        );
        this.rightRes = this.midRes - 1;

        this.findMaximum_WidthHeight_ForCamera();
      });
  }

  private getCameraPermissions(constraints): Promise<MediaStream> {
    if (
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    ) {
      return navigator.mediaDevices.getUserMedia(constraints);
    } else {
      let getUserMedia =
        navigator["webkitGetUserMedia"] ||
        navigator["mozGetUserMedia"] ||
        navigator["msGetUserMedia"];
      if (!getUserMedia) {
        return Promise.reject(
          new Error("User Media not supported by this browser")
        );
      } else {
        return new Promise((resolve, reject) => {
          getUserMedia.call(navigator, constraints, resolve, reject);
        });
      }
    }
  }
}
