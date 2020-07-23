import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, OnInit, Inject, ViewChild, OnDestroy, Injectable } from '@angular/core';
// @ts-ignore
import { PepperiSelectComponent} from 'pepperi-select';
// @ts-ignore
import { PepperiCheckboxComponent} from 'pepperi-checkbox';
import { DialogModel } from 'src/app/plugin.model';
import { DynamicComponent } from 'ng-dynamic-component';
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class AddTypeDialogService {

    private dataSource = new BehaviorSubject<any>('');
    data = this.dataSource.asObservable();

    constructor() { }

    getData(data: any) {
        this.dataSource.next(data);
    }

}
@Component({
  selector: 'app-add-type-dialog',
  templateUrl: './add-type-dialog.component.html',
  styleUrls: ['./add-type-dialog.component.scss']
})
export class AddTypeDialogComponent implements OnInit, OnDestroy {


    // pepperiSelect = PepperiSelectComponent;
    // @ViewChild("pepperiSelectTypeComp", {static:false}) pepperiSelectTypeComp: DynamicComponent;
    // pepperiSelectTypeInputs;
    // pepperiSelectTypeOutputs;
    activityTypes = [];

    // pepperiCheckbox = PepperiCheckboxComponent;
    // @ViewChild("pepperiCheckboxComp", {static:false}) pepperiCheckboxComp: DynamicComponent;
    // pepperiCheckboxInputs;
    // pepperiCheckboxOutputs;

    title;
    form: FormGroup;
    dialogData;
    svgIcons;
    NumOfMonths;
    minItems;
    selectedActivity;
    mode = 'Add';
    maxHistory: number = 24;

    constructor(private fb: FormBuilder,
        public dialogRef: MatDialogRef<AddTypeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public incoming: DialogModel) {

        this.title = incoming.title;
        this.dialogData = incoming.data;
        this.activityTypes = incoming.data.activityTypes;
        this.svgIcons = incoming.data.svgIcons;
        this.maxHistory = this.dialogData.numOfMonths = incoming.data.maxHistory; 
        this.dialogData.minItems = '';
        if (incoming.data.selectedType){
            let current = incoming.data.selectedType;
            this.dialogData.numOfMonths = current.NumOfMonths;
            this.dialogData.minItems = current.MinItems;
            this.dialogData.selectedActivity = current.ActivityType.Key;
            this.selectedActivity = current.ActivityType.Key;
            this.mode = 'Edit'
        }
    }

    ngOnInit() {
        this.form = this.fb.group({
            numOfMonths: [this.NumOfMonths, []],
            minItems: [this.minItems, []],
            selectedActivity: [this.selectedActivity, []]
        });
    }

    // onAdd() {
    //     this.dialogData =
    //         {
    //             selectedActivity: this.selectedActivity,
    //             numOfMonths: this.NumOfMonths,
    //             minItems: this.minItems,
    //             boolean: true,
    //         };
    // }

    // pepperiSelectOnInit(compRef, inputs, outputs, key, label, options, initalValue = null) {
    //     const self = this;
    //     this[inputs] = {
    //         'key': key,
    //         'label': label,
    //         'rowSpan': '3',
    //         'xAlignment': '1',
    //         'options': options,
    //         'emptyOption': false,
    //         'value': initalValue ? initalValue.Key : options[0].Key,
    //         'formattedValue': initalValue ?  initalValue.Value : options[0].Value,
    //         'readonly': true
    //     };

    //     this.dialogData.selectedType = initalValue ? initalValue : options[0];

    //     this[outputs] = {
    //         elementClicked: (event) => self.onElementClicked(event),
    //         valueChanged: (event) => self.onValueChanged(event)
    //     };
    // }

    // pepperiCheckboxOnInit(compRef, inputs, outputs, key, label, value) {
    //     const self = this;
    //     this[inputs] = {
    //         key: key,
    //         label: label,
    //         rowSpan: '3',
    //         xAlignment: '1',
    //         emptyOption: false,
    //         value: value
    //     };
    //     this[outputs] = {
    //         elementClicked: (event) => self.onElementClicked(event),
    //         valueChanged: (event) => self.onValueChanged(event)
    //     };
    // }

    // onElementClicked(e) {
    // }

    // onValueChanged(e) {
    //     switch (e.apiName) {
    //         case 'ObjectSelect':
    //             let selectedActivity = this.activityTypes.filter(activity => activity.Key == e.value)[0];
    //             this.dialogData['selectedType'] = selectedActivity;
    //     }
    // }

    ngOnDestroy(){
        this.selectedActivity = null;
        this.dialogData = null;
    }

}
