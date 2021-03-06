import jwt from 'jwt-decode';
import { CodeJob, PapiClient, AuditLog } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

//@ts-ignore
import { UserService } from 'pepperi-user-service';
//@ts-ignore
import {AddonService} from 'pepperi-addon-service';
//@ts-ignore
import {PepperiDataConverterService} from 'pepperi-data-converter';

import { MatDialogConfig, MatDialog } from '@angular/material';
import {AdditionalData, KeyValuePair } from './plugin.model';
// @ts-ignore
import { DialogDataType, DialogData } from 'pepperi-dialog';
import {DialogModel} from './plugin.model';

@Injectable({ providedIn: 'root' })
export class PluginService {

  subscription: any;
  accessToken = '';
  parsedToken: any
  papiBaseURL = ''
  version;
  pluginUUID;

  get papiClient(): PapiClient {
    return new PapiClient({
        baseURL: this.papiBaseURL,
        token: this.addonService.getUserToken(),
        addonUUID: this.pluginUUID,
        suppressLogging:true
    })
}

  constructor(
              private http: Http
              ,public addonService:  AddonService
              ,public userService: UserService
              ,public dialog: MatDialog
              ,public pepperiDataConverter: PepperiDataConverterService
    ) {
      const accessToken = this.addonService.getUserToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"]
  }

  ngOnInit() {
  }

  async getAdditionalData(): Promise<AdditionalData> {
    const installedAddon = await this.papiClient.addons.installedAddons.addonUUID(this.pluginUUID).get();
    const additionalData: AdditionalData = JSON.parse(installedAddon.AdditionalData);
    if(typeof additionalData.ScheduledTypes == 'undefined') {
        additionalData.ScheduledTypes = [];
        additionalData.ScheduledTypes_Draft = [];
    }
    if(typeof additionalData.DefaultNumofMonths_Draft == 'undefined') {
        additionalData.DefaultNumofMonths_Draft = 24;
    }
    return additionalData;
  }


  async updateAdditionalData(additionalData: AdditionalData) {
      // Before updating the data, get current data in order not to override latest values
      const currentData = await this.getAdditionalData();
      currentData.DefaultNumofMonths = additionalData.DefaultNumofMonths;
      currentData.DefaultNumofMonths_Draft = additionalData.DefaultNumofMonths_Draft;
      currentData.ScheduledTypes = [...additionalData.ScheduledTypes];
      currentData.ScheduledTypes_Draft = [...additionalData.ScheduledTypes_Draft];
    await this.papiClient.addons.installedAddons.upsert({
        Addon: {UUID: this.pluginUUID},
        AdditionalData: JSON.stringify(currentData)
    })
  }

  updateSystemData(body: any, successFunc, errorFunc = null) {
    this.addonService.httpPostApiCall('/addons/installed_addons', body, successFunc, errorFunc);
  }

   openDialog(title = 'Modal Test', content, buttons,
         input , callbackFunc, panelClass = 'pepperi-modalbox'): void {
        const self = this;
        const dialogConfig = new MatDialogConfig();
        const data = new DialogModel(title, content, DialogDataType.Component, [], input);
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = false
        dialogConfig.data = data;
        dialogConfig.panelClass = 'pepperi-standalone';
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

    async getReportToken(){
        const token = await this.papiClient.addons.api.uuid(this.pluginUUID).async().file('api').func('get_archive_report').post({retry:25});
        return token ? token.ExecutionUUID : '';
    }

    async getExecutionLog(executionUUID): Promise<AuditLog> {
        return await this.papiClient.auditLogs.uuid(executionUUID).get();
    }

    async apiCall(method: string, url: string, body: any = undefined ) {
        
        const options: any = {
            method: method,
        };

        if(body) {
            options.body = JSON.stringify(body);
        }

        const res = await fetch(url, options);


        if (!res.ok) {
            // try parsing error as json
            let error = '';
            try {
                error = JSON.stringify(await res.json());
            } catch {}

            throw new Error(`${url} failed with status: ${res.status} - ${res.statusText} error: ${error}`);
        }

        return res;
    }
}
