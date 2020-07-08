import { PapiClient, CodeJob } from "@pepperi-addons/papi-sdk";
import { InstalledAddon } from "../client-side/src/app/plugin.model";

exports.install = async (Client, Request) => {
    let success = true;
    let errorMessage = '';
    let resultObject = {};
    const papiClient = new PapiClient({
        baseURL: Client.BaseURL,
        token: Client.OAuthAccessToken,
        addonUUID: Client.AddonUUID
    });
    const apiAddon = await papiClient.addons.installedAddons.addonUUID('00000000-0000-0000-0000-000000000a91').get();
    const apiVersion = Number(apiAddon?.Version?.substr(1, 3));

    if(apiVersion > 218) {
        try {

            const codeJob: CodeJob = await papiClient.codeJobs.upsert({
                CodeJobName: "Data Retention",
                Type: "AddonJob",
                IsScheduled: true,
                CronExpression: getCronExpression(),
                AddonPath: "api",
                FunctionName: "archive",
                AddonUUID: Client.AddonUUID,
                NumberOfTries: 3,
            })

            console.log("result object recieved from Code jobs is: " + JSON.stringify(codeJob));
            let retVal = await updateCodeJobUUID(papiClient, Client.AddonUUID, codeJob.UUID);
            success = retVal.success;
            errorMessage = retVal.errorMessage;

        }
        catch(err) {
            success = false;
            errorMessage = ('message' in err) ? err.message : 'Cannot install addon. Unknown Error Occured';
        }
    }
    else {
        errorMessage = "Cannot install addon. upgrade api version to 219 minimum.";
        success = false;
    }

    return {
        success: success,
        errorMessage: errorMessage,        
        resultObject: resultObject
    }
}

exports.uninstall = async (Client, Request) => {
    const papiClient = new PapiClient({
        baseURL: Client.BaseURL,
        token: Client.OAuthAccessToken
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
    return {success:true,resultObject:{}}
}
exports.downgrade = async (Client, Request) => {
    return {success:true,resultObject:{}}
}

function getCronExpression() {
    let expressions = [
        '0 0 19 ? * FRI *',
        '0 0 20 ? * FRI *',
        '0 0 21 ? * FRI *',
        '0 0 22 ? * FRI *',
        '0 0 23 ? * FRI *',
        '0 0 0 ? * SAT *',
        '0 0 01 ? * SAT *',
        '0 0 02 ? * SAT *',
        '0 0 03 ? * SAT *',
        '0 0 04 ? * SAT *',
        '0 0 05 ? * SAT *',
        '0 0 06 ? * SAT *',
        '0 0 07 ? * SAT *',
        '0 0 08 ? * SAT *',
        '0 0 09 ? * SAT *',
        '0 0 10 ? * SAT *',
        '0 0 11 ? * SAT *',
        '0 0 12 ? * SAT *',
        '0 0 13 ? * SAT *',
        '0 0 14 ? * SAT *',
        '0 0 15 ? * SAT *',
        '0 0 16 ? * SAT *',
        '0 0 17 ? * SAT *',
        '0 0 18 ? * SAT *',
        '0 0 19 ? * SAT *',
        '0 0 20 ? * SAT *',
        '0 0 21 ? * SAT *',
        '0 0 22 ? * SAT *',
        '0 0 23 ? * SAT *',
        '0 0 24 ? * SAT *',
        '0 0 0 ? * SUN *',
        '0 0 01 ? * SUN *',
        '0 0 02 ? * SUN *',
        '0 0 03 ? * SUN *',
        '0 0 04 ? * SUN *',        
    ]

    return expressions[Math.random() * expressions.length];
}

async function updateCodeJobUUID(papiClient, addonUUID, uuid) {
    try {
        let addon: InstalledAddon = await papiClient.addons.installedAddons.addonUUID(addonUUID).get();
        console.log("installed addon object is: " + JSON.stringify(addon));
        if(addon?.AdditionalData) {
            let data = JSON.parse(addon.AdditionalData);
            data.CodeJobUUID = uuid;
            addon.AdditionalData = JSON.stringify(data);
        }
        else {
            console.log("could not recieved addon with ID: " + addonUUID + " exiting...");
            return {
                success: false,
                errorMessage: "Addon does not exists."
            }
        }
        console.log("addon object to post is: " + JSON.stringify(addon));
        await papiClient.addons.installedAddons.upsert(addon);
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

async function getCodeJobUUID(papiClient, addonUUID) {
    let uuid = '';
    let addon = await papiClient.addons.installedAddons.addonUUID(addonUUID).get();
    if(addon?.AdditionalData) {
        uuid = addon.AdditionalData.CodeJobUUID;
    }
    return uuid;
}