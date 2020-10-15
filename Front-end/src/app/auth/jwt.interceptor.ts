import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    constructor(private auth: AuthService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // add authorization header with jwt token if available
        let currentUser = this.auth.currentUserValue;
        if (currentUser && currentUser.token && this.checkWhiteList(request.url) && !this.checkBlackList(request.url)) {
            request = request.clone({
                setHeaders: {
                    Authorization: `Bearer ${currentUser.token}`
                }
            });
        }
        return next.handle(request);
    }

    checkWhiteList(url: string): boolean {
        for (let wurl of environment.whiteListURLs) {
            if (new RegExp(`^(http|https)://${wurl}`, 'i').test(url)) return true;
        }
        return false;
    }

    checkBlackList(url: string): boolean {
        for (let wurl of environment.blackListURLs) {
            if (new RegExp(`^(http|https)://${wurl}`, 'i').test(url)) return true;
        }
        return false;
    }
}