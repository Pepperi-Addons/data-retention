import jwt from 'jwt-decode';
import { CodeJob, PapiClient, AuditLog } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';

import {PepAddonService, PepHttpService, PepDataConvertorService, PepSessionService} from '@pepperi-addons/ngx-lib';

import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import {AdditionalData, DEFAULT_NUM_OF_MONTHS, KeyValuePair } from './data-retention.model';

import { PepDialogService, PepDialogData, PepDialogActionsType } from '@pepperi-addons/ngx-lib/dialog';

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
              public addonService:  PepAddonService
              ,public session:  PepSessionService
              ,public httpService: PepHttpService
              ,public dialog: MatDialog
              ,public pepperiDataConverter: PepDataConvertorService
              ,public dialogService: PepDialogService
    ) {
      const accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"]
  }

  ngOnInit() {
  }

  async getAdditionalData(): Promise<AdditionalData> {
    let retVal: AdditionalData = {
        ScheduledTypes: [],
        ScheduledTypes_Draft: [],
        DefaultNumofMonths:DEFAULT_NUM_OF_MONTHS,
        DefaultNumofMonths_Draft:DEFAULT_NUM_OF_MONTHS,
        NumOfDaysForHidden:1825,
    };
    const data = await this.papiClient.addons.api.uuid(this.pluginUUID).sync().file('api').func('get_addon_data').get();
    if(data.success) {
        retVal = data.resultObject;
    }

    return retVal;
  }


  async updateAdditionalData(additionalData: AdditionalData) {
      // Before updating the data, get current data in order not to override latest values
      const currentData = await this.getAdditionalData();
      currentData.DefaultNumofMonths = additionalData.DefaultNumofMonths;
      currentData.DefaultNumofMonths_Draft = additionalData.DefaultNumofMonths_Draft;
      currentData.ScheduledTypes = [...additionalData.ScheduledTypes];
      currentData.ScheduledTypes_Draft = [...additionalData.ScheduledTypes_Draft];
    // await this.papiClient.addons.installedAddons.upsert({
    //     Addon: {UUID: this.pluginUUID},
    //     AdditionalData: JSON.stringify(currentData)
    // })
    await this.papiClient.addons.api.uuid(this.pluginUUID).sync().file('api').func('update_addon_data').post(undefined, currentData);
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
