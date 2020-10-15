import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";

export interface res {
  status: number;
  error: any;
  response: any;
}

export class UserDetail {
  uID?: number;
  uName: string = "";
  fName: string = "";
  lName: string = "";
  phoneNum: string = "";
  address: string = "";
  drivingLicence: string = "";
  licenceExpiryDate: Date;
  inductionExpiryDate: Date;
}

@Injectable({
  providedIn: "root"
})
export class UserService {
  private baseUrl: string = `${environment.apiBaseURL}/users`;

  constructor(private httpClient: HttpClient) {}

  login(loginDetails: object): Observable<res> {
    return this.httpClient.post<res>(this.baseUrl + "/login", loginDetails);
  }

  addUser(driverDetails: object): Observable<res> {
    return this.httpClient.post<res>(`${this.baseUrl}/add`, driverDetails);
  }

  toggleAdmin(userID: number): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/toggleAdmin/${userID}`,
      {}
    );
  }

  updateUser(uID: number, driverDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/update/${uID}`,
      driverDetails
    );
  }

  updateUserPasswd(userDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/updatePassword`,
      userDetails
    );
  }

  deleteUser(userID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/delete/${userID}`, {});
  }

  activeUser(userID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/active/${userID}`, {});
  }

  getUsersList(): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/list`);
  }

  getUserDetails(uID: number): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/${uID}`);
  }
}
