import { Injectable } from "@angular/core";
import { Router, NavigationStart } from "@angular/router";
import { Observable, Subject } from "rxjs";
import { filter } from "rxjs/operators";

import { Alert, AlertType } from "./alert.model";

@Injectable({ providedIn: "root" })
export class AlertService {
  private subject = new Subject<Alert>();
  private keepAfterRouteChange = false;

  constructor(private router: Router) {
    // clear alert messages on route change unless 'keepAfterRouteChange' flag is true
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterRouteChange) {
          // only keep for a single route change
          this.keepAfterRouteChange = false;
        } else {
          // clear alert messages
          this.clear();
        }
      }
    });
  }

  // enable subscribing to alerts observable
  onAlert(): Observable<Alert> {
    return this.subject.asObservable();
    //.pipe(filter(x => x && x.alertId === alertId));
  }

  // convenience methods
  success(message: string, alertId?: string) {
    alertId = alertId || this.uuid();
    this.alert(
      new Alert({
        message: message,
        type: AlertType.Success,
        alertId: alertId
      })
    );
    setTimeout(() => {
      this.clear(alertId);
    }, 5000);
  }

  error(message: string, alertId?: string) {
    alertId = alertId || this.uuid();
    this.alert(new Alert({ message, type: AlertType.Error, alertId }));
    setTimeout(() => {
      this.clear(alertId);
    }, 10000);
  }

  info(message: string, alertId?: string) {
    alertId = alertId || this.uuid();
    this.alert(new Alert({ message, type: AlertType.Info, alertId }));
    setTimeout(() => {
      this.clear(alertId);
    }, 5000);
  }

  warn(message: string, alertId?: string) {
    alertId = alertId || this.uuid();
    this.alert(new Alert({ message, type: AlertType.Warning, alertId }));
    setTimeout(() => {
      this.clear(alertId);
    }, 5000);
  }

  private scrollToTop() {
    // this changes the scrolling behavior to "smooth"
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // main alert method
  alert(alert: Alert) {
    this.keepAfterRouteChange = alert.keepAfterRouteChange;
    this.subject.next(alert);
    this.scrollToTop();
  }

  // clear alerts
  clear(alertId?: string) {
    this.subject.next(new Alert({ alertId }));
  }

  uuid(): string {
    return (
      Date.now().toString(36) +
      Math.random()
        .toString(36)
        .substr(2, 5)
    ).toUpperCase();
  }
}
