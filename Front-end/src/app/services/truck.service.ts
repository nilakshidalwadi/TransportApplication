import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";

export interface res {
  status: number;
  error: any;
  response: any;
}
export class TruckDetail {
  tID?: number;
  regoNum: string = "";
  cName: string = "";
  model?: number;
  maftYear: number;
  inUse?: number;
}
export class ServiceDetail {
  tID?: number;
  // tName: string = '';
  sDate?: Date;
  sKm?: number;
  sFrom: string = "";
  sNextDueDate?: Date;
  sNextDueKm?: string = "";
  sDesc?: string = "";
}

@Injectable({
  providedIn: "root"
})
export class TruckService {
  private baseUrl: string = `${environment.apiBaseURL}/truck`;

  constructor(private httpClient: HttpClient) {}

  addTruck(truckDetails: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/addTruck`, truckDetails);
  }

  addTruckService(truckService: object) {
    return this.httpClient.post<res>(
      `${this.baseUrl}/addTruckService`,
      truckService
    );
  }

  getTruckNameList() {
    return this.httpClient.get<res>(`${this.baseUrl}/truckNameList`);
  }
  getUserList() {
    return this.httpClient.get<res>(`${this.baseUrl}/userList`);
  }

  getZoneNameList() {
    return this.httpClient.get<res>(`${this.baseUrl}/zoneNameList`);
  }

  /*methods for truck update, delete,add */
  add(truckDetails: object): Observable<res> {
    return this.httpClient.post<res>(`${this.baseUrl}/list`, truckDetails);
  }

  updateTruck(tID: number, truckDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/update/${tID}`,
      truckDetails
    );
  }

  deleteTruck(truckID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/delete/${truckID}`, {});
  }

  activeTruck(truckID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/active/${truckID}`, {});
  }

  getTrucksList(): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/truckList`);
  }

  getTruckDetails(tID: number): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/${tID}`);
  }

  /*methods for services add,update, delete */
  addService(serviceDetails: object): Observable<res> {
    return this.httpClient.post<res>(
      `${this.baseUrl}/servicelist`,
      serviceDetails
    );
  }

  updateService(tID: number, serviceDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/updateservice/${tID}`,
      serviceDetails
    );
  }
  deleteService(truckID: number): Observable<res> {
    return this.httpClient.post<res>(
      `${this.baseUrl}/servicedelete/${truckID}`,
      {}
    );
  }
  getServiceList(): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/serviceList`);
  }
  getServiceDetails(tsID: number): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/servicedetail/${tsID}`);
  }

  // get_locations() {
  //     return this.httpClient.get(this.baseUrl + '/locations');
  // }
  // get_transactions() {
  //     return this.httpClient.get(this.baseUrl + '/families');
  // }
}
