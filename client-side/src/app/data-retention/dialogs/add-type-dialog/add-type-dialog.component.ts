import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject, ViewChild, OnDestroy, Injectable, ViewEncapsulation } from '@angular/core';
import { DialogModel, TypeDialogData } from 'src/app/data-retention/data-retention.model';
import {ScheduledType, DEFAULT_NUM_OF_MONTHS } from "../../../../../../shared/entities";
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
  styleUrls: ['./add-type-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AddTypeDialogComponent implements OnInit, OnDestroy {

    activityTypes = [];
    title: string;
    dialogData: TypeDialogData;
    NumOfMonths: number;
    minItems: number;
    selectedActivity: number;
    mode = 'Add';
    maxHistory: number = DEFAULT_NUM_OF_MONTHS;
    isNumOfMonthsValid: boolean = true;
    isMinItemsValid: boolean = true;
    isActivityValid: boolean = false;

    constructor( public dialogRef: MatDialogRef<AddTypeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public incoming: DialogModel) {

        this.title = incoming.title;
        this.dialogData = incoming.data;
        this.activityTypes = incoming.data.activityTypes;
        this.maxHistory = this.dialogData.numOfMonths = incoming.data.maxHistory; 
        this.dialogData.minItems = '';
        if (incoming.data.selectedType){
            let current: ScheduledType  = incoming.data.selectedType;
            this.dialogData.numOfMonths = current.NumOfMonths;
            this.dialogData.minItems = current.MinItems.toString();
            this.dialogData.selectedActivity = current.ActivityType.key;
            this.selectedActivity = current.ActivityType.key;
            this.mode = 'Edit';
            this.isActivityValid = true;
            this.isNumOfMonthsValid = Number(current.NumOfMonths) <= Number(this.maxHistory);
        }
    }

    ngOnInit() {
    }

    ngOnDestroy(){
        this.selectedActivity = null;
        this.dialogData = null;
    }

    onValueChanged(element, $event) {
        console.log($event);
        switch(element) {
            case 'Activity': {
                this.dialogData.selectedActivity = $event;
                break;
            }
            case 'NumOfMonths': {
                this.dialogData.numOfMonths = $event;
                break;
            }
            case 'MinItems': {
                this.dialogData.minItems = $event;
                break;
            }
        }
    }
}
