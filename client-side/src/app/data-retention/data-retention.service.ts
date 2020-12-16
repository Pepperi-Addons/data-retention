import jwt from 'jwt-decode';
import { CodeJob, PapiClient, AuditLog } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';

import {AddonService, HttpService, DataConvertorService, SessionService} from '@pepperi-addons/ngx-lib';

import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import {AdditionalData, KeyValuePair } from './data-retention.model';

import { DialogService, PepDialogData, PepDialogSizeType, PepDialogActionsType } from '@pepperi-addons/ngx-lib/dialog';
import {DialogModel} from './data-retention.model';

@Injectable({ providedIn: 'root' })
export class DataRetentionService {

  subscription: any;
  accessToken = '';
  parsedToken: any
  papiBaseURL = ''
  version;
  pluginUUID;
  dialogRef;

  get papiClient(): PapiClient {
    return new PapiClient({
        baseURL: this.papiBaseURL,
        token: this.session.getIdpToken(),
        addonUUID: this.pluginUUID,
        suppressLogging:true
    })
}

  constructor(
              public addonService:  AddonService
              ,public session:  SessionService
              ,public httpService: HttpService
              ,public dialog: MatDialog
              ,public pepperiDataConverter: DataConvertorService
              ,public dialogService: DialogService
    ) {
      const accessToken = this.session.getIdpToken();
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
    this.httpService.postPapiApiCall('/addons/installed_addons', body).subscribe(
        (res)=> {
            successFunc(res)
        }, 
        (error) => {
            errorFunc(error)
        }
    );
  }

   openDialog(title = 'Modal Test', content, buttons,
         input , callbackFunc = null): void {
        const dialogConfig = this.dialogService.getDialogConfig({disableClose: true, panelClass:'pepperi-standalone'}, 'inline')
        //const data = new DialogModel(title, content, 'cancel-continue', buttons, input);
        const data = new PepDialogData({title: title, type:'custom', content:content, actionButtons: buttons})
        dialogConfig.data = data;
        
        this.dialogRef = this.dialogService.openDialog(content, input, dialogConfig);
        this.dialogRef.afterClosed().subscribe(res => {
                 callbackFunc(res);
        });
   }

    openTextDialog(title, content, buttons, dialogType: PepDialogActionsType ) {
        const data = new PepDialogData({title: title, content: content, type: dialogType, actionButtons: buttons});
        const config = this.dialogService.getDialogConfig({}, 'inline')
        this.dialogService.openDefaultDialog(data, config);
    }


    getTypes(successFunc = null, errorFunc = null){
      let types:KeyValuePair<string>[] = [];
      this.httpService.getPapiApiCall('/meta_data/activities/types').subscribe(
            (activityTypes) => {
                if (activityTypes) {
                    activityTypes.forEach(type =>
                        types.push({ Key: type.TypeID, Value: type.ExternalID })
                    );
                }
                this.httpService.getPapiApiCall('/meta_data/transactions/types').subscribe(
                    (transactionTypes) => {
                        if (transactionTypes) {
                            transactionTypes.forEach(type =>
                                types.push({ Key: type.TypeID, Value: type.ExternalID })
                            );
                        }
                        successFunc(types);
                    },
                    (error) => {
                        errorFunc(error);
                    }
                )  
            },
            (error) => {
                errorFunc(error);
            }
        );      
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
