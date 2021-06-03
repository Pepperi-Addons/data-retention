import { PapiClient, CodeJob, AddonDataScheme } from "@pepperi-addons/papi-sdk";
import { InstalledAddon } from "../client-side/src/app/data-retention/data-retention.model";
//import * as Scheme from './dataScheme.json'
export const scheme: AddonDataScheme = {
    Name: "DataRetention",
    Type: "meta_data",
    Fields: {
        CodeJobUUID: {
            Type: "String"
        },
        DefaultNumberOfMonths: {
            Type: "Integer"
        },
        DefaultNumofMonths_Draft: {
            Type: "Integer"
        },
        LatestReportURL: {
            Type: "String"
        },
        NumOfDaysForHidden: {
            Type: "Integer"
        },
        HiddenTreshold: {
            Type: "Integer"
        }
    }
}
exports.install = async (Client, Request) => {
    let success = true;
    let errorMessage = '';
    const papiClient = new PapiClient({
        baseURL: Client.BaseURL,
        token: Client.OAuthAccessToken,
        addonUUID: Client.AddonUUID,
        addonSecretKey: '8c9a5568-f35a-407d-856a-32d25ace2859'
    });
    try {
        let retVal = await createADALScheme(papiClient);
        if(retVal.success) {
            const codeJob: CodeJob = await papiClient.codeJobs.upsert({
                CodeJobName: "Data Retention",
                Description: "Data Retention",
                Type: "AddonJob",
                IsScheduled: true,
                CronExpression: getCronExpression(),
                AddonPath: "api",
                FunctionName: "run_data_retention",
                AddonUUID: Client.AddonUUID,
                NumberOfTries: 30,
            })

            console.log("result object recieved from Code jobs is: " + JSON.stringify(codeJob));
            retVal = await updateCodeJobUUID(papiClient, Client.AddonUUID, codeJob.UUID);
        }
        success = retVal.success;
        errorMessage = retVal.errorMessage;
    }
    catch(err) {
        success = false;
        errorMessage = ('message' in err) ? err.message : 'Cannot install addon. Unknown Error Occured';
    }

    return {
        success: success,
        errorMessage: errorMessage,        
        resultObject: {}
    }
}

exports.uninstall = async (Client, Request) => {
    const papiClient = new PapiClient({
        baseURL: Client.BaseURL,
        token: Client.OAuthAccessToken,
        addonUUID: Client.AddonUUID
    });
    try {
        let uuid = await getCodeJobUUID(papiClient, Client.AddonUUID);
        if(uuid != '') {
            await papiClient.codeJobs.upsert({
                UUID:uuid,
                CodeJobName: "Data Retention",
                CodeJobIsHidden:true
            });
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
            resultObject: {},
        }
    }
    return {
        success:true,
        errorMessage:'',
        resultObject:{}
    }
}
exports.upgrade = async (Client, Request) => {
    const papiClient = new PapiClient({
        baseURL: Client.BaseURL,
        token: Client.OAuthAccessToken,
        addonUUID: Client.AddonUUID,
        addonSecretKey: Client.AddonSecretKey
    });
    let retVal = {
        success: true,
        errorMessage: ""
    } //await createADALScheme(papiClient);
    if(retVal.success) {
        let uuid = await getCodeJobUUID(papiClient, Client.AddonUUID);
        if(uuid != '') {
            await papiClient.codeJobs.upsert({
                UUID:uuid,
                CodeJobName: "Data Retention",
                NumberOfTries: 30,
                FunctionName: 'run_data_retention'
            });
            retVal.success = true;
            retVal.errorMessage = "";
        }
    }
    return {
        success: retVal.success,
        errorMessage: retVal.errorMessage,
        resultObject: {}
    }
}
exports.downgrade = async (Client, Request) => {
    return {success:true,resultObject:{}}
}

function getCronExpression() {
    let expressions = [
        '0 19 * * FRI',
        '0 20 * * FRI',
        '0 21 * * FRI',
        '0 22 * * FRI',
        '0 23 * * FRI',
        '0 0 * * SAT',
        '0 1 * * SAT',
        '0 2 * * SAT',
        '0 3 * * SAT',
        '0 4 * * SAT',
        '0 5 * * SAT',
        '0 6 * * SAT',
        '0 7 * * SAT',
        '0 8 * * SAT',
        '0 9 * * SAT',
        '0 10 * * SAT',
        '0 11 * * SAT',
        '0 12 * * SAT',
        '0 13 * * SAT',
        '0 14 * * SAT',
        '0 15 * * SAT',
        '0 16 * * SAT',
        '0 17 * * SAT',
        '0 18 * * SAT',
        '0 19 * * SAT',
        '0 20 * * SAT',
        '0 21 * * SAT',
        '0 22 * * SAT',
        '0 23 * * SAT',
        '0 0 * * SUN',
        '0 1 * * SUN',
        '0 2 * * SUN',
        '0 3 * * SUN',
        '0 4 * * SUN',        
    ]
    const index = Math.floor(Math.random() * expressions.length);
    return expressions[index];
}

async function updateCodeJobUUID(papiClient, addonUUID, uuid) {
    try {
        await papiClient.addons.data.uuid(addonUUID).table(scheme.Name).post({
            Key: uuid,
            CodeJobUUID: uuid
        });
        return {
            success:true, 
            errorMessage:""
        };

    }
    catch (err) {
        return {
            success: false,
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
        };
    }
}

async function getCodeJobUUID(papiClient: PapiClient, addonUUID) {
    let uuid = '';
    let data = await papiClient.addons.data.uuid(addonUUID).table(scheme.Name).find();
    
    if(data.length > 0) {
         uuid = data[0].CodeJobUUID;
    }
 
    return uuid;
}

async function createADALScheme(papiClient: PapiClient) {
    try {
        await papiClient.addons.data.schemes.post(scheme);
        return {
            success: true,
            errorMessage: ""
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
        }
    }
}

function getRandomIndex(arrayLength:number): number {
    let index: number = 0;
    Math.floor(Math.random() * (arrayLength + 1))
    return index;
}
