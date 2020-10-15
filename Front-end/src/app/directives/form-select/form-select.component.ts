import { Component, OnInit, Input, forwardRef } from "@angular/core";
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  AbstractControl
} from "@angular/forms";

@Component({
  selector: "app-form-select",
  templateUrl: "./form-select.component.html",
  styleUrls: ["./form-select.component.scss"],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => FormSelectComponent)
    }
  ]
})
export class FormSelectComponent implements ControlValueAccessor {
  public selectedValue = "";
  public disabled = false;
  private _value: string;

  @Input()
  label: string;

  @Input()
  formCtrl: AbstractControl;

  @Input()
  pipe: { type?: string; params?: any };

  @Input()
  options: { key: string; label: string }[] = [];

  @Input()
  customId: string;

  @Input()
  placeholder: string;

  public expanded = false;

  public activeItemIndex: number;

  public onChange(newVal: any) {}

  public onTouched(_?: any) {}

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.onChange(val);
    this.onTouched();
  }

  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(value: string) {
    if (value && this.options) {
      const match = this.options.find((item: any, index: number) => {
        if (item.key === value) {
          this.activeItemIndex = index;
          return true;
        }
      });
      this.selectedValue = match ? match.label : "";
    }
  }

  showOptions() {
    if (!this.disabled) {
      this.expanded = true;
    }
  }

  selectItem(item: { key: string; label: string }) {
    this._value = item.key;
    this.expanded = false;
    this.selectedValue = item.label;
    this.onChange(item.key);
  }
}
