import {
  Component,
  OnInit,
  Input,
  EventEmitter,
  ViewEncapsulation,
  HostListener,
  AfterViewInit,
  OnChanges,
  ElementRef,
  ViewChild
} from "@angular/core";

import FileSaver from "file-saver";
import * as _ from "lodash";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

export class FileDetails {
  attachmentID: number = 0;
  fileUUID: string = "";
  file: File = null;
  fileName: string = "";
  path: string = "";
  loaded: boolean = false;
  uploaded: boolean = false;
  deleted: boolean = false;
  preview: boolean = false;
  FileAsB64: any = undefined;
  FileBlob: Blob = null;
  isImageType: boolean = false;
  comment: string = "";
  lat: string = "";
  long: string = "";
}

export enum FileFilter {
  all = "all",
  excel = "excel",
  csv = "csv",
  text = "text",
  image = "image",
  audio = "audio",
  video = "video",
  pdf = "pdf"
}

export class FileFilters {
  [FileFilter.all] = { accept: "*", file: "All" };
  [FileFilter.excel] = {
    accept:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel",
    file: "Excel"
  };
  [FileFilter.csv] = { accept: ".csv", file: "CSV" };
  [FileFilter.text] = { accept: "text/plain", file: "Text" };
  [FileFilter.image] = { accept: "image/*", file: "Image" };
  [FileFilter.audio] = { accept: "audio/*", file: "Audio" };
  [FileFilter.video] = { accept: "video/*", file: "Video" };
  [FileFilter.pdf] = { accept: ".pdf", file: "PDF" };
}

export class CaptureImage {
  show: boolean = false;
  srcAttr: string = "";
  stream: any;
  webkitURL: boolean = false;
  loading: boolean = false;
}

export class CameraOption {
  deviceID: string = "";
  deviceName: string = "";
}

