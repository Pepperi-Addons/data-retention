import { Client, Request } from '@pepperi-addons/debug-server'
import { GeneralActivity, Transaction } from '@pepperi-addons/papi-sdk';
import { ReportTuple, MyService, ScheduledType } from './my.service';

type HttpMethod =  'POST' | 'GET' | 'PUT' | 'DELETE';

export async function get_archive_report(client:Client, request: Request) {
    const service = new MyService(client);
    const accounts = await service.getAccounts(processAccount);
    
    return {
        resultObject: GenerateReport(accounts)
    };
}

async function processAccount(service: MyService, accountID: number, archiveData) : Promise<ReportTuple[]>{
    const activities :(GeneralActivity | Transaction)[] = await service.getActivitiesForAccount(accountID);
    let retVal:ReportTuple[] = [];
    let activitiesByType = groupBy(activities, x=>x.ActivityTypeID);
    //console.log("after group by type: ", activitiesByType);
    activitiesByType.forEach((items:(GeneralActivity | Transaction)[]) => {
        if(items.length > 0) { 
            let type: ScheduledType = archiveData.find(x=> x.ActivityType.Key == items[0].ActivityTypeID) || 
            {
                ActivityType: {
                    Key: items[0].ActivityTypeID || -1, 
                    Value:items[0].Type || ""
                },
                NumOfMonths: 24,
                MinItems: -1
            };
            let tuple = ProcessActivitiesByType(items, type);
            //console.log('ProcessActivitiesByType: ', type.ActivityType.Value, 'returned: ', tuple);
            retVal.push(tuple);
        }
    });
    //console.log('report for account id: ', accountID, 'is: ', retVal);
    return retVal;
}

function shouldArchiveActivity(activityDate:Date, numOfMonths:number) : boolean{
    let retVal:boolean = false
    let today = new Date();

    today = new Date(today.setMonth(today.getMonth() - numOfMonths));
    if(activityDate < today){
        retVal = true;
    }

    return retVal;
}

function ProcessActivitiesByType(items:(GeneralActivity | Transaction)[], type:ScheduledType):ReportTuple {
    let activitiesToArchive:number[] = [];
    items.forEach((activity:(GeneralActivity | Transaction)) => {
        const activityDate = new Date(activity.ActionDateTime || '')
        const activityID = activity.InternalID || -1;
        if(shouldArchiveActivity(activityDate, type.NumOfMonths)) {
            activitiesToArchive.push(activityID);
        }
    });
    let remainingActivitiesNum = items.length - activitiesToArchive.length;
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
    return  {
        ActivityType: {
            Key: type.ActivityType.Key,
            Value: type.ActivityType.Value
        },
        BeforeCount: items.length, 
        ArchiveCount: activitiesToArchive.length, 
        AfterCount: items.length - activitiesToArchive.length, 
        Activities :activitiesToArchive
    };

}

function GenerateReport(rows:ReportTuple[]) {
    const report = rows.reduce((result, currentValue) => {
        let obj = currentValue;
        if (!result[currentValue.ActivityType.Key]) {
            result[currentValue.ActivityType.Key] = currentValue;
        }
        else {
            obj = result[currentValue.ActivityType.Key];
            obj.BeforeCount += currentValue.BeforeCount;
            obj.AfterCount += currentValue.AfterCount;
            obj.ArchiveCount += currentValue.ArchiveCount;
            obj.Activities = obj.Activities.concat(currentValue.Activities);
        }
        // Return the current iteration `result` value, this will be taken as next iteration `result` value and accumulate
        return result;
    }, Object.create(null)); // empty object is the initial value for result object

    return Object.values(report);
}

function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
         const key = keyGetter(item);
         const collection = map.get(key);
         if (!collection) {
             map.set(key, [item]);
         } else {
             collection.push(item);
         }
    });
    return map;
}
