import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  Renderer
} from "@angular/core";
import { Subject } from "rxjs";
import * as _ from "lodash";
import { AlertService } from "../alert/alert.service";
import { FileUploadService, Docs } from "../services/file-upload.service";
import { AuthService } from "../auth/auth.service";
import { DataTableDirective } from "angular-datatables";
import { DomSanitizer } from "@angular/platform-browser";
import { ConfirmationDialogService } from "../confirmation-dialog/confirmation-dialog.service";

export class File {
  type: String;
  file: any;
  originalFile: any;
  supported: boolean;
  name: string;
}

@Component({
  selector: "app-docs",
  templateUrl: "./docs.component.html",
  styleUrls: ["./docs.component.scss"]
})
export class DocsComponent implements OnInit, OnDestroy, AfterViewInit {
  docsList = [];
  uploadedFiles = {};
  lodash = _;
  buttons: string[] = ["colvis", "print", "excel"];
  dtOptions: any = {};
  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger = new Subject();
  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  @ViewChild("dtTableElement", { static: false }) dtTableElement: ElementRef;

  selectedFile: File = new File();
  doc: Docs = new Docs();

  constructor(
    private fileUpload: FileUploadService,
    private alert: AlertService,
    public auth: AuthService,
    private renderer: Renderer,
    private confirmationDialogService: ConfirmationDialogService,
    private domSanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.dtOptions = {
      pagingType: "full_numbers",
      pageLength: 10,
      // Use this attribute to enable the responsive extension
      responsive: true,
      // Declare the use of the extension in the dom parameter
      dom: "Bfrtip",
      // Configure the buttons
      buttons: this.buttons
    };
  }

  ngAfterViewInit() {
    this.renderer.listenGlobal(
      this.dtTableElement.nativeElement,
      "click",
      event => {
        if (event.target.hasAttribute("driverVisible")) {
          this.driverVisible(event.target.attributes["driverVisible"].value);
        } else if (event.target.hasAttribute("delete-doc")) {
          this.delete(event.target.attributes["delete-doc"].value);
        } else if (event.target.hasAttribute("view-file")) {
          this.viewFile(event.target.attributes["view-file"].value);
        }
      }
    );
    this.dtTrigger.next();
    this.getDocumentsList();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  getDocumentsList() {
    this.docsList = [];
    this.fileUpload.getDocumentsList().subscribe(
      val => {
        this.docsList = val.response || [];
        this.rerender();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve details");
      }
    );
  }

  documents() {
    if (_.keys(this.uploadedFiles).length > 0) {
      this.upload("docs");
    }
  }

  fileChange(event, type) {
    this.uploadedFiles[type] = _.get(event, "fileList");
  }

  upload(Type: string) {
    let formData = new FormData();
    let y = this.uploadedFiles;
    for (let type of _.keys(y)) {
      let uploadedFiles = this.uploadedFiles[type];
      for (let i = 0; i < uploadedFiles.length; i++) {
        formData.append(
          "uploads[]",
          _.get(uploadedFiles[i], "FileBlob"),
          `|~|${type}|~|${_.get(uploadedFiles[i], "fileName")}`
        );
      }
    }
    this.fileUpload.uploadFile(formData).subscribe(
      response => {
        console.log("response received is ", response);
        this.uploadedFiles = {};
        this.getDocumentsList();
        this.alert.success("Details are successfully submitted");
      },
      err => {
        this.alert.error("Unable to submit details");
      }
    );
  }

  viewFile(attachID: number) {
    let docs = this.docsList.filter(d => {
      return d.attachID == attachID;
    });
    this.doc = docs.length > 0 ? docs[0] : new Docs();

    this.selectedFile = new File();
    this.fileUpload.downloadFile(btoa(this.doc.path)).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.selectedFile.type = this.getFileType(this.doc.originalFileName);
        this.selectedFile.supported = this.isFileSupported(
          this.doc.originalFileName
        );
        this.selectedFile.file = this.domSanitizer.bypassSecurityTrustResourceUrl(
          this.getFileMimeType(this.doc.originalFileName) + val.response
        );
        this.selectedFile.originalFile = val.response;
        this.selectedFile.name = this.doc.originalFileName;
      }
    });
  }

  driverVisible(attachID: number) {
    this.fileUpload.driverVisible(attachID).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.docsList = this.docsList.map(t => {
          if (t.attachID == attachID) {
            t.driverVisible = !t.driverVisible;
          }
          return t;
        });
        this.alert.success("Details successfully updated");
        this.rerender();
      }
    });
  }

  delete(attachID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this document?"
      },
      () => {
        this.fileUpload.deleteDoc(attachID).subscribe(val => {
          if (val.status === 200 && val.response) {
            this.docsList = this.docsList.filter(t => {
              return t.attachID != attachID;
            });
            this.alert.success("Details successfully updated");
            this.rerender();
          }
        });
      },
      () => {
        // Do nothing if NO
      }
    );
  }

  isFileSupported(fName: string): boolean {
    return /\.(gif|jpg|jpeg|tiff|png|pdf)$/i.test(fName);
  }

  getFileType(fName: string): string {
    return /\.(gif|jpg|jpeg|tiff|png)$/i.test(fName)
      ? "image"
      : /\.(pdf)$/i.test(fName)
      ? "pdf"
      : "other";
  }

  getFileMimeType(fName: string): string {
    return /\.(gif|jpg|jpeg|tiff|png)$/i.test(fName)
      ? "data:image/jpg;base64,"
      : /\.(pdf)$/i.test(fName)
      ? "data:application/pdf;base64,"
      : "";
  }

  b64toBlob(b64Data, contentType = "", sliceSize = 512) {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);

      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }

  downloadFile(fName, b64) {
    const blob = this.b64toBlob(b64);
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
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }
}
