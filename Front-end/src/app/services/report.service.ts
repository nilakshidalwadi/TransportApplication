import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { Observable } from "rxjs";

export interface res {
  status: number;
  error: any;
  response: any;
}

@Injectable({
  providedIn: "root"
})
export class ReportService {
  private baseUrl: string = `${environment.apiBaseURL}/report`;

  constructor(private httpClient: HttpClient) {}

  getReport(filter: object) {
    return this.httpClient.post<res>(`${this.baseUrl}/`, filter);
  }

  deleteTrip(tripID: number): Observable<res> {
    return this.httpClient.put<res>(`${this.baseUrl}/delete/${tripID}`, {});
  }
}
