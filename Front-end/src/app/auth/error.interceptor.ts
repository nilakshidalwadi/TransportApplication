import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthService } from "./auth.service";
import { LoaderService } from "../loader/loader.service";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private loaderService: LoaderService
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError(err => {
        console.log(err);
        if (err.status === 401 && (err.url || "").indexOf("/login") === -1) {
          // auto logout if 401 response returned from api
          this.auth.logout();
          // location.reload(true);
        }
        this.loaderService.hide();
        const error = (err.error && err.error.message) || err.statusText;
        return throwError(error);
      })
    );
  }
}
