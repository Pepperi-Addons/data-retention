import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

//@ts-ignore
import {PepperiTextboxComponent as PepperiTextboxComp} from 'pepperi-textbox'

@Component({
  selector: 'pepperi-textbox',
  template: `<ndc-dynamic #comp
  [ndcDynamicComponent]="component"
  [ndcDynamicInputs]="inputs"
  [ndcDynamicOutputs]="outputs">
</ndc-dynamic>`,
  styles: []
})
export class PepperiTextboxComponent implements OnInit, OnChanges {

  component = PepperiTextboxComp
  inputs = {

  }
  outputs = {
    valueChanged: (event: any) => {
      this.value = event.value;
      this.valueChange.emit(this.value);
    }
  }

  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(): void {
    this.setInputs()
  }

  setInputs() {
    this.inputs = {
      value: this.value,
      type: this.type,
      label: this.label,
      required: this.required,
      disabled: this.disabled,
      readonly: this.readonly
    }
  }
 
  @Input() value: any = '';
  @Input() type: string = 'text';
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;

  @Output()
  valueChange = new EventEmitter<string>();
}
