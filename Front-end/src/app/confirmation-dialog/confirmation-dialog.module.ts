import { NgModule } from "@angular/core";
import { ConfirmationDialogComponent } from "./confirmation-dialog.component";
import { CommonModule } from "@angular/common";
import { ConfirmationDialogService } from "./confirmation-dialog.service";

@NgModule({
  declarations: [ConfirmationDialogComponent],
  imports: [CommonModule],
  exports: [ConfirmationDialogComponent],
  providers: [ConfirmationDialogService]
})
export class ConfirmationDialogModule {}
