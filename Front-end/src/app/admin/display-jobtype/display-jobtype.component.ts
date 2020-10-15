import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  Renderer
} from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { AlertService } from "../../alert/alert.service";
import { DataTableDirective } from "angular-datatables";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";
import { JobTypeService, JobDetail } from "../../services/job-type.service";

@Component({
  selector: "app-display-jobtype",
  templateUrl: "./display-jobtype.component.html",
  styleUrls: ["./display-jobtype.component.scss"]
})
export class DisplayJobtypeComponent
  implements OnInit, AfterViewInit, OnDestroy {
  jobList: JobDetail[] = [];
  buttons: string[] = ["colvis", "print", "excel"];
  dtOptions: any = {};
  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger = new Subject();

  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  @ViewChild("dtTableElement", { static: false }) dtTableElement: ElementRef;

  constructor(
    private router: Router,
    private renderer: Renderer,
    private alert: AlertService,
    private confirmationDialogService: ConfirmationDialogService,
    private jobTypeService: JobTypeService
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
        if (event.target.hasAttribute("update-job")) {
          this.update(event.target.attributes["update-job"].value);
        } else if (event.target.hasAttribute("delete-job")) {
          this.delete(event.target.attributes["delete-job"].value);
        } else if (event.target.hasAttribute("active-job")) {
          this.active(event.target.attributes["active-job"].value);
        }
      }
    );
    this.dtTrigger.next();
    this.getJobList();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  getJobList() {
    this.jobList = [];
    this.jobTypeService.getJobList().subscribe(
      val => {
        this.jobList = val.response || [];
        this.rerender();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve job types");
      }
    );
  }

  add() {
    this.router.navigate(["/jobtype"]);
  }

  update(jobID: number) {
    this.router.navigate(["/jobtype"], {
      queryParams: { jID: btoa(jobID.toString()) }
    });
  }

  active(jobID: number) {
    this.jobTypeService.activeJob(jobID).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.jobList = this.jobList.map(j => {
          if (j.jID == jobID) {
            j.active = 1;
          }
          return j;
        });
        this.alert.success("Details successfully updated");
        this.rerender();
      }
    });
  }

  delete(jID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this job type?"
      },
      () => {
        this.jobTypeService.deleteJob(jID).subscribe(val => {
          if (val.status === 200 && val.response) {
            this.jobList = this.jobList.map(j => {
              if (j.jID == jID) {
                j.active = 0;
              }
              return j;
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
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      // Destroy the table first
      dtInstance.destroy();
      // Call the dtTrigger to rerender again
      this.dtTrigger.next();
    });
  }
}
