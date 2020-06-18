
import { Client, Request } from '@pepperi-addons/debug-server'
import { GeneralActivity, Transaction } from '@pepperi-addons/papi-sdk';
import { ReportTuple, MyService } from './my.service';

type HttpMethod =  'POST' | 'GET' | 'PUT' | 'DELETE';

export async function get_archive_report(client:Client, request: Request) {
    const service = new MyService(client);
    const accounts = await service.getAccounts(processAccount);
    
    return {
        resultObject: GenerateReport(accounts)
    };
}

async function processAccount(service: MyService, accountID: number) : Promise<ReportTuple[]>{
    const activities :(GeneralActivity | Transaction)[] = await service.getActivitiesForAccount(accountID);
    const additionalData = await service.getAdditionalData();
    let retVal:ReportTuple[] = [];
    additionalData.ScheduledTypes.forEach((type) => {
        let activitiesForType = activities.filter(x=> x.ActivityTypeID === type.ActivityType.Key);
        let activitiesToArchive:number[] = [];
        activitiesForType.forEach((activity) => {
            const activityDate = activity.ActionDateTime ? new Date(activity.ActionDateTime): new Date(1,1,1970);
            let activityID = activity.InternalID ? activity.InternalID : -1;
            activitiesToArchive = [];
            if(shouldArchiveActivity(activityDate,type.NumOfMonths)) {
                activitiesToArchive.push(activityID);
            }
        });
        let remainingActivitiesNum = activitiesForType.length - activitiesToArchive.length;
        if (remainingActivitiesNum < type.MinItems) {
            let diff = type.MinItems - remainingActivitiesNum;
            if (diff < activitiesToArchive.length) {
                while(diff > 0) {
                    activitiesToArchive.pop();
                    diff--;
                }
            }
            else {
                activitiesToArchive = [];
            }
        }
        retVal.push(new ReportTuple(type.ActivityType.Key, type.ActivityType.Value, activitiesForType.length, activitiesToArchive.length, activitiesToArchive));
    });

    // After scanning activities according to user definition's, we need to scan remaining activities and archive according to default policy
    activities.forEach(activity => {
        let type = additionalData.ScheduledTypes.find(x=> x.ActivityType.Key == activity.ActivityTypeID);
        const activityDate = activity.ActionDateTime ? new Date(activity.ActionDateTime): new Date(1,1,1970);
        if(!type && shouldArchiveActivity(activityDate,24)) {
            retVal.push(new ReportTuple(activity.ActivityTypeID || -1, activity.Type || "", 1, 1, [activity.InternalID || -1]));
        }
    })
    return retVal;
}

async function shouldArchiveActivity(activityDate:Date, numOfMonths:number) : Promise<boolean>{
    let retVal:boolean = false
    let today = new Date();

    today = new Date(today.setMonth(today.getMonth() - numOfMonths));
    if(activityDate < today){
        retVal = true;
    }

    return retVal;
}

function GenerateReport(rows:ReportTuple[]) {
    const report = rows.reduce((result, currentValue) => {
        let obj = currentValue;
        if (!result[currentValue.ActivityType.Key]) {
            result[currentValue.ActivityType.Key] = [currentValue];
        }
        else {
            obj = result[currentValue.ActivityType.Key][0];
            obj.BeforeCount += currentValue.BeforeCount;
            obj.AfterCount += currentValue.AfterCount;
            obj.ArchiveCount += currentValue.ArchiveCount;
            obj.Activities = obj.Activities.concat(currentValue.Activities);
        }
        // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
        result[currentValue.ActivityType.Key][0] = obj;
        return result;
    }, Object.create(null)); // empty object is the initial value for result object

    return Object.values(report).flat();
}
