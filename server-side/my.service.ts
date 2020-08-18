import { AdditionalData } from './../client-side/src/app/plugin.model';
import { PapiClient, InstalledAddon, MaintenanceJobResult, ArchiveBody, TempUrlResponse } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import config from './../addon.config.json'
import { isExportDeclaration } from 'typescript';
import fetch from 'node-fetch';
import { PageSize } from './api';
import chunk from 'lodash.chunk';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class MyService {

    papiClient: PapiClient
    addonUUID = '';

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            suppressLogging:true
        });
        this.addonUUID = client.AddonUUID;
    }

    doSomething() {
        console.log("doesn't really do anything....");
    }

    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }

    async prepareReport(callbackFunc, archiveData, defaultNumOfMonths, currentExecutionData: ExecutionData): Promise<{report: ReportTuple[], isDone: boolean, pageIndex:number}> {
        let callbackResults: Promise<ReportTuple[]>[] = [];
        let accountIDs:number[] = [];
        let retVal: ReportTuple[][] = currentExecutionData.PreviousRunReport.length > 0 ? [currentExecutionData.PreviousRunReport] : [];
        let hasAccounts = true;
        do {
            console.log("processing accounts. page number is:", currentExecutionData.PageIndex);
            accountIDs = (await this.papiClient.accounts.find({fields:['InternalID'], page_size:100, include_deleted:true, page:  currentExecutionData.PageIndex++})).map(item => item.InternalID ? item.InternalID : -1);
            hasAccounts = accountIDs.length > 0;
            if(hasAccounts) {
                callbackResults.push(callbackFunc(this, accountIDs, archiveData, defaultNumOfMonths));
            }
            if(currentExecutionData.PageIndex % 10 == 1) {
                console.log("waiting for calls to finish");
                retVal.push(await (await Promise.all(callbackResults)).flat());
                callbackResults = [];
            }

        } while (hasAccounts && currentExecutionData.PageIndex % 50 != 1)
        retVal.push(await (await Promise.all(callbackResults)).flat());
        //retVal.push(currentExecutionData.PreviousRunReport); // Add the previos data run to aggregate report
        return {report: retVal.flat(), isDone: hasAccounts == false, pageIndex: currentExecutionData.PageIndex};
    }

    async getActivitiesForAccount(accountIDs: number[]) {
        let accounts = accountIDs.join(',');
        let retVal =  await this.papiClient.allActivities.iter({
            fields:['InternalID','ActivityTypeID','Type','ActionDateTime', 'ModificationDateTime'], 
            page:1, 
            page_size:-1, 
            where:`Account.InternalID in (${accounts})`,
            orderBy:"ActionDateTime desc",
            include_deleted:true}).toArray();
        
        //console.log("activities for account ", accountID, " are: ", retVal);
        return retVal;
    }

    async getAdditionalData(): Promise<AdditionalData> {
        let addon:InstalledAddon = await this.papiClient.addons.installedAddons.addonUUID(this.addonUUID).get();
        let retVal = {
            ScheduledTypes: [],
            ScheduledTypes_Draft: [],
            DefaultNumofMonths:24,
            DefaultNumofMonths_Draft:24
        };
        if(addon?.AdditionalData) {
            retVal = JSON.parse(addon.AdditionalData);
        }
        if(typeof retVal.ScheduledTypes == 'undefined' || typeof retVal.ScheduledTypes_Draft == 'undefined') {
            retVal.ScheduledTypes = [];
            retVal.ScheduledTypes_Draft = [];
        }

        return retVal;
    }

    async archiveData(data: ReportTuple[]): Promise<ArchiveReport[]> {
        let maintenanceJobs: Promise<ArchiveReport>[] = [];
        maintenanceJobs = data.filter(item => item.ArchiveCount > 0).map((row):Promise<ArchiveReport> => {
            return new Promise((resolve,reject) => {
                this.getArchiveJobsInfo(row.ActivityType.Key, row.Activities).then((jobsResults) => {
                    resolve({
                        ActivityType: row.ActivityType.Value,
                        ArchiveCount: row.ArchiveCount,
                        ArchiveJobResult: jobsResults
                    })
                }, (reason)=>{
                    reject(reason);
                });
            });
        })
        return await (Promise.all(maintenanceJobs));
    }

    async getAtdType(activityType:number):Promise<string> {
        try {
            await this.papiClient.metaData.type('activities').types.subtype(activityType.toString());
            return 'activities';
        }
        catch(error) {
            if('message' in error &&
            error.message.contains("Activity Type Definition ID: " + activityType + " doesn't exist.") ) {
                return 'transactions';
            }
            else {
                throw("could not determine type for activity type definition with ID: " + activityType);
            }
        }
    }

    async getArchiveJobsInfo(activityType: number, activitiesIds: number[]): Promise<MaintenanceJobResult[]> {
        const atdType = await this.getAtdType(activityType);
        let jobsResults: Promise<MaintenanceJobResult>[] = []
        const chunks: number[][] = chunk(activitiesIds, PageSize);
        // while(activitiesIds.length > 0) {
        //     const numofItems = activitiesIds.length > PageSize ? PageSize : activitiesIds.length;
        //     const ids = activitiesIds.splice(0, numofItems - 1);
        chunks.forEach(items => {
            const body: ArchiveBody = atdType == 'transactions' ? { transactions: items } : { activities: items };
            jobsResults.push(this.papiClient.maintenance.archive(body));
        })
        // }
        return await (Promise.all(jobsResults));
    }

    async uploadReportToS3(url: string, report: ReportTuple[]): Promise<any> {
        return this.apiCall('PUT', url, report)
            .then((res) => res.text());
    }

    async getReportFromS3(url: string): Promise<ReportTuple[]> {
        return this.apiCall('GET', url)
            .then((res) => res.text())
            .then((res) => (res ? JSON.parse(res) : ''));
    }

    async apiCall(method: HttpMethod, url: string, body: any = undefined ) {
        
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

export interface ReportTuple {
    ActivityType: KeyValuePair<string>;
    BeforeCount: number;
    AfterCount: number;
    ArchiveCount: number;
    Activities: number[];
}
export interface KeyValuePair<T> {
    Key: number;
    Value: T;
}
export interface ScheduledType {
    ActivityType: KeyValuePair<string>;
    NumOfMonths: number;
    MinItems: number;
}

export interface ArchiveReport {
    ActivityType: string;
    ArchiveCount: number;
    ArchiveJobResult: MaintenanceJobResult[];
}

export interface ArchiveJobResult {
    URI?: string;
    Status?: string;
    RecordsAffected?: number;
    ErrorMessage?: string;
}

export interface ArchiveReturnObj {
    ActivityType: string;
    Jobs: ArchiveJobResult[];
    Finished: boolean;
}

export interface ExecutionData {
    PageIndex: number;
    PreviousRunReport:ReportTuple[];
    ArchiveReportURL:TempUrlResponse;
    ArchivingReport: ArchiveReport[];
    ArchiveResultObject: ArchiveReturnObj[];
}