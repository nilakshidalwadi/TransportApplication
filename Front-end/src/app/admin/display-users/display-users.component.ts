import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Renderer,
  ViewChild,
  ElementRef
} from "@angular/core";
import { UserService, UserDetail } from "../../services/user.service";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { AlertService } from "../../alert/alert.service";
import { DataTableDirective } from "angular-datatables";
import { ConfirmationDialogService } from "../../confirmation-dialog/confirmation-dialog.service";

@Component({
  selector: "app-display-users",
  templateUrl: "./display-users.component.html",
  styleUrls: ["./display-users.component.scss"]
})
export class DisplayUsersComponent implements OnInit, AfterViewInit, OnDestroy {
  usersList = [];
  buttons: string[] = ["colvis", "print", "excel"];
  dtOptions: any = {};
  // We use this trigger because fetching the list of users can be quite long,
  // thus we ensure the data is fetched before rendering
  dtTrigger = new Subject();

  @ViewChild(DataTableDirective, { static: false })
  dtElement: DataTableDirective;
  @ViewChild("dtTableElement", { static: false }) dtTableElement: ElementRef;

  updatePasswordFor: UserDetail = new UserDetail();
  updatedPass: string = "";

  constructor(
    private userService: UserService,
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
        if (event.target.hasAttribute("update-user")) {
          this.update(event.target.attributes["update-user"].value);
        } else if (event.target.hasAttribute("view-user-doc")) {
          this.view(event.target.attributes["view-user-doc"].value);
        } else if (event.target.hasAttribute("delete-user")) {
          this.delete(event.target.attributes["delete-user"].value);
        } else if (event.target.hasAttribute("toggle-admin-user")) {
          this.toggleAdmin(event.target.attributes["toggle-admin-user"].value);
        } else if (event.target.hasAttribute("update-user-password")) {
          this.updatePasswordModal(
            event.target.attributes["update-user-password"].value
          );
        } else if (event.target.hasAttribute("active-user")) {
          this.active(event.target.attributes["active-user"].value);
        }
      }
    );
    this.dtTrigger.next();
    this.getUsersList();
  }

  ngOnDestroy() {
    // Do not forget to unsubscribe the event
    this.dtTrigger.unsubscribe();
  }

  getUsersList() {
    this.usersList = [];
    this.userService.getUsersList().subscribe(
      val => {
        this.usersList = val.response || [];
        this.rerender();
      },
      err => {
        console.warn(err);
        this.alert.error("Unable to retrieve user details");
      }
    );
  }

  add() {
    this.router.navigate(["/register"]);
  }

  update(userID: number) {
    this.router.navigate(["/register"], {
      queryParams: { uID: btoa(userID.toString()) }
    });
  }

  delete(userID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to delete this user?"
      },
      () => {
        this.userService.deleteUser(userID).subscribe(val => {
          this.alert.success("Details successfully updated");
          this.usersList = this.usersList.filter(u => {
            return u.uID != userID;
          });
          this.rerender();
        });
      },
      () => {
        // Do nothing if NO
      }
    );
  }

  toggleAdmin(userID: number) {
    this.userService.toggleAdmin(userID).subscribe(val => {
      if (val.status === 200 && val.response) {
        this.alert.success("Details successfully updated");
        this.usersList = this.usersList.map(u => {
          if (u.uID == userID) {
            u.isAdmin = !u.isAdmin;
          }
          return u;
        });
        this.rerender();
      }
    });
  }

  updatePasswordModal(userID: number) {
    // Set user for update password
    let user = this.usersList.filter(u => {
      return u.uID == userID;
    });

    this.updatePasswordFor = user.length > 0 ? user[0] : new UserDetail();
  }

  updatePassword() {
    this.userService
      .updateUserPasswd({
        uID: this.updatePasswordFor.uID,
        passwd: this.updatedPass
      })
      .subscribe(
        val => {
          if (val.status === 200 && val.response) {
            this.alert.success("Password successfully updated");
            this.resetUpdatePassValues();
          }
        },
        err => {
          console.warn(err);
          this.alert.error("Unable to update user password");
          this.resetUpdatePassValues();
        }
      );
  }

  resetUpdatePassValues() {
    this.updatePasswordFor = new UserDetail();
    this.updatedPass = "";
  }

  active(userID: number) {
    this.confirmationDialogService.confirmThis(
      {
        message: "Do you really want to ACTIVE this user?"
      },
      () => {
        this.userService.activeUser(userID).subscribe(val => {
          this.alert.success("Details successfully updated");
          this.usersList = this.usersList.map(u => {
            if (u.uID == userID) u.isActive = 1;
            return u;
          });
          this.rerender();
        });
      },
      () => {
        // Do nothing if NO
      }
    );
  }

  view(uID: number) {
    this.router.navigate(["userdocs", uID]);
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
