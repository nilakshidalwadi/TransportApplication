import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { map } from "rxjs/operators";
import { environment } from "../../environments/environment";
import * as CryptoJS from "crypto-js";
import { Router } from "@angular/router";
import { TripService } from "../services/trip.service";

export enum Role {
  User = "User",
  Admin = "Admin"
}

export class User {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
  token?: string;
}

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private loginURL: string = `${environment.apiBaseURL}/users/login`;
  private authURL: string = `${environment.apiBaseURL}/checkAuth`;

  private encSecKey: string = environment.encSecKey;
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(
    private http: HttpClient,
    private router: Router,
    private tripService: TripService
  ) {
    this.currentUserSubject = new BehaviorSubject<User>(
      this.decryptData(localStorage.getItem("access_token"))
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  public get loggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  public get isAdmin(): boolean {
    return (
      this.currentUserSubject.value &&
      this.currentUserSubject.value.role === Role.Admin
    );
  }

  public get isUser(): boolean {
    return (
      this.currentUserSubject.value &&
      this.currentUserSubject.value.role === Role.User
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.http
      .post<User>(this.loginURL, { username: username, password: password })
      .pipe(
        map(user => {
          // login successful if there's a jwt token in the response
          if (user && user.token) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem("access_token", this.encryptData(user));
            this.currentUserSubject.next(user);
          }
          return user;
        })
      );
  }

  checkAuth() {
    return this.http.get(this.authURL).subscribe(
      result => {
        console.log("User Authorized");
      },
      err => {
        this.logout();
      }
    );
  }

  loginRedirect() {
    this.router.navigate(["/login"]);
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem("access_token");
    this.currentUserSubject.next(null);
    // remove trip details
    this.tripService.setTripData(null);
    if (this.detectmob()) {
      this.router.navigate(["/login"]);
    } else {
      this.router.navigate(["/home"]);
    }
  }

  public get userRootURL(): string {
    let url: string = "/"; // Default Admin
    if (this.currentUserValue && this.currentUserValue.role === Role.User)
      url = "/declaration"; // If driver
    return url;
  }

  encryptData(data: User) {
    try {
      return CryptoJS.AES.encrypt(
        JSON.stringify(data),
        this.encSecKey
      ).toString();
    } catch (e) {
      console.log(e);
    }
  }

  decryptData(data) {
    try {
      // If there is no data
      if (!data) return null;

      const bytes = CryptoJS.AES.decrypt(data, this.encSecKey);
      if (bytes.toString()) {
        return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      }
      return data;
    } catch (e) {
      console.log(e);
    }
  }

  detectmob(): boolean {
    if (
      navigator.userAgent.match(/Android/i) ||
      navigator.userAgent.match(/webOS/i) ||
      navigator.userAgent.match(/iPhone/i) ||
      navigator.userAgent.match(/iPad/i) ||
      navigator.userAgent.match(/iPod/i) ||
      navigator.userAgent.match(/BlackBerry/i) ||
      navigator.userAgent.match(/Windows Phone/i) ||
      (window.innerWidth <= 800 && window.innerHeight <= 600)
    ) {
      return true;
    } else {
      return false;
    }
  }
}
