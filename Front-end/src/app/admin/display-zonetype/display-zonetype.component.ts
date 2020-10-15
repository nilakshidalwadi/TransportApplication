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
import { JobTypeService, ZoneDetail } from "../../services/job-type.service";

@Component({
  selector: "app-display-zonetype",
  templateUrl: "./display-zonetype.component.html",
  styleUrls: ["./display-zonetype.component.scss"]
})
export class DisplayZonetypeComponent
  implements OnInit, AfterViewInit, OnDestroy {
  zoneList: ZoneDetail[] = [];
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
        if (event.target.hasAttribute("update-zone")) {
          this.update(event.target.attributes["update-zone"].value);
        } else if (event.target.hasAttribute("delete-zone")) {
          this.delete(event.target.attributes["delete-zone"].value);
        } else if (event.target.hasAttribute("active-zone")) {
          this.active(event.target.attributes["active-zone"].value);
        }
      }
    );
    this.dtTrigger.next();
    this.getZoneList();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  getZoneList() {
    this.zoneList = [];
    this.jobTypeService.getZoneList().subscribe(
      val => {
        this.zoneList = val.response || [];
        this.rerender();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve zone details");
      }
    );
  }

  add() {
    this.router.navigate(["/zonetype"]);
  }

  update(zoneID: number) {
    this.router.navigate(["/zonetype"], {
      queryParams: { zID: btoa(zoneID.toString()) }
    });
  }

  active(zoneID: number) {
    this.jobTypeService.activeZone(zoneID).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.zoneList = this.zoneList.map(z => {
          if (z.zID == zoneID) {
            z.active = 1;
          }
          return z;
        });
        this.alert.success("Details successfully updated");
        this.rerender();
      }
    });
  }

  delete(zID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this job type?"
      },
      () => {
        this.jobTypeService.deleteZone(zID).subscribe(val => {
          if (val.status === 200 && val.response) {
            this.zoneList = this.zoneList.map(z => {
              if (z.zID == zID) {
                z.active = 0;
              }
              return z;
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
