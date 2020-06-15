import { AddTypeDialogComponent } from './dialogs/add-type-dialog/add-type-dialog.component';
import { Injectable, ElementRef } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';

//@ts-ignore
import {UserService} from 'pepperi-user-service';
//@ts-ignore
import { PepperiRowData, PepperiFieldData, FIELD_TYPE } from 'pepperi-main-service';
//@ts-ignore
import {PepperiDataConverterService} from 'pepperi-data-converter';

import { MatDialogConfig, MatDialog } from '@angular/material';
import {AdditionalData, ScheduledType } from './plugin.model';
// @ts-ignore
import { ActionButton, DialogDataType, DialogData } from 'pepperi-dialog';
import {DialogModel} from './plugin.model';
import { callbackify } from 'util';
// import {EnvVariables} from 'pepperi-environment-variables';

@Injectable({ providedIn: 'root' })
export class PluginService {

  subscription: any;
  accessToken = '';
  version;
  pluginUUID;
  FIELD_TYPE = FIELD_TYPE;


  constructor(
              private http: Http
              ,public userService:  UserService
              ,public dialog: MatDialog
              ,public pepperiDataConverter: PepperiDataConverterService
            //   ,public el: ElementRef
    ) {
  }

  ngOnInit() {
  }

  getAdditionalData(successFunc, errorFunc) {
    // this.userService.httpGetApiCall('/addons/installed_addons/'+ this.pluginUUID, successFunc, errorFunc);
    let additionalData = new AdditionalData();
    let scheduledTypes = new Array<ScheduledType>();

    scheduledTypes.push(new ScheduledType(1, 'Sales Order', 3, 50));
    scheduledTypes.push(new ScheduledType(2, 'Inovice', 6, 150));
    scheduledTypes.push(new ScheduledType(3, 'Return', 12, 500));
    scheduledTypes.push(new ScheduledType(3, 'Delivery', 24, 1500));
    scheduledTypes.push(new ScheduledType(3, 'Activity', 12, 500));
    scheduledTypes.push(new ScheduledType(3, 'Photo', 36, 200));
    scheduledTypes.push(new ScheduledType(3, 'My Order', 20, 500));
    additionalData.ScheduledTypes = scheduledTypes;
    successFunc(additionalData);

  }


  updateAdditionalData(additionalData: any, successFunc, errorFunc = null) {
    let body = ({
      "Addon": {"UUID": this.pluginUUID},
      "AdditionalData": JSON.stringify(additionalData)
    });
    this.userService.httpPostApiCall('/addons/installed_addons', body, successFunc, errorFunc);
  }

  updateSystemData(body: any, successFunc, errorFunc = null) {
    this.userService.httpPostApiCall('/addons/installed_addons', body, successFunc, errorFunc);
  }

  openDialog(title = 'Modal Test', content = AddTypeDialogComponent, buttons,
        input , callbackFunc, panelClass = 'pepperi-modalbox'): void {
        const self = this;
        const dialogConfig = new MatDialogConfig();
        const data = new DialogModel(title, content, DialogDataType.Component, [], input);
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = false
        dialogConfig.data = data;
        dialogConfig.panelClass = 'pepperi-permissions-dialog'
        const dialogRef = this.dialog.open(content, dialogConfig);
        dialogRef.afterClosed().subscribe(res => {
                 callbackFunc(res);
        });
  }

    getActivityTypes(successFunc = null, errorFunc = null){
        this.userService.httpGetApiCall('/meta_data/activities/types', successFunc, errorFunc);
    }


}




