import { NgModule } from "@angular/core";
import { Routes, RouterModule, Router } from "@angular/router";
import { LoginComponent } from "./login/login.component";
import { TruckComponent } from "./admin/truck/truck.component";
import { RegisterComponent } from "./admin/register/register.component";
import { AuthGuard } from "./auth/auth.guard";
import { Role } from "./auth/auth.service";
import { TruckServiceComponent } from "./admin/truck-service/truck-service.component";
import { TripComponent } from "./user/trip/trip.component";
import { DisplayUsersComponent } from "./admin/display-users/display-users.component";
import { DashboardComponent } from "./admin/dashboard/dashboard.component";
import { DeclarationComponent } from "./user/declaration/declaration.component";
import { QuestionsComponent } from "./user/questions/questions.component";
import { DisplayTruckComponent } from "./admin/display-truck/display-truck.component";
import { DisplayTruckserviceComponent } from "./admin/display-truckservice/display-truckservice.component";
import { ReportComponent } from "./admin/report/report.component";
import { MoreDetailsComponent } from "./admin/more-details/more-details.component";
import { DocsComponent } from "./docs/docs.component";
import { UserdocsComponent } from "./admin/userdocs/userdocs.component";
import { JobsheetimgComponent } from "./admin/jobsheetimg/jobsheetimg.component";
import { HomeComponent } from "./home/home.component";
import { EditTripComponent } from "./admin/edit-trip/edit-trip.component";
import { JobTypeComponent } from "./admin/job-type/job-type.component";
import { ZoneTypeComponent } from "./admin/zone-type/zone-type.component";
import { DisplayJobtypeComponent } from "./admin/display-jobtype/display-jobtype.component";
import { DisplayZonetypeComponent } from "./admin/display-zonetype/display-zonetype.component";

const routes: Routes = [
  {
    path: "",
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "trucks",
    component: TruckComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  }, // Truck
  {
    path: "register",
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  { path: "login", component: LoginComponent },
  { path: "home", component: HomeComponent },
  {
    path: "truckServices",
    component: TruckServiceComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "jobtype",
    component: JobTypeComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "zonetype",
    component: ZoneTypeComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "displaytruckServices",
    component: DisplayTruckserviceComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "jobsheetimg",
    component: JobsheetimgComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },

  {
    path: "users",
    component: DisplayUsersComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "displaytrucks",
    component: DisplayTruckComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "displayjobtype",
    component: DisplayJobtypeComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "displayzonetype",
    component: DisplayZonetypeComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "report",
    component: ReportComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "trip/detail/:tpID",
    component: MoreDetailsComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "edit/trip/:tpID",
    component: EditTripComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "add/trip",
    component: EditTripComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "userdocs/:uID",
    component: UserdocsComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Admin] }
  },
  {
    path: "declaration",
    component: DeclarationComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.User] }
  },

  {
    path: "trip",
    component: TripComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.User, Role.Admin] }
  },
  {
    path: "docs",
    canActivate: [AuthGuard],
    component: DocsComponent,
    data: { roles: [Role.User, Role.Admin] }
  },
  {
    path: "checklist",
    component: QuestionsComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.User] }
  },
  { path: "**", redirectTo: "" }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      { onSameUrlNavigation: "reload" }
      // { enableTracing: true } // <-- debugging purposes only
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
