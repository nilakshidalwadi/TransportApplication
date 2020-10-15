import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";

export interface res {
  status: number;
  error: any;
  response: any;
}

export class JobDetail {
  jID?: number;
  jType: string = "";
  reportBy: string = "";
  active?: number;
}

export class ZoneDetail {
  zID?: number;
  zNumber?: number;
  zName: string = "";
  rDpallet?: number;
  rFpallet?: number;
  active?: number;
}

@Injectable({
  providedIn: "root"
})
export class JobTypeService {
  private baseUrl: string = `${environment.apiBaseURL}/jobtype`;

  constructor(private httpClient: HttpClient) {}

  addJob(jobDetails: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/addJob`, jobDetails);
  }
  getJobTypeList(): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/JobTypeList`);
  }

  getJobList() {
    return this.httpClient.get<res>(`${this.baseUrl}/JobList`);
  }

  getJobDetails(jID: number): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/${jID}`);
  }

  updateJob(jID: number, jobDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/update/${jID}`,
      jobDetails
    );
  }
  activeJob(jobID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/active/${jobID}`, {});
  }
  deleteJob(jID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/delete/${jID}`, {});
  }

  addZone(zoneDetails: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/addZone`, zoneDetails);
  }

  getZoneList() {
    return this.httpClient.get<res>(`${this.baseUrl}/zoneList`);
  }
  getZoneDetails(zID: number): Observable<res> {
    return this.httpClient.get<res>(`${this.baseUrl}/zone/${zID}`);
  }

  updateZone(zID: number, zoneDetails: object): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/updatezone/${zID}`,
      zoneDetails
    );
  }
  activeZone(zoneID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/activezone/${zoneID}`, {});
  }
  deleteZone(zID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/deletezone/${zID}`, {});
  }
}
