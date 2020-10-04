import { AdditionalData } from './../client-side/src/app/plugin.model';
import { PapiClient, InstalledAddon, ExportApiResponse, ArchiveBody } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import fetch from 'node-fetch';
import { PageSize, MaxArchiveItems } from './api';
import chunk from 'lodash.chunk';
import { resolve } from 'dns';
import { getTokenSourceMapRange, createLabel } from 'typescript';
import { createReadStream } from 'fs';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process';

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
            accountIDs = (await this.papiClient.accounts.find({fields:['InternalID'], page_size:1000, include_deleted:true, page:  currentExecutionData.PageIndex++})).map(item => item.InternalID ? item.InternalID : -1);
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
        let retVal =  await this.papiClient.allActivities.find({
            fields:['InternalID','ActivityTypeID','Type','ActionDateTime', 'ModificationDateTime'], 
            page:1, 
            page_size:-1, 
            where:`Account.InternalID in (${accounts}) and ActivityTypeID is not null And Archive=0`,
            orderBy:"ActionDateTime desc",
            include_deleted:false});
        return retVal;
    }

    async getAdditionalData(): Promise<AdditionalData> {
        let addon:InstalledAddon = await this.papiClient.addons.installedAddons.addonUUID(this.addonUUID).get();
        let retVal: AdditionalData = {
            ScheduledTypes: [],
            ScheduledTypes_Draft: [],
            DefaultNumofMonths:24,
            DefaultNumofMonths_Draft:24,
            NumOfDaysForHidden:1825
        };
        if(addon?.AdditionalData) {
            retVal = JSON.parse(addon.AdditionalData);
        }
        if(typeof retVal.ScheduledTypes == 'undefined' || typeof retVal.ScheduledTypes_Draft == 'undefined') {
            retVal.ScheduledTypes = [];
            retVal.ScheduledTypes_Draft = [];
        }
        retVal.DefaultNumofMonths = retVal.DefaultNumofMonths || 24;
        retVal.DefaultNumofMonths_Draft = retVal.DefaultNumofMonths_Draft || 24;

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
        let totalArchiveCount = 0;
        maintenanceJobs = data.filter(item => item.ArchiveCount > 0).map((row):Promise<ArchiveReport> => {
            return new Promise((resolve,reject) => {
                this.getAtdType(row.ActivityType.Key).then((atdType) => {
                    console.debug("activity Type is:", row.ActivityType.Key, "\ntype got from meta data is:", atdType);
                    const remainingItems = MaxArchiveItems - totalArchiveCount;
                    if (remainingItems > 0 && remainingItems < row.ArchiveCount) {
                        row.ArchiveCount = remainingItems;
                        row.Activities = row.Activities.slice(0, remainingItems);
                    }
                    if(remainingItems > 0) {
                        totalArchiveCount += row.ArchiveCount;
                        this.getArchiveJobsInfo(atdType, row.Activities).then((jobsResults) => {
                            resolve({
                                ActivityType: row.ActivityType.Value,
                                ArchiveCount: row.ArchiveCount,
                                ArchiveJobResult: jobsResults
                            })
                        }, (reason)=>{
                            reject(reason);
                        });
                    }
                    else {
                        resolve ({
                            ActivityType: row.ActivityType.Value,
                            ArchiveCount: 0,
                            ArchiveJobResult: []
                        })
                    }
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

    async getArchiveJobsInfo(atdType: string, activitiesIds: number[]): Promise<ExportApiResponse[]> {
        let jobsResults: Promise<ExportApiResponse>[] = []
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

    async uploadArchivingReportToS3(url: string, report: ArchiveReport[]): Promise<any> {
        return this.apiCall('PUT', url, report)
            .then((res) => res.text());
    }

    async getArchivingReportFromS3(url: string): Promise<ArchiveReport[]> {
        return this.apiCall('GET', url)
            .then((res) => res.text())
            .then((res) => (res ? JSON.parse(res) : ''));
    }

    async getExportFile(url: string): Promise<ExportDataFile> {
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

    async archiveHiddenActivities(type: 'Transaction' | 'GeneralActivity', modificationDate: string, actionDate: string): Promise<ArchiveReport> {
        let activitiesBody = {
            fields:['InternalID'],
            include_deleted:true,
            where: 'Hidden=1 And Archive=0 And ModificationDateTime <= \'' + modificationDate + '\' And ActionDateTime <= \'' + actionDate + '\''
        }
        const apiResponse = type === 'Transaction' ? await this.papiClient.transactions.export(activitiesBody) : await this.papiClient.activities.export(activitiesBody);
        console.log(`archive hidden ${type}, where clause is: ${activitiesBody.where} \n export job_id is: ${apiResponse.JobID}`);

        return new Promise((resolve,reject) => {
            const interval = setInterval(async () => {
                const jobStatus = await this.papiClient.get(apiResponse.URI);
                console.debug(`response got from job_info ${JSON.stringify(jobStatus)}`)
                if(jobStatus.Status === 'Succeeded') {
                    clearInterval(interval);
                    if(jobStatus.RecordsCount > 0) {
                        const jobResponse = await this.getExportFile(jobStatus.GetDataURL);
                        let items: number[] = jobResponse.Lines.map(arr => {
                            return arr.length > 0 ? arr[0] : -1;
                        })
                        items = items.length > MaxArchiveItems ? items.slice(0, MaxArchiveItems) : items;
                        const archiveJobs = await this.getArchiveJobsInfo(type, items);
                        resolve({
                            ActivityType: type,
                            ArchiveCount: items.length,
                            ArchiveJobResult: archiveJobs,
                            TotalItems: jobStatus.RecordsCount,
                        })
                        console.debug('data URL is ', jobStatus.GetDataURL);
                    }
                    else {
                        resolve({
                            ActivityType: type,
                            ArchiveCount: 0,
                            ArchiveJobResult: [],
                        })
                    }
                }
                else if (jobStatus.Status === 'Failed') {
                    clearInterval(interval);
                    reject({
                        message: `export ${type} has failed with error: ${jobStatus.ErrorMessage}`
                    });
                }
            }, 10000)
        });
    }

    getReturnObjectFromAudit(auditLogUUID: string): Promise<any> {
        return new Promise<any>((resolve) => {
            let numOfTries = 1;
            const interval = setInterval(async () => {
                console.debug(`getting result object from audit log: ${auditLogUUID}`);
                const logRes = await this.papiClient.auditLogs.uuid(auditLogUUID).get();
                if (logRes && logRes.Status && logRes.Status.Name !== 'InProgress' && logRes.Status.Name !== 'InRetry') {
                    clearInterval(interval);
                    const resultObj = JSON.parse(logRes.AuditInfo.ResultObject);
                    console.debug(`result got from audit log: ${JSON.stringify(logRes)}. `);
                    resolve(resultObj);
                }
                else if(++numOfTries > 16) {
                    clearInterval(interval);
                    resolve(undefined);
                }
            }, 30000);
        });
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
    ArchiveJobResult: ExportApiResponse[];
    TotalItems?: number;
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
    ArchiveReportURL:{
        UploadURL: string;
        DownloadURL: string;
    };
    ArchivingReport: ArchiveReport[];
    ArchiveResultObject: ArchiveReturnObj[];
    ActivityType: 'Transaction' | 'GeneralActivity';
}

export interface DataRetentionData {
    Phase: string;
    ExecutionID: string;
    PhaseResult?: [{
        Name: string;
        ResultObj: any;
        AuditUUID: string;
    }]
}

export interface ArchiveHiddenReturnObj {
    Report:ArchiveReport[];
    Finished: boolean;
    PageIndex: number;
}

export interface ExportDataFile {
    SubType: string;
    Headers: string[];
    Lines: any[];
    NumberOfResults: number;
}