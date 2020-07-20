import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, EventEmitter } from '@angular/core';

// @ts-ignore
import { PepperiMenuComponent as PepperiMenuComp } from 'pepperi-menu';

@Component({
  selector: 'pepperi-menu',
  template: `<ndc-dynamic #comp
  [ndcDynamicComponent]="component"
  [ndcDynamicInputs]="inputs"
  [ndcDynamicOutputs]="outputs">
</ndc-dynamic>`,
  styles: []
})
export class PepperiMenuComponent implements OnInit, OnChanges {

  constructor() { }

  component = PepperiMenuComp
  inputs = {}
  outputs = {
    notifyMenuItemClicked: (event: any) => {
      this.menuItemClicked.emit(event);
    }
  }

  ngOnInit(): void {
    this.setInputs()
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.setInputs()
  }

  setInputs() {
    //const value = this.options.find(item => item.Key === this.value);
    this.inputs = {
      key: '',
      label: this.label,
      options: this.options,
      disabled: this.disabled,
      invertClass: this.invertClass
    }
  }

  @Output()
  menuItemClicked = new EventEmitter<any>();

  @Input()
  options: any = {}

  @Input()
  label: string = ''

  @Input()
  disabled: boolean = false

  @Input()
  invertClass: boolean = false
};