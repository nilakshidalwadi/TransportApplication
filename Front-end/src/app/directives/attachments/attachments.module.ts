import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { AttachmentsComponent } from "./attachments.component";
import { FormsModule } from "@angular/forms";

@NgModule({
  declarations: [AttachmentsComponent],
  imports: [CommonModule, FormsModule],
  exports: [AttachmentsComponent]
})
export class AttachmentsModule {}