@Component({
  selector: "app-attachments",
  templateUrl: "./attachments.component.html",
  styleUrls: ["./attachments.component.scss"],
  encapsulation: ViewEncapsulation.None,
  outputs: [
    "attachmentUploadComplete",
    "attachmentUploadFailed",
    "attachmentSelected",
    "attachmentInitialized",
    "attachmentRemoved"
  ]
})
export class AttachmentsComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild("myAttachments", { static: false }) _myAttachments;
  @Input("id") id = "";
  @Input("enabled") enabled = 1;
  @Input("required") reqd = false;
  @Input() content = "";
  @Input("oldAttachments") oldAttachmentIDs = "";
  @Input("allowUpload") allowUpload: number = 1;
  @Input("allowCamera") allowCamera: number = 1;

  @Input("fileFilter") fileFilter: FileFilter[];
  @Input("maxFiles") maxFiles: number = -1;
  @Input("maxSize") maxSize: number = -1; //5; // 5MB

  // Take a photo
  @ViewChild("video", { static: false })
  public video: ElementRef;
  public clickImage: CaptureImage = new CaptureImage();
  public cameraOptions: CameraOption[] = [];

  formHeaderID: number = 0;
  fieldDefID: number = 0;

  uploadSaveUrl: string;
  getAttachmentDetailUrl: string;
  getAttachmentUrl: string;

  cameraErrorMsg: string = "";

  private oldAttachmentLoadedIDs: number[] = [];

  public progress: number;

  public fileList: FileDetails[] = [];
  public selectedFile: FileDetails;
  private filesToUpload: string[] = [];
  public errors: string[] = [];
  public dragAreaClass: string = "dragarea";

  public isCameraParemission: boolean = false;
  public cameraStreamErrorMsg: string = "";

  public attachmentUploadComplete = new EventEmitter();
  public attachmentUploadFailed = new EventEmitter();
  public attachmentSelected = new EventEmitter();
  public attachmentInitialized = new EventEmitter();
  public attachmentRemoved = new EventEmitter();

  private environmentCameraOption = "-1";
  private videoConstraints = {
    audio: false,
    video: {
      width: {
        // min: 1280,
        ideal: 640
        // max: 2560
      },
      height: {
        // min: 720,
        ideal: 480
        // max: 1440
      },
      // optional: [
      //   { minWidth: 320 },
      //   { minWidth: 640 },
      //   { minWidth: 800 },
      //   { minWidth: 900 },
      //   { minWidth: 1024 },
      //   { minWidth: 1280 },
      //   { minWidth: 1920 },
      //   { minWidth: 2560 }
      // ]
      facingMode: "environment"
    }
  };

  constructor(private confirmationDialogService: ConfirmationDialogService) {}

  /********************************************************************************************************************************/
  /* HOST LISTENER FOR ATTACHMENT */
  /********************************************************************************************************************************/

  @HostListener("click", ["$event"]) onClick(e) {
    let clickElements: Array<string> = ["INPUT", "BUTTON"];
    if (clickElements.indexOf(e.target.tagName) == -1) {
      e.preventDefault();
    }
  }

  @HostListener("dragover", ["$event"]) onDragOver(event) {
    this.dragAreaClass = "dragarea hover";
    event.preventDefault();
  }

  @HostListener("dragenter", ["$event"]) onDragEnter(event) {
    this.dragAreaClass = "dragarea hover";
    event.preventDefault();
  }

  @HostListener("dragend", ["$event"]) onDragEnd(event) {
    this.dragAreaClass = "dragarea";
    event.preventDefault();
  }

  @HostListener("dragleave", ["$event"]) onDragLeave(event) {
    this.dragAreaClass = "dragarea";
    event.preventDefault();
  }

  @HostListener("drop", ["$event"]) onDrop(event) {
    this.dragAreaClass = "dragarea";
    event.preventDefault();
    event.stopPropagation();
    var files = event.dataTransfer.files;
    this.onFileChange(files);
  }

  ngOnInit(): void {
    // this.setOldAttachments(this.oldAttachmentIDs);
    if (!!this.allowCamera) {
      // Chek for camera permissions
      try {
        let cameraOptions = JSON.parse(localStorage.getItem("cameraOptions"));
        this.isCameraParemission = cameraOptions["havingPermission"];
        this.videoConstraints.video.width.ideal =
          cameraOptions["selectedWidth"];
        this.videoConstraints.video.height.ideal =
          cameraOptions["selectedHeight"];

        // For handling exception in IE
        // this.getCameraPermissions(this.videoConstraints).then(
        //   stream => {
        //     this.isCameraParemission = true;
        //     try {
        //       if (stream) stream.getTracks().forEach(track => track.stop());
        //     } catch (e) {}
        //     this.clickImage.stream = stream;
        //     // If camera exists reset stream and other details
        //     this.resetCameraOptions();
        //     this.getCameraSelection();
        //   },
        //   error => this.cameraPermissionError(error)
        // );
      } catch (error) {
        this.cameraPermissionError(error);
      }
    }
  }

  ngAfterViewInit(): void {
    this.attachmentInitialized.emit({ value: "" });
  }

  ngOnChanges() {}

  /********************************************************************************************************************************/
  /* ATTACHMENTS VARIABLES */
  /********************************************************************************************************************************/

  public get isValid(): boolean {
    return !this.reqd || (this.reqd && this.totalFiles > 0);
  }

  public get isReadOnly(): boolean {
    return !!!this.enabled;
  }

  public get allowedFiles(): { accept: string; file: string } {
    // Get all the filtes
    let filters: FileFilters = new FileFilters();

    // Set defaults to all
    this.fileFilter = _.isEmpty(this.fileFilter)
      ? [FileFilter.all]
      : this.fileFilter;
    // Selected filters
    filters = _.filter(filters, (val, key) => _.includes(this.fileFilter, key));

    // FIlter the list
    return {
      accept: _.join(
        _.map(filters, f => f.accept),
        ", "
      ),
      file: _.join(
        _.map(filters, f => f.file),
        ", "
      )
    };
  }

  public get totalFiles(): number {
    return _.get(_.countBy(this.fileList, "deleted"), false) || 0;
  }

  private get totalFilesToUpload(): number {
    return _.get(_.countBy(this.fileList, "uploaded"), false) || 0;
  }

  /********************************************************************************************************************************/
  /* OLD ATTACHMENTS */
  /********************************************************************************************************************************/
  public setOldAttachments = attachments => {
    attachments = attachments || "";
    if (typeof attachments == "string") {
      let oldAttachmentIDs = _.filter(
        _.map(_.split(attachments, ";"), v => Number(v)),
        v => {
          return v && _.indexOf(this.oldAttachmentLoadedIDs, v) === -1;
        }
      );
      this.oldAttachmentLoadedIDs = _.concat(
        this.oldAttachmentLoadedIDs,
        oldAttachmentIDs
      );
    }
  };

  /********************************************************************************************************************************/
  /* DOWNLOAD ATTACHMENTS */
  /********************************************************************************************************************************/

  public startDownload(event, f: FileDetails) {
    event.stopPropagation();

    this.downloadFile(
      {
        fileName: f.fileName
      },
      f.FileAsB64 || f.file
    );
  }

  private downloadFile(params, content) {
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

  /********************************************************************************************************************************/
  /* File Events */
  /********************************************************************************************************************************/

  public onFileChange = files => {
    // Clear error
    this.errors = [];

    if (files && files.length > 0) {
      let selectedFiles: File[] = files;
      _.forEach(selectedFiles, file => {
        if (this.isValidFiles(file)) {
          let f: FileDetails = new FileDetails();
          f.file = file;
          f.fileName = file.name;
          f.fileUUID = this.fileUUID;
          f.isImageType = this.checkForImageType(f.fileName);
          this.fileList.push(f);
        }
      });
    }

    // Clear attachments
    this._myAttachments.nativeElement.value = "";

    // Attachment file selected event
    this.attachmentSelected.emit({
      value: this.id,
      fileListCount: this.totalFiles,
      fileList: this.fileList
    });

    this.loadFiles();
  };

  public removeAttachment(event, file: FileDetails) {
    // Prevent from clicking on the file
    event.stopPropagation();

    // Confirmation dialogue box
    this.confirmationDialogService.confirmThis(
      {
        message: `Are you sure you want to delete the file (${file.fileName})?`
      },
      () => {
        // delete file from FileList
        file.deleted = true;

        // Update the file list by removing the not uploaded attachments
        this.fileList = _.filter(
          this.fileList,
          (f: FileDetails) => (!f.deleted && !f.uploaded) || f.uploaded
        );

        // Emit the remove event
        this.attachmentRemoved.emit({
          value: "",
          fileListCount: this.totalFiles,
          filesToUploadCount: this.totalFilesToUpload
        });

        //emit the select event (required for OPS form)
        this.attachmentSelected.emit({
          value: "",
          fileListCount: this.totalFiles,
          fileList: this.fileList
        });
      },
      () => {}
    );
  }

  public clearFiles() {
    this.fileList = [];
  }

  /********************************************************************************************************************************/
  /* Take a photo */
  /********************************************************************************************************************************/

  initGetUserMedia(constraints) {
    let mediaDevices = navigator.mediaDevices || {};
    mediaDevices["getUserMedia"] =
      mediaDevices["getUserMedia"] ||
      function(constraints) {
        let getUserMedia =
          navigator["webkitGetUserMedia"] || navigator["mozGetUserMedia"];
        if (!getUserMedia) {
          return Promise.reject(
            new Error("getUserMedia not supported by this browser")
          );
        } else {
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        }
      };
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

  private async startStream(constraints) {
    // Reset stream error message
    this.cameraStreamErrorMsg = "";
    // Stop old streams if any
    this.stopCameraStreams();
    // Get a ne wstream
    this.getCameraPermissions(constraints).then(
      stream => {
        this.clickImage.stream = stream;
        this.handleStream();
      },
      error => this.cameraStreamError(error)
    );
  }

  private handleStream(): void {
    // Show a capture image section
    this.clickImage.show = true;
    this.clickImage.loading = false;

    setTimeout(() => {
      this.video.nativeElement["srcObject"] = this.clickImage.stream;
      this.video.nativeElement.play();
    });
  }

  private async getCameraSelection() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = _.filter(
      devices,
      device => device.kind === "videoinput"
    );

    // Empty the array
    this.cameraOptions = [];
    this.cameraOptions = _.map(videoDevices, videoDevice => {
      let option = new CameraOption();
      option.deviceID = videoDevice.deviceId;
      option.deviceName = videoDevice.label;
      return option;
    });
    if (this.cameraOptions.length > 0) {
      let option = new CameraOption();
      option.deviceID = this.environmentCameraOption;
      option.deviceName = "Default";
      this.cameraOptions.splice(0, 0, option);
    }
  }

  public doScreenshot(event) {
    if (event) event.stopPropagation();

    // Elements for taking the snapshot
    let canvas = document.createElement("canvas");
    canvas.width = this.video.nativeElement.videoWidth;
    canvas.height = this.video.nativeElement.videoHeight;
    console.log(canvas.height, canvas.width);
    canvas.getContext("2d").drawImage(this.video.nativeElement, 0, 0);

    let f: FileDetails = new FileDetails();
    f.FileAsB64 = canvas.toDataURL("image/png");
    f.isImageType = true;
    f.loaded = true;
    f.fileName = `${new Date().valueOf()}.png`;
    f.fileUUID = this.fileUUID;
    canvas.toBlob(blob => {
      f.FileBlob = blob;
    }, "image/png");
    this.fileList.push(f);

    // this.getCurrentLatLong(undefined, f);

    canvas.remove();

    // Attachment file selected event
    this.attachmentSelected.emit({
      value: this.id,
      fileListCount: this.totalFiles,
      fileList: this.fileList
    });

    this.resetCameraOptions();
  }

  public openCamera(event) {
    if (event) event.stopPropagation();

    this.clickImage.loading = true;
    // console.log(this.cameraOptions);
    this.startStream(
      this.getConstraintsWithDeviceID(this.environmentCameraOption)
    );
  }

  public onCameraOptionChange(event, deviceID: string): void {
    if (event) event.stopPropagation();
    this.startStream(this.getConstraintsWithDeviceID(deviceID));
  }

  private getConstraintsWithDeviceID(deviceID: string) {
    return this.videoConstraints;
    // // Remove old references
    // this.videoConstraints = { video: {}, audio: false };

    // if (deviceID == this.environmentCameraOption) {
    //   this.videoConstraints.video["facingMode"] = "environment";
    // } else {
    //   this.videoConstraints.video["deviceId"] = { exact: deviceID };
    // }

    // return this.videoConstraints;
  }

  private cameraPermissionError(e) {
    // this.global.loading = false;
    // console.error("Camera required");
    if (e.name == "PermissionDeniedError") {
      this.cameraErrorMsg = "It looks like you've denied access to the camera.";
    } else if (e.name == "SourceUnavailableError") {
      this.cameraErrorMsg =
        "It looks like your camera is <b>used</b> by another application.";
    } else {
      this.cameraErrorMsg =
        "The camera is unavailable. The error message is: " + e.message;
    }
    this.isCameraParemission = false;
    this.resetCameraOptions();
  }

  private cameraStreamError(e) {
    // this.global.loading = false;
    // console.error("Camera required");
    this.cameraStreamErrorMsg = e.message;
    console.log(e);
    this.resetCameraOptions();
  }

  private stopCameraStreams() {
    if (this.clickImage.stream) {
      try {
        let tracks = this.clickImage.stream.getTracks();
        _.forEach(tracks, track => {
          track.stop();
        });
      } catch (err) {
        console.error("Error while cancelling the video stream");
      }
    }
  }

  private resetCameraOptions() {
    // Stop camera streaming
    this.stopCameraStreams();
    // Hide a capture image section
    this.clickImage = new CaptureImage();
  }

  public cancelCapture(event) {
    if (event) event.stopPropagation();
    this.resetCameraOptions();
  }

  /********************************************************************************************************************************/
  /* File Validations */
  /********************************************************************************************************************************/

  private isValidFiles(file: File): boolean {
    // Check Number of files
    if (this.maxFiles > 0 && this.totalFiles >= this.maxFiles) {
      let msg: string = `Error: You can upload only ${this.maxFiles} file(s)`;
      if (!_.includes(this.errors, msg)) this.errors.push(msg);
      return false;
    }
    return this.isValidFileExtension(file);
  }

  private isValidFileExtension(file: File): boolean {
    let filter = this.allowedFiles;
    let status: boolean = true;
    if (!_.isEqual(filter.accept, "*")) {
      // Replace * with .*
      let allowedTypes = _.replace(
        // Apply escape character for /
        _.replace(
          // change to or condition
          _.replace(filter.accept, new RegExp(", ", "g"), "|"),
          new RegExp("/", "g"),
          "\\/"
        ),
        new RegExp("\\*", "g"),
        ".*"
      );

      // Get file extension
      const ext =
        file.name
          .toUpperCase()
          .split(".")
          .pop() || file.name;

      const type = file.type;

      // Check the extension exists
      const exists = type.match(allowedTypes) || ext.match(allowedTypes);
      if (!exists) {
        status = false;
        this.errors.push(
          `Error (Valid file type(s): ${filter.file}): ${file.name}`
        );
      }
    }

    // Check file size
    return status && this.isValidFileSize(file);
  }

  private isValidFileSize(file: File): boolean {
    let status: boolean = true;
    if (this.maxSize > 0) {
      const fileSizeinMB = file.size / (1024 * 1000);
      const size = Math.round(fileSizeinMB * 100) / 100; // convert upto 2 decimal place
      if (size > this.maxSize) {
        status = false;
        this.errors.push(
          `Error (Exceed file size limit of ${this.maxSize}MB): ${file.name} ( ${size}MB )`
        );
      }
    }
    return status;
  }

  /********************************************************************************************************************************/
  /* Preview File */
  /********************************************************************************************************************************/

  private loadFiles() {
    for (let f of this.fileList) {
      if (!f.uploaded && !f.loaded) {
        this.readFile(f.file, f);
      }
    }
  }

  private readFile(file: any, f: FileDetails) {
    let reader = new FileReader();
    reader.onload = (e: any) => {
      if (f.isImageType) {
        // f.FileAsB64 = imageData;
        f.FileAsB64 = _.replace(
          e.target.result,
          new RegExp("data:([a-zA-Z0-9]+/[a-zA-Z0-9-.+]+);", "i"),
          `data:image/${this.getFileExtension(f.fileName)};`
        );
      } else {
        f.FileAsB64 = e.target.result;
      }
      // Set blob from file object
      f.FileBlob = f.file;
      // Remove file object as not needed
      f.file = null;
      // set flag to loaded to avaoid loading again and again
      f.loaded = true;
    };
    reader.readAsDataURL(file);
  }

  public previewFile(event, file: FileDetails) {
    event.stopPropagation();

    // Remove preview tag from previosly selcted file
    if (this.selectedFile) this.selectedFile.preview = false;
    // Select a new file
    this.selectedFile = file;
    this.selectedFile.preview = true;
  }

  public hidePreview(event, file: FileDetails) {
    event.stopPropagation();
    // Remove preview tag from previosly selcted file
    file.preview = false;
    // Remove selected file
    this.selectedFile = null;
  }

  // public getCurrentLatLong(event, f: FileDetails) {
  //   if (event) event.stopPropagation();
  //   this.getPosition().then(pos => {
  //     if (pos) {
  //       f.lat = parseFloat(`${pos.lat}`).toFixed(8);
  //       f.long = parseFloat(`${pos.lng}`).toFixed(8);
  //       this.attachmentSelected.emit({
  //         value: "",
  //         fileListCount: this.totalFiles,
  //         fileList: this.fileList
  //       });
  //     }
  //   });
  // }

  public viewLocation(event, f: FileDetails) {
    event.stopPropagation();
    let url: string = `http://www.google.com/maps/place/${f.lat},${f.long}`;
    window.open(url);
  }

  /********************************************************************************************************************************/
  /* File Details */
  /********************************************************************************************************************************/

  private checkForImageType(fName: string): boolean {
    return /\.(gif|jpg|jpeg|tiff|png|bmp)$/i.test(fName);
  }

  public getFileExtension(fName: string): string {
    return fName.split(".").pop();
  }

  private getFileName(
    fileName: string
  ): { s3BucketName: string; originalName: string } {
    let fNames = _.split(fileName, "|~|");
    let s3BucketName = _.get(fNames, 0) || "";
    let originalName = _.get(fNames, 1) || s3BucketName;
    return {
      s3BucketName: s3BucketName,
      originalName: originalName
    };
  }

  // Generate file UUID
  private get fileUUID(): string {
    return `${this.S4()}${this.S4()}-${this.S4()}-${this.S4()}-${this.S4()}-${this.S4()}${this.S4()}${this.S4()}`;
  }

  private S4(): string {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  private getPosition(): Promise<any> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resp => {
          resolve({ lng: resp.coords.longitude, lat: resp.coords.latitude });
        },
        err => {
          reject(err);
        }
      );
    }).catch(error => {
      alert("Not having permission to read current location");
    });
  }

  // private resolutionsToCheck = [
  //   { width: 160, height: 120 },
  //   { width: 320, height: 180 },
  //   { width: 320, height: 240 },
  //   { width: 640, height: 360 },
  //   { width: 640, height: 480 },
  //   { width: 768, height: 576 },
  //   { width: 1024, height: 576 },
  //   { width: 1280, height: 720 },
  //   { width: 1280, height: 768 },
  //   { width: 1280, height: 800 },
  //   { width: 1280, height: 900 },
  //   { width: 1280, height: 1000 },
  //   { width: 1920, height: 1080 },
  //   { width: 1920, height: 1200 },
  //   { width: 2560, height: 1440 },
  //   { width: 3840, height: 2160 },
  //   { width: 4096, height: 2160 }
  // ];
  // private leftRes: number = 0;
  // private rightRes: number = this.resolutionsToCheck.length;
  // private midRes: number;
  // private selectedResWidth: number;
  // private selectedResHeight: number;

  // private findMaximum_WidthHeight_ForCamera() {
  //   console.log("left:right = ", this.leftRes, ":", this.rightRes);
  //   if (this.leftRes > this.rightRes) {
  //     console.log(
  //       "Selected Height:Width = ",
  //       this.selectedResWidth,
  //       ":",
  //       this.selectedResHeight
  //     );
  //     return;
  //   }

  //   this.midRes = Math.floor((this.leftRes + this.rightRes) / 2);

  //   let temporaryConstraints = {
  //     audio: false,
  //     video: {
  //       // width: {
  //       //   min: this.resolutionsToCheck[this.midRes].width,
  //       //   max: this.resolutionsToCheck[this.midRes].width
  //       // },
  //       // height: {
  //       //   min: this.resolutionsToCheck[this.midRes].height,
  //       //   max: this.resolutionsToCheck[this.midRes].height
  //       // },
  //       // facingMode: "environment"
  //       mandatory: {
  //         minWidth: this.resolutionsToCheck[this.midRes].width,
  //         minHeight: this.resolutionsToCheck[this.midRes].height,
  //         maxWidth: this.resolutionsToCheck[this.midRes].width,
  //         maxHeight: this.resolutionsToCheck[this.midRes].height
  //       },
  //       optional: []
  //     }
  //   };

  //   this.getCameraPermissions(temporaryConstraints)
  //     .then(stream => {
  //       console.log(
  //         "Success for --> ",
  //         this.midRes,
  //         " ",
  //         this.resolutionsToCheck[this.midRes]
  //       );
  //       this.selectedResWidth = this.resolutionsToCheck[this.midRes].width;
  //       this.selectedResHeight = this.resolutionsToCheck[this.midRes].height;

  //       this.leftRes = this.midRes + 1;

  //       try {
  //         if (stream) stream.getTracks().forEach(track => track.stop());
  //       } catch (e) {}

  //       this.findMaximum_WidthHeight_ForCamera();
  //     })
  //     .catch(error => {
  //       console.log(
  //         "Failed for --> " + this.midRes,
  //         " ",
  //         this.resolutionsToCheck[this.midRes],
  //         " ",
  //         error
  //       );
  //       this.rightRes = this.midRes - 1;

  //       this.findMaximum_WidthHeight_ForCamera();
  //     });
  // }
}
