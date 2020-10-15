import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";

export interface confirmationModel {
  message: string;
  btnOkText?: string;
  btnCancelText?: string;
}

@Injectable({
  providedIn: "root"
})
export class ConfirmationDialogService {
  private subject = new Subject<any>();
  constructor() {}

  confirmThis(message: confirmationModel, siFn: () => void, noFn: () => void) {
    this.setConfirmation(message, siFn, noFn);
  }

  setConfirmation(
    message: confirmationModel,
    siFn: () => void,
    noFn: () => void
  ) {
    let that = this;
    this.subject.next({
      type: "confirm",
      text: message.message,
      btnOkText: message.btnOkText || "Yes",
      btnCancelText: message.btnCancelText || "No",
      siFn: function() {
        that.subject.next(); //this will close the modal
        siFn();
      },
      noFn: function() {
        that.subject.next();
        noFn();
      }
    });
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }
}
