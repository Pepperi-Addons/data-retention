import { PapiClient, CodeJob } from "@pepperi-addons/papi-sdk";
import { InstalledAddon } from "../client-side/src/app/plugin.model";

const minimumAPIVersion: number = 286;
const minimumSchedulerVersion: number[] = [1,0,53];

exports.install = async (Client, Request) => {
    let success = true;
    let errorMessage = '';
    let resultObject = {};
    const papiClient = new PapiClient({
        baseURL: Client.BaseURL,
        token: Client.OAuthAccessToken,
        addonUUID: Client.AddonUUID
    });
    const dependencies = await checkDependencies(papiClient, 'install');
    if(dependencies.depedenciesMet) {
        try {

            const codeJob: CodeJob = await papiClient.codeJobs.upsert({
                CodeJobName: "Data Retention",
                Description: "Data Retention",
                Type: "AddonJob",
                IsScheduled: true,
                CronExpression: getCronExpression(),
                AddonPath: "api",
                FunctionName: "archive",
                AddonUUID: Client.AddonUUID,
                NumberOfTries: 25,
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
        errorMessage = dependencies.errorMessage;
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
        addonUUID: Client.AddonUUID
    });
    const dependencies = await checkDependencies(papiClient, 'upgrade');

    if(dependencies.depedenciesMet) {
        let uuid = await getCodeJobUUID(papiClient, Client.AddonUUID);
        if(uuid != '') {
            await papiClient.codeJobs.upsert({
                UUID:uuid,
                CodeJobName: "Data Retention",
                NumberOfTries: 25,
            });
        }
        return {
            success:true,
            errorMessage:'',
            resultObject:{}
        }
    }
    else {
        return {
            success: false,
            errorMessage: dependencies.errorMessage,
            resultObject: {}
        }
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
        '0 24 * * SAT',
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
        uuid = JSON.parse(addon.AdditionalData).CodeJobUUID;
    }
    return uuid;
}

function getRandomIndex(arrayLength:number): number {
    let index: number = 0;
    Math.floor(Math.random() * (arrayLength + 1))
    return index;
}

async function checkDependencies(papiClient:PapiClient, action: 'upgrade' | 'install'): Promise<{depedenciesMet:boolean, errorMessage:string}> {
    let checkPassed = true;
    let errorMessage = '';
    try {
    const apiAddon = await papiClient.addons.installedAddons.addonUUID('00000000-0000-0000-0000-000000000a91').get();
    const apiVersion = Number(apiAddon?.Version?.substr(1, 3));
    const schedulerAddon = await papiClient.addons.installedAddons.addonUUID('fcb7ced2-4c81-4705-9f2b-89310d45e6c7').get();
    const schedulerVersion = schedulerAddon?.Version ? schedulerAddon.Version.split('.').map(item => {
        return Number(item);
    }) : []

    if(apiVersion < minimumAPIVersion) {
        checkPassed = false;
        errorMessage = `Cannot ${action} addon. Please upgrade 'Services Framework' add-on to version V${minimumAPIVersion} or above and try again.`
    }
    else if (schedulerVersion?.length == 3 &&
        (schedulerVersion[0] < minimumSchedulerVersion[0]) || 
        (schedulerVersion[0] == minimumSchedulerVersion[0] && schedulerVersion[1] < minimumSchedulerVersion[1]) ||
        (schedulerVersion[0] == minimumSchedulerVersion[0] && schedulerVersion[1] == minimumSchedulerVersion[1] && schedulerVersion[2] < minimumSchedulerVersion[2])) {      
            checkPassed = false;
            errorMessage = `Cannot ${action} addon. Please upgrade 'Automated Jobs' add-on to version ${minimumSchedulerVersion.join('.')} or above and try again.`
        }
    }
    catch {
        checkPassed = false;
        errorMessage = `Cannot verify version for dependencies add-ons`
    }
    return {
        depedenciesMet: checkPassed,
        errorMessage: errorMessage
    }
}

