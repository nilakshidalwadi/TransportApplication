import {
  Component,
  OnInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  AfterViewInit,
  Renderer
} from "@angular/core";
import { TruckService } from "../../services/truck.service";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { AlertService } from "../../alert/alert.service";
import { DataTableDirective } from "angular-datatables";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

@Component({
  selector: "app-display-truck",
  templateUrl: "./display-truck.component.html",
  styleUrls: ["./display-truck.component.scss"]
})
export class DisplayTruckComponent implements OnInit, AfterViewInit, OnDestroy {
  trucksList = [];
  buttons: string[] = ["colvis", "print", "excel"];
  dtOptions: any = {};
  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger = new Subject();

  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  @ViewChild("dtTableElement", { static: false }) dtTableElement: ElementRef;

  constructor(
    private truckService: TruckService,
    private router: Router,
    private renderer: Renderer,
    private alert: AlertService,
    private confirmationDialogService: ConfirmationDialogService
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
        if (event.target.hasAttribute("update-truck")) {
          this.update(event.target.attributes["update-truck"].value);
        } else if (event.target.hasAttribute("delete-truck")) {
          this.delete(event.target.attributes["delete-truck"].value);
        } else if (event.target.hasAttribute("active-truck")) {
          this.active(event.target.attributes["active-truck"].value);
        }
      }
    );
    this.dtTrigger.next();
    this.getTrucksList();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  getTrucksList() {
    this.trucksList = [];
    this.truckService.getTrucksList().subscribe(
      val => {
        this.trucksList = val.response || [];
        this.rerender();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve rego number list");
      }
    );
  }

  add() {
    this.router.navigate(["/trucks"]);
  }

  update(truckID: number) {
    this.router.navigate(["/trucks"], {
      queryParams: { tID: btoa(truckID.toString()) }
    });
  }

  delete(truckID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this truck?"
      },
      () => {
        this.truckService.deleteTruck(truckID).subscribe(val => {
          if (val.status === 200 && val.response) {
            this.trucksList = this.trucksList.map(t => {
              if (t.tID == truckID) {
                t.inUse = 0;
              }
              return t;
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

  active(truckID: number) {
    this.truckService.activeTruck(truckID).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.trucksList = this.trucksList.map(t => {
          if (t.tID == truckID) {
            t.inUse = 1;
          }
          return t;
        });
        this.alert.success("Details successfully updated");
        this.rerender();
      }
    });
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
