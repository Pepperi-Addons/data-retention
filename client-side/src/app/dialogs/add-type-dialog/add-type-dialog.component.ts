import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormBuilder, FormGroup } from '@angular/forms';
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


    pepperiSelect = PepperiSelectComponent;
    @ViewChild("pepperiSelectTypeComp") pepperiSelectTypeComp: DynamicComponent;
    pepperiSelectTypeInputs;
    pepperiSelectTypeOutputs;
    activityTypes = [];

    pepperiCheckbox = PepperiCheckboxComponent;
    @ViewChild("pepperiCheckboxComp") pepperiCheckboxComp: DynamicComponent;
    pepperiCheckboxInputs;
    pepperiCheckboxOutputs;

    title;
    form: FormGroup;
    dialogData;
    svgIcons;
    maxHistory;
    minItems;
    selectedActivity;

    constructor(private fb: FormBuilder,
        public dialogRef: MatDialogRef<AddTypeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public incoming: DialogModel) {

        this.title = incoming.title;
        this.dialogData = incoming.data;
        this.activityTypes = incoming.data.activityTypes;
        this.svgIcons = incoming.data.svgIcons;
        if (incoming.data.selectedType){
            let current = incoming.data.selectedType;
            this.dialogData.maxHistory = incoming.data.maxHistory;
            this.dialogData.minItems = incoming.data.minItems;
            this.dialogData.selectedActivity = current.ActivityType;
            this.selectedActivity = current.ActivityType;
        }
    }

    ngOnInit() {
        this.form = this.fb.group({
            maxHistory: [this.maxHistory, []],
            minItems: [this.minItems, []],
            selectedActivity: [this.selectedActivity, []]
        });
    }

    onConfirm() {
        this.dialogData =
            {
                selectedActivity: this.selectedActivity,
                maxHistory: this.maxHistory,
                minItems: this.minItems,
                boolean: true,
            };
    }

    pepperiSelectOnInit(compRef, inputs, outputs, key, label, options, initalValue = null) {
        const self = this;
        this[inputs] = {
            'key': key,
            'label': label,
            'rowSpan': '3',
            'xAlignment': '1',
            'options': options,
            'emptyOption': false,
            'value': initalValue ? initalValue.Key : options[0].Key,
            'formattedValue': initalValue ?  initalValue.Value : options[0].Value,
            'readonly': true
        };

        this.dialogData.selectedType = initalValue ? initalValue : options[0];

        this[outputs] = {
            elementClicked: (event) => self.onElementClicked(event),
            valueChanged: (event) => self.onValueChanged(event)
        };
    }

    pepperiCheckboxOnInit(compRef, inputs, outputs, key, label, value) {
        const self = this;
        this[inputs] = {
            key: key,
            label: label,
            rowSpan: '3',
            xAlignment: '1',
            emptyOption: false,
            value: value
        };
        this[outputs] = {
            elementClicked: (event) => self.onElementClicked(event),
            valueChanged: (event) => self.onValueChanged(event)
        };
    }

    onElementClicked(e) {
    }

    onValueChanged(e) {
        switch (e.apiName) {
            case 'ObjectSelect':
                let selectedActivity = this.activityTypes.filter(activity => activity.Key == e.value)[0];
                this.dialogData['selectedType'] = selectedActivity;
        }
    }

    ngOnDestroy(){
        this.selectedActivity = null;
        this.dialogData = null;
    }

}
