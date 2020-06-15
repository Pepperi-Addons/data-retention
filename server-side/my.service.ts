import { PapiClient, InstalledAddon, Addon, AddonVersion, GeneralActivity, Transaction, Account } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';

class MyService {

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

    async getAccounts(callbackFunc): Promise<any> {
        //return this.papiClient.get("/accounts?include_count=1&include_hidden=0&page=1&page_size=-1");
        //return this.papiClient.accounts.find({fields:['InternalID'], page:1, page_size:-1});
        let results: Promise<(GeneralActivity | Transaction)[]>[] = [];
        for await (let account of this.papiClient.accounts.iter({fields:['InternalID']})){
            results.push(callbackFunc(this, account.InternalID));
        }
        return (await Promise.all(results)).flat();


    }

    getActivitiesForAccount(accountID?:number) {
        //return this.papiClient.get("/all_activities?include_count=1&include_hidden=0&page=1&page_size=-1&where=Account.InternalID=" + accountID);
        return this.papiClient.allActivities.find({
            fields:['InternalID','ActivityTypeID','Title','ActionDateTime'], 
            page:1, 
            page_size:-1, 
            where:"Account.InternalID=" + accountID});
    }
}

export default MyService;