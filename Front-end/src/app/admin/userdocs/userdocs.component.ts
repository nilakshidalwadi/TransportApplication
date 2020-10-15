import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Renderer
} from "@angular/core";
import { Subject } from "rxjs";
import * as _ from "lodash";
import { FileUploadService } from "../../services/file-upload.service";
import { DataTableDirective } from "angular-datatables";
import { AlertService } from "../../alert/alert.service";
import { DomSanitizer } from "@angular/platform-browser";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

export class File {
  type: String;
  file: any;
  originalFile: any;
  supported: boolean;
  name: string;
  attachID: number;
}

@Component({
  selector: "app-userdocs",
  templateUrl: "./userdocs.component.html",
  styleUrls: ["./userdocs.component.scss"]
})
export class UserdocsComponent implements OnInit {
  userDocList = [];
  uID: number;

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

  constructor(
    private alert: AlertService,
    private fileUpload: FileUploadService,
    private sanitizer: DomSanitizer,
    public auth: AuthService,
    private confirmationDialogService: ConfirmationDialogService,
    private route: ActivatedRoute,
    private renderer: Renderer
  ) {
    this.uID = +this.route.snapshot.paramMap.get("uID");
  }

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
    this.getUserDocumentsList(this.uID);
  }

  ngAfterViewInit() {
    this.renderer.listenGlobal(
      this.dtTableElement.nativeElement,
      "click",
      event => {
        if (event.target.hasAttribute("delete-doc")) {
          this.delete(event.target.attributes["delete-doc"].value);
        } else if (event.target.hasAttribute("view-file")) {
          this.viewFile(event.target.attributes["view-file"].value);
        }
      }
    );
    this.dtTrigger.next();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  getUserDocumentsList(uID: number) {
    this.userDocList = [];
    this.fileUpload.getUserDocumentsList(uID).subscribe(
      val => {
        this.userDocList = val.response || [];
        this.rerender();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve details");
      }
    );
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }

  viewFile(attachID: number) {
    let docs = this.userDocList.filter(d => {
      return d.attachID == attachID;
    });
    let doc = docs.length > 0 ? docs[0] : null;

    if (doc == null) return;
    if (this.selectedFile.attachID == doc.attachID) return;

    this.selectedFile = new File();
    this.fileUpload.downloadFile(btoa(doc.path)).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.selectedFile.type = this.getFileType(doc.originalFileName);
        this.selectedFile.supported = this.isFileSupported(
          doc.originalFileName
        );
        this.selectedFile.file = this.sanitizer.bypassSecurityTrustResourceUrl(
          this.getFileMimeType(doc.originalFileName) + val.response
        );
        this.selectedFile.originalFile = val.response;
        this.selectedFile.name = doc.originalFileName;
      }
    });
  }

  isFileSupported(fName: string): boolean {
    return /\.(gif|jpg|jpeg|tiff|png|pdf)$/i.test(fName);
  }

  sanitizeFile(fileB64: string) {
    return this.sanitizer.bypassSecurityTrustUrl(
      window.URL.createObjectURL(this.b64toBlob(fileB64))
    );
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

  delete(attachID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this document?"
      },
      () => {
        this.fileUpload.deleteDoc(attachID).subscribe(val => {
          if (val.status === 200 && val.response) {
            this.userDocList = this.userDocList.filter(t => {
              return t.attachID != attachID;
            });
          }
        });
      },
      () => {
        // Do nothing if NO
      }
    );
  }
}
