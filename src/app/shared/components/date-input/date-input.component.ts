import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-date-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input
      class="input date-input"
      type="date"
      [ngModel]="value"
      (ngModelChange)="handleChange($event)"
      (blur)="onTouched()"
    />
  `,
  styles: [`
    :host { display: block; }
    .date-input {
      color-scheme: inherit;
      &::-webkit-calendar-picker-indicator {
        filter: var(--date-picker-filter, none);
        cursor: pointer;
        opacity: 0.6;
        &:hover { opacity: 1; }
      }
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
  ],
})
export class DateInputComponent implements ControlValueAccessor {
  value = '';

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void       { this.value = val ?? ''; }
  registerOnChange(fn: typeof this.onChange): void  { this.onChange = fn; }
  registerOnTouched(fn: typeof this.onTouched): void { this.onTouched = fn; }

  handleChange(val: string): void {
    this.value = val;
    this.onChange(val);
  }
}
