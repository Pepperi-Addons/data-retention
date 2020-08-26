import { AdditionalData } from './../client-side/src/app/plugin.model';
import { PapiClient, InstalledAddon, MaintenanceJobResult, ArchiveBody, TempUrlResponse } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
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
            console.debug("processing accounts. page number is:", currentExecutionData.PageIndex);
            accountIDs = (await this.papiClient.accounts.find({fields:['InternalID'], page_size:100, include_deleted:true, page:  currentExecutionData.PageIndex++})).map(item => item.InternalID ? item.InternalID : -1);
            hasAccounts = accountIDs.length > 0;
            if(hasAccounts) {
                callbackResults.push(callbackFunc(this, accountIDs, archiveData, defaultNumOfMonths));
            }
            if(currentExecutionData.PageIndex % 10 == 1) {
                console.debug("waiting for calls to finish");
                retVal.push(await (await Promise.all(callbackResults)).flat());
                callbackResults = [];
            }

        } while (hasAccounts && currentExecutionData.PageIndex % 50 != 1)
        retVal.push(await (await Promise.all(callbackResults)).flat());
        return {report: retVal.flat(), isDone: hasAccounts == false, pageIndex: currentExecutionData.PageIndex};
    }

    async getActivitiesForAccount(accountIDs: number[]) {
        let accounts = accountIDs.join(',');
        let retVal =  await this.papiClient.allActivities.iter({
            fields:['InternalID','ActivityTypeID','Type','ActionDateTime', 'ModificationDateTime'], 
            page:1, 
            page_size:-1, 
            where:`Account.InternalID in (${accounts}) and ActivityTypeID is not null`,
            orderBy:"ActionDateTime desc",
            include_deleted:false}).toArray();
        return retVal;
    }

    async getAdditionalData(): Promise<AdditionalData> {
        let addon:InstalledAddon = await this.papiClient.addons.installedAddons.addonUUID(this.addonUUID).get();
        let retVal: AdditionalData = {
            ScheduledTypes: [],
            ScheduledTypes_Draft: [],
            DefaultNumofMonths:24,
            DefaultNumofMonths_Draft:24,
            NumOfDaysForHidden:90
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

    async updateAdditionalData(additionalData: any) {
        await this.papiClient.addons.installedAddons.upsert({
            Addon: {UUID: this.addonUUID},
            AdditionalData: JSON.stringify(additionalData)
        })
      }   

    async archiveData(data: ReportTuple[]): Promise<ArchiveReport[]> {
        let maintenanceJobs: Promise<ArchiveReport>[] = [];
        maintenanceJobs = data.filter(item => item.ArchiveCount > 0).map((row):Promise<ArchiveReport> => {
            return new Promise((resolve,reject) => {
                this.getAtdType(row.ActivityType.Key).then((atdType) => {
                    console.debug("activity Type is:", row.ActivityType.Key, "\ntype got from meta data is:", atdType);
                    this.getArchiveJobsInfo(atdType, row.Activities).then((jobsResults) => {
                        resolve({
                            ActivityType: row.ActivityType.Value,
                            ArchiveCount: row.ArchiveCount,
                            ArchiveJobResult: jobsResults
                        })
                    }, (reason)=>{
                        reject(reason);
                    });
                });
            });
        })
        return await (Promise.all(maintenanceJobs));
    }

    async getAtdType(activityType:number):Promise<string> {
        try {
            const activity = await this.papiClient.metaData.type('activities').types.subtype(activityType.toString()).get();
            if(activity) {
                return 'GeneralActivity';
            }
            else {
                return 'Transaction';
            }
        }
        catch(error) {
            try {
                const transaction = await this.papiClient.metaData.type('transactions').types.subtype(activityType.toString()).get(); 
                if(transaction) {
                    return 'Transaction';
                }
                else {
                    return 'GeneralActivity';
                }
            }
            catch(err) {
                console.error("Could not determine type for ATD with number", activityType, 'assuming activity');
                throw(err);
            }
        }
    }

    async getArchiveJobsInfo(atdType: string, activitiesIds: number[]): Promise<MaintenanceJobResult[]> {
        let jobsResults: Promise<MaintenanceJobResult>[] = []
        const chunks: number[][] = chunk(activitiesIds, PageSize);
        chunks.forEach(items => {
            const body: ArchiveBody = atdType == 'Transaction' ? { transactions: items } : { activities: items };
            jobsResults.push(this.papiClient.maintenance.archive(body));
        })
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

    async archiveHiddenActivities(type: 'Transaction' | 'GeneralActivity', tresholdDate: string ): Promise<{Jobs:MaintenanceJobResult[], Count:number}> {
        let retVal: MaintenanceJobResult[][] = [];
        let itemsCount: number = 0;
        let items: number[] = [];
        let aggregated: number[] = [];
        let activitiesBody = {
            fields:['InternalID'], 
            page_size:1000, 
            include_deleted:true, 
            page: 1,
            where: 'Hidden=1 And ModificationDateTime <= \'' + tresholdDate + '\''
        }
        
        do {
            if(type == 'Transaction') { 
                items = (await this.papiClient.transactions.find(activitiesBody)).map(item => item.InternalID ? item.InternalID : -1);
            }
            else {
                items = (await this.papiClient.activities.find(activitiesBody)).map(item => item.InternalID ? item.InternalID : -1);
            }
            if(items.length > 0) {
                activitiesBody.page++;
                itemsCount += items.length;
                aggregated = aggregated.concat(items);
            }
            if(activitiesBody.page % 500 == 1) { // for performance reasons we limit number of activities to 500K activities
                retVal.push(await this.getArchiveJobsInfo(type, aggregated));
                aggregated = [];
            }
            
        } while (items.length > 0)

        if(aggregated.length > 0) {
            retVal.push(await this.getArchiveJobsInfo(type, aggregated));
        }

        return {Jobs: retVal.flat(), Count: itemsCount};
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
    Finished?: boolean;
}

export interface ExecutionData {
    PageIndex: number;
    PreviousRunReport:ReportTuple[];
    ArchiveReportURL:TempUrlResponse;
    ArchivingReport: ArchiveReport[];
    ArchiveResultObject: ArchiveReturnObj[];
}