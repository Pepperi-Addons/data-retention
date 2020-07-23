import { Client, Request } from '@pepperi-addons/debug-server'
import { GeneralActivity, Transaction, MaintenanceJobResult } from '@pepperi-addons/papi-sdk';
import { ReportTuple, MyService, ScheduledType } from './my.service';

export async function archive(client:Client, request:Request) {
    try {
        const service = new MyService(client);
        //const final = await get_archive_report(client, request);
        const archiveData = (await service.getAdditionalData()).ScheduledTypes;
        const report = await service.prepareReport(processAccount, archiveData);
        const final = GenerateReport(report, x=>x.ActivityType.Key);
        const jobsIds: MaintenanceJobResult[] = await service.archiveData(final);
        return {
            Success: true,
            ErrorMessage:'',
            ArchiveJobs: jobsIds,
        }
    }
    catch (err) {
        return {
            Success: false,
            ErrorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
            ArchiveJobs: [],
        }
    }

}

export async function get_archive_report(client:Client, request: Request) {
    try {
        const service = new MyService(client);
        const archiveData = (await service.getAdditionalData()).DraftScheduledTypes;
        console.log("Archive data is:", archiveData);
        const report = await service.prepareReport(processAccount, archiveData);
        const final = GenerateReport(report, x=>x.ActivityType.Key);
        
        return {
            Success:true,
            ErrorMessage:'',
            resultObject: final,
        };
    }
    catch (err) {
        return {
            Success: false,
            ErrorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
            resultObject: []
        }
    }

}

async function processAccount(service: MyService, accountID: number, archiveData) : Promise<ReportTuple[]>{
    const activities :(GeneralActivity | Transaction)[] = await service.getActivitiesForAccount(accountID);
    let retVal:ReportTuple[] = [];
    let activitiesByType = groupBy(activities, x=>x.ActivityTypeID);
    console.log("after group by type: ", activitiesByType);
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
            let tuple:(ReportTuple & {AccountID?:number})= ProcessActivitiesByType(items, type);
            tuple.AccountID = accountID;
            //console.log('ProcessActivitiesByType: ', type.ActivityType.Value, 'returned: ', tuple);
            retVal.push(tuple);
        }
    });
    console.log('report for account id: ', accountID, 'is: ', retVal);
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
        const activityDate = new Date(activity.ActionDateTime || activity.ModificationDateTime || '')
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

function GenerateReport(list:ReportTuple[], keyGetter) {
    const map = new Map<number, ReportTuple>();
    list.forEach((item) => {
         const key = keyGetter(item);
         const collection = map.get(key);
         if (!collection) {
             map.set(key, item);
         } else {
             collection.BeforeCount += item.BeforeCount;
             collection.AfterCount += item.AfterCount;
             collection.ArchiveCount += item.ArchiveCount;
             collection.Activities = collection.Activities.concat(item.Activities);
         }
    });
    return [...map.values()];
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
