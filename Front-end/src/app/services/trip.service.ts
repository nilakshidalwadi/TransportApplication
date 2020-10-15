import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import * as CryptoJS from "crypto-js";
import { BehaviorSubject, Observable } from "rxjs";

export interface res {
  status: number;
  error: any;
  response: any;
}

export class Trip {
  tripID: number;
  jobBy?: string;
  declaration: boolean;
  checklist?: boolean;
  started?: boolean;
  ended?: boolean;
  startKM?: number;
  startDate?: Date;
}
export class TripDetail {
  tripID: number;
  truckID: number;
  jID: number;
  jType: string;
  zoneID: number;
  driverName: string;
  sKm: number;
  eKm: number;
  wHrs: number;
  sjTime: Date;
  ejTime: Date;
  jobBy: string;
  dryPallet: number;
  fridgePallet: number;
  fLoad: number;
  load: number;
  delivery: number;
  loadNum: number;
  palletDetails: any;
}

@Injectable({
  providedIn: "root"
})
export class TripService {
  private baseUrl: string = `${environment.apiBaseURL}/trip`;
  private encSecKey: string = environment.encSecKey;

  private currentTripSubject: BehaviorSubject<Trip>;
  public currentTrip: Observable<Trip>;

  constructor(private httpClient: HttpClient) {
    this.currentTripSubject = new BehaviorSubject<Trip>(
      this.decryptData(localStorage.getItem("tripDetail"))
    );
    this.currentTrip = this.currentTripSubject.asObservable();
  }

  public get currentTripValue(): Trip {
    return this.currentTripSubject.value;
  }

  public setTripData(trip?: Trip) {
    if (trip) localStorage.setItem("tripDetail", this.encryptData(trip));
    else localStorage.removeItem("tripDetail");
    this.currentTripSubject.next(trip);
  }

  declaration() {
    return this.httpClient.post<res>(`${this.baseUrl}/declaration`, {});
  }

  startTrip(trip: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/startTrip`, trip);
  }

  endTrip(trip: object) {
    return this.httpClient.put<res>(`${this.baseUrl}/endTrip`, trip);
  }

  getTripList() {
    return this.httpClient.get<res>(`${this.baseUrl}/tripList`);
  }

  getTripDetails(tripID: number) {
    return this.httpClient.get<res>(`${this.baseUrl}/tripDetail/${tripID}`);
  }
  updateTrip(tID: number, tripDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/updatetripData/${tID}`,
      tripDetails
    );
  }
  addTrip(tripDetails: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/addTrip`, tripDetails);
  }

  getTripImgData(tripID: number) {
    return this.httpClient.get<res>(`${this.baseUrl}/tripImgData/${tripID}`);
  }
  getJobSheetImagesData() {
    return this.httpClient.get<res>(`${this.baseUrl}/jobSheetImgData`);
  }
  getFilteredImages(filter: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/filteredImages`, filter);
  }
  getUserTrip(uID: number) {
    return this.httpClient.get<res>(`${this.baseUrl}/userTrip/${uID}`);
  }

  getQuestionsList() {
    return this.httpClient.get<res>(`${this.baseUrl}/que`);
  }

  getQuestionType() {
    return this.httpClient.get<res>(`${this.baseUrl}/quetype`);
  }

  ansUpdated(ans: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/addans`, ans);
  }

  getChecklistData(tripID: number) {
    return this.httpClient.get<res>(`${this.baseUrl}/checklistData/${tripID}`);
  }

  getTripData(tripID: number) {
    return this.httpClient.get<res>(`${this.baseUrl}/tripData/${tripID}`);
  }

  resetKM(tripID: number) {
    return this.httpClient.put<res>(`${this.baseUrl}/resetKM/${tripID}`, {});
  }

  encryptData(data: Trip) {
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
}
