import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";

export interface res {
  status: number;
  error: any;
  response: any;
}
export class Docs {
  attachID?: number;
  driverVisible?: number;
  originalFileName: string = "";
  path: string = "";
  time: Date;
}
@Injectable({
  providedIn: "root"
})
export class FileUploadService {
  private baseUrl: string = `${environment.apiBaseURL}`;
  constructor(private httpClient: HttpClient) {}

  uploadFile(files) {
    return this.httpClient.post<res>(`${this.baseUrl}/upload`, files);
  }

  downloadFile(path: string) {
    return this.httpClient.get<res>(`${this.baseUrl}/upload/download/${path}`);
  }

  getDocumentsList() {
    return this.httpClient.get<res>(`${this.baseUrl}/upload/docList`);
  }
  getUserDocumentsList(uID: number) {
    return this.httpClient.get<res>(
      `${this.baseUrl}/upload/userDocList/${uID}`
    );
  }
  driverVisible(attachID: number): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/upload/toggleDriverVisible/${attachID}`,
      {}
    );
  }

  deleteDoc(attachID: number): Observable<res> {
    return this.httpClient.put<res>(
      `${this.baseUrl}/upload/delete/${attachID}`,
      {}
    );
  }

  downloadFilteredImages(filter: object): Observable<HttpResponse<Blob>> {
    return this.httpClient.post<Blob>(
      `${this.baseUrl}/trip/downloadFilteredImages`,
      filter,
      {
        observe: "response",
        responseType: "blob" as "json"
      }
    );
  }
}
