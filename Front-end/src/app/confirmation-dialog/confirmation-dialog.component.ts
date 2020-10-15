import { Component, OnInit } from "@angular/core";
import { ConfirmationDialogService } from "./confirmation-dialog.service";

@Component({
  selector: "app-confirmation-dialogue",
  template: `
    <div
      *ngIf="message"
      class="modal"
      tabindex="-1"
      role="dialog"
      style="display:block!important"
    >
      <div class="modal-dialog custom-alert" role="document">
        <div class="modal-content">
          <div *ngIf="message?.type == 'confirm'" class="modal-body">
            <div class="row">
              <div class="col-md-12">
                <p class="text-center confirm-message">{{ message.text }}</p>
              </div>
            </div>
            <div class="row text-center" style="margin-top: 5px;">
              <button (click)="message.siFn()" class="col-5 btn btn-yes">
                {{ message.btnOkText }}
              </button>
              <button
                (click)="message.noFn()"
                class="col-5 btn btn-danger btn-no"
              >
                {{ message.btnCancelText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ["./confirmation-dialog.component.scss"]
})
export class ConfirmationDialogComponent implements OnInit {
  message: any;

  constructor(private confirmDialogService: ConfirmationDialogService) {}

  ngOnInit() {
    //this function waits for a message from alert service, it gets
    //triggered when we call this from any other component
    this.confirmDialogService.getMessage().subscribe(message => {
      this.message = message;
    });
  }
}
