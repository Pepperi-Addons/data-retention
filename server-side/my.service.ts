import { AdditionalData } from './../client-side/src/app/plugin.model';
import { PapiClient, InstalledAddon, Addon, AddonVersion, GeneralActivity, Transaction, Account } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';

export class MyService {

    papiClient: PapiClient

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken
        });
    }

    doSomething() {
        console.log("doesn't really do anything....");
    }

    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
        this.papiClient.addons.find()
    }

    async getAccounts(callbackFunc): Promise<ReportTuple[]> {
        let results: Promise<ReportTuple[][]>[] = [];
        for await (let account of this.papiClient.accounts.iter({fields:['InternalID']})){
            results.push(callbackFunc(this, account.InternalID));
        }
        return (await Promise.all(results)).flat(2);
    }

    async getActivitiesForAccount(accountID:number) {
        return await this.papiClient.allActivities.iter({
            fields:['InternalID','ActivityTypeID','Type','ActionDateTime'], 
            page:1, 
            page_size:-1, 
            where:"Account.InternalID=" + accountID + " AND ActionDateTime is not null",
            orderBy:"ActionDateTime desc"}).toArray();
    }

    async getAdditionalData(): Promise<AdditionalData> {
        let addon:InstalledAddon = await this.papiClient.addons.installedAddons.addonUUID('8c9a5568-f35a-407d-856a-32d25ace2859').get();
        let retVal = {
            ScheduledTypes: []
        };
        if(addon.AdditionalData) {
            retVal = JSON.parse(addon.AdditionalData);
        }

        return retVal;
    }
}

export class ReportTuple {
    ActivityType: {Key:number, Value:string};
    BeforeCount: number;
    AfterCount: number;
    ArchiveCount: number;
    Activities: number[];

    constructor(activityTypeID:number, title:string, beforeCount:number, archiveCount:number, activities:number[])
    {
        this.ActivityType = { Key: activityTypeID, Value: title }
        this.BeforeCount = beforeCount;
        this.ArchiveCount = archiveCount;
        this.AfterCount = beforeCount - archiveCount;
        this.Activities = activities;
    }
}
