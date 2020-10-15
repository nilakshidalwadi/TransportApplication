import { BrowserModule } from "@angular/platform-browser";
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

// Authentication
import { AuthService } from "./auth/auth.service";
import { AuthGuard } from "./auth/auth.guard";
import { JwtInterceptor } from "./auth/jwt.interceptor";
import { ErrorInterceptor } from "./auth/error.interceptor";

import { LoginComponent } from "./login/login.component";
import { MenuBarComponent } from "./menu-bar/menu-bar.component";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { UserService } from "./services/user.service";
import { TruckComponent } from "./admin/truck/truck.component";
import { TripComponent } from "./user/trip/trip.component";
import { RegisterComponent } from "./admin/register/register.component";
import { TruckServiceComponent } from "./admin/truck-service/truck-service.component";

// Date picker
import {
  DlDateTimePickerModule,
  DlDateTimePickerDateModule
} from "angular-bootstrap-datetimepicker";

// Data table
import { DataTablesModule } from "angular-datatables";

import { DisplayUsersComponent } from "./admin/display-users/display-users.component";
import { ReportComponent } from "./admin/report/report.component";
import { DashboardComponent } from "./admin/dashboard/dashboard.component";
import { DeclarationComponent } from "./user/declaration/declaration.component";
import { QuestionsComponent } from "./user/questions/questions.component";
import { DisplayTruckComponent } from "./admin/display-truck/display-truck.component";
import { DisplayTruckserviceComponent } from "./admin/display-truckservice/display-truckservice.component";
import { AlertModule } from "./alert/alert.module";
import { MoreDetailsComponent } from "./admin/more-details/more-details.component";
import { DocsComponent } from "./docs/docs.component";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";
import { UserdocsComponent } from "./admin/userdocs/userdocs.component";
import { ConfirmationDialogModule } from "./confirmation-dialog/confirmation-dialog.module";
import { JobsheetimgComponent } from "./admin/jobsheetimg/jobsheetimg.component";
import { HomeComponent } from "./home/home.component";
import { EditTripComponent } from "./admin/edit-trip/edit-trip.component";
import { LoaderComponent } from "./loader/loader.component";
import { LoaderService } from "./loader/loader.service";
import { LoaderInterceptor } from "./loader/loader.interceptor";
import { JobTypeComponent } from "./admin/job-type/job-type.component";
import { ZoneTypeComponent } from "./admin/zone-type/zone-type.component";
import { DisplayJobtypeComponent } from "./admin/display-jobtype/display-jobtype.component";
import { DisplayZonetypeComponent } from "./admin/display-zonetype/display-zonetype.component";
import { FormSelectComponent } from "./directives/form-select/form-select.component";
import { AttachmentsModule } from "./directives/attachments/attachments.module";

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MenuBarComponent,
    TruckComponent,
    RegisterComponent,
    TripComponent,
    TruckServiceComponent,
    DisplayUsersComponent,
    ReportComponent,
    DashboardComponent,
    DeclarationComponent,
    QuestionsComponent,
    DisplayTruckComponent,
    DisplayTruckserviceComponent,
    MoreDetailsComponent,
    DocsComponent,
    UserdocsComponent,
    JobsheetimgComponent,
    HomeComponent,
    EditTripComponent,
    LoaderComponent,
    JobTypeComponent,
    ZoneTypeComponent,
    DisplayJobtypeComponent,
    DisplayZonetypeComponent,
    FormSelectComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    DlDateTimePickerDateModule, // <--- Determines the data type of the model
    DlDateTimePickerModule,
    DataTablesModule,
    AlertModule,
    ServiceWorkerModule.register("./ngsw-worker.js", {
      enabled: environment.production
    }),
    ConfirmationDialogModule,
    AttachmentsModule
  ],
  providers: [
    UserService,
    AuthService,
    LoaderService,
    AuthGuard,
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {}
