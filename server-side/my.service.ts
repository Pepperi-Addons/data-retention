import { AdditionalData } from './../client-side/src/app/plugin.model';
import { PapiClient, InstalledAddon, MaintenanceJobResult } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import config from './../addon.config.json'

export class MyService {

    papiClient: PapiClient
    addonUUID = '';

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken
        });
        this.addonUUID = client.AddonUUID;
    }

    doSomething() {
        console.log("doesn't really do anything....");
    }

    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }

    async prepareReport(callbackFunc, archiveData, defaultNumOfMonths): Promise<ReportTuple[]> {
        let results: Promise<ReportTuple[]>[] = [];
        let i = 0;
        for await (let account of this.papiClient.accounts.iter({fields:['InternalID'], page_size:1000, include_deleted:true})){
            if(i++ % 10 == 0) {
                results.push(await callbackFunc(this, account.InternalID, archiveData, defaultNumOfMonths));
            }
            else {
                results.push(callbackFunc(this, account.InternalID, archiveData, defaultNumOfMonths));
            }
        }
        let retVal = (await Promise.all(results));
        //console.log("all accounts:", retVal);
        return retVal.flat();
    }

    async getActivitiesForAccount(accountID:number) {
        let retVal =  await this.papiClient.allActivities.iter({
            fields:['InternalID','ActivityTypeID','Type','ActionDateTime', 'ModificationDateTime'], 
            page:1, 
            page_size:-1, 
            where:"Account.InternalID=" + accountID,
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

    async archiveData(data: ReportTuple[]): Promise<MaintenanceJobResult[]> {
        const maintenanceJobs: Promise<MaintenanceJobResult>[] = [];
        data.forEach((row) => {
            if(row.Activities.length > 0) {
                const ids = row.Activities.join(',');
                maintenanceJobs.push(this.papiClient.maintenance.type('all_activities').archive({where:`InternalID in (${ids})`}));
            }
        })
        return await (Promise.all(maintenanceJobs));
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