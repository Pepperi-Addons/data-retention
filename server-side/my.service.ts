import { AdditionalData } from './../client-side/src/app/plugin.model';
import { PapiClient, InstalledAddon, Addon, AddonVersion, GeneralActivity, Transaction, Account } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import config from './../addon.config.json'

export class MyService {

    papiClient: PapiClient
    uuid = '';

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken
        });
        this.uuid = client.AddonUUID;
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
        let archiveData = (await this.getAdditionalData()).ScheduledTypes;
        for await (let account of this.papiClient.accounts.iter({fields:['InternalID']})){
            results.push(callbackFunc(this, account.InternalID, archiveData));
        }
        let retVal = (await Promise.all(results)).flat(2);
        //console.log("all accounts:", retVal);
        return retVal;
    }

    async getActivitiesForAccount(accountID:number) {
        let retVal =  await this.papiClient.allActivities.iter({
            fields:['InternalID','ActivityTypeID','Type','ActionDateTime'], 
            page:1, 
            page_size:-1, 
            where:"Account.InternalID=" + accountID + " AND ActionDateTime is not null",
            orderBy:"ActionDateTime desc",
            include_deleted:false}).toArray();
        
        console.log("activities for account ", accountID, " are: ", retVal);
        return retVal;
    }

    async getAdditionalData(): Promise<AdditionalData> {
        let addon:InstalledAddon = await this.papiClient.addons.installedAddons.addonUUID('8c9a5568-f35a-407d-856a-32d25ace2859').get();
        let retVal = {
            ScheduledTypes: []
        };
        if(addon?.AdditionalData) {
            retVal = JSON.parse(addon.AdditionalData);
        }
        else {
            retVal = JSON.parse('{"ScheduledTypes":[{"ActivityType":{"Key":15210,"Value":"Event"},"NumOfMonths":3,"MinItems":5},{"ActivityType":{"Key":15212,"Value":"Messe"},"NumOfMonths":12,"MinItems":2},{"ActivityType":{"Key":15210,"Value":"Besuch"},"NumOfMonths":12,"MinItems":2},{"ActivityType":{"Key":15512,"Value":"Katalog"},"NumOfMonths":8,"MinItems":4},{"ActivityType":{"Key":15515,"Value":"OrderTest"},"NumOfMonths":2,"MinItems":7}]}')
        }

        return retVal;
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