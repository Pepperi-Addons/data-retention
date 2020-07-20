import jwt from 'jwt-decode';
import { CodeJob, PapiClient } from '@pepperi-addons/papi-sdk';
import { AddTypeDialogComponent } from './dialogs/add-type-dialog/add-type-dialog.component';
import { Injectable, ElementRef } from '@angular/core';
import { Http, RequestOptions, Headers } from '@angular/http';

//@ts-ignore
import { UserService } from 'pepperi-user-service';
//@ts-ignore
import {AddonService} from 'pepperi-addon-service';
//@ts-ignore
import { PepperiRowData, PepperiFieldData, FIELD_TYPE } from 'pepperi-main-service';
//@ts-ignore
import {PepperiDataConverterService} from 'pepperi-data-converter';

import { MatDialogConfig, MatDialog } from '@angular/material';
import {AdditionalData, ScheduledType, KeyValuePair } from './plugin.model';
// @ts-ignore
import { ActionButton, DialogDataType, DialogData } from 'pepperi-dialog';
import {DialogModel} from './plugin.model';
import { callbackify } from 'util';
import { type } from 'os';
// import {EnvVariables} from 'pepperi-environment-variables';

@Injectable({ providedIn: 'root' })
export class PluginService {
  subscription: any;
  accessToken = '';
  parsedToken: any
  papiBaseURL = ''
  version;
  pluginUUID;
  FIELD_TYPE = FIELD_TYPE;

  get papiClient(): PapiClient {
    return new PapiClient({
        baseURL: this.papiBaseURL,
        token: this.addonService.getUserToken(),
        addonUUID: this.pluginUUID
    })
}

  constructor(
              private http: Http
              ,public addonService:  AddonService
              ,public userService: UserService
              ,public dialog: MatDialog
              ,public pepperiDataConverter: PepperiDataConverterService
            //   ,public el: ElementRef
    ) {
      const accessToken = this.addonService.getUserToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"]
  }

  ngOnInit() {
  }

  getAdditionalData() {
    // let additionalData = new AdditionalData();
    // let scheduledTypes = new Array<ScheduledType>();

    // scheduledTypes.push(new ScheduledType(36373, 'Visit', 3, 50));
    // scheduledTypes.push(new ScheduledType(264076, 'Store Score', 6, 150));
    // scheduledTypes.push(new ScheduledType(139672, 'go to store', 3, 500));
    // scheduledTypes.push(new ScheduledType(36372, 'Sales Order', 2, 1500));
    // scheduledTypes.push(new ScheduledType(144157, 'Buyer', 8, 500));
    // scheduledTypes.push(new ScheduledType(256288, 'matrix eyewear', 6, 200));

    // console.log(JSON.stringify(scheduledTypes));
    return new Promise<AdditionalData>((resolve,reject) => this.addonService.httpGetApiCall('/addons/installed_addons/'+ this.pluginUUID, (res) => {
      if(res && res.AdditionalData) {
        resolve(JSON.parse(res.AdditionalData));
        //Promise.resolve(JSON.parse(res.AdditionalData));
      }
      else {
        reject(new Error('Could not get additional data!'));
      }
    }, (error) => {
      Promise.reject(error);
    }));
    
    
    // additionalData.ScheduledTypes = scheduledTypes;

  }


  updateAdditionalData(additionalData: any, successFunc, errorFunc = null) {
    let body = ({
      "Addon": {"UUID": this.pluginUUID},
      "AdditionalData": JSON.stringify(additionalData)
    });
    this.addonService.httpPostApiCall('/addons/installed_addons', body, successFunc, errorFunc);
  }

  updateSystemData(body: any, successFunc, errorFunc = null) {
    this.addonService.httpPostApiCall('/addons/installed_addons', body, successFunc, errorFunc);
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

    getTypes(successFunc = null, errorFunc = null){
      let types:KeyValuePair<string>[] = [];
      this.addonService.httpGetApiCall('/meta_data/activities/types', (activityTypes) => {
        if (activityTypes) {
          activityTypes.forEach(type =>
              types.push({ Key: type.TypeID, Value: type.ExternalID })
          );
        }
        this.addonService.httpGetApiCall('/meta_data/transactions/types', (transactionTypes) => {
          if (transactionTypes) {
            transactionTypes.forEach(type =>
                types.push({ Key: type.TypeID, Value: type.ExternalID })
            );
          }
          successFunc(types);
        }, errorFunc);
      }, errorFunc);
      
    }

    getCodeJob(codeJobUUID: string) {
      return new Promise<CodeJob>((resolve,reject) => this.addonService.httpGetApiCall('/code_jobs/' + codeJobUUID, (codejob:CodeJob) => {
        if(codejob) {
          resolve(codejob);
        }
        else {
          reject('could not get code job with id: ' + codeJobUUID);
        }
      }));
    }

    openTextDialog(title, content, buttons ) {
        const data = new DialogData(title, content, DialogDataType.Text, buttons);
        this.userService.openDialog(data);
    }

}




