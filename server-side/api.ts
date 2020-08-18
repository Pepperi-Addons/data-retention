import { Client, Request } from '@pepperi-addons/debug-server'
import { GeneralActivity, Transaction, TempUrlResponse, MaintenanceJobResult } from '@pepperi-addons/papi-sdk';
import { ReportTuple, MyService, ScheduledType,ArchiveReport, ExecutionData, ArchiveJobResult, ArchiveReturnObj } from './my.service';
import { resolve } from 'dns';
import { transpileModule } from 'typescript';

export const PageSize:number = 5000;

export async function archive(client:Client, request:Request) {
    try {
        const service = new MyService(client);
        
        //const final = await get_archive_report(client, request);
        const addonData = await service.getAdditionalData();
        let executionData: ExecutionData = await GetPreviousExecutionsData(client, request);
        if(executionData.ArchivingReport && executionData.ArchivingReport.length > 0) {
            const resultObj = await PollArchiveJobs(service, executionData)
            if(resultObj) {
                return {
                    success:true,
                    errorMessage:'',
                    resultObject: resultObj
                }
            }
            else {
                client.Retry(1000);
            }
        }
        else {
            const {report, isDone, pageIndex} = await service.prepareReport(processAccount, addonData.ScheduledTypes, addonData.DefaultNumofMonths, executionData);
            if(isDone) {
                const final = GenerateReport(report, x=>x.ActivityType.Key);
                const jobsIds: ArchiveReport[] = await service.archiveData(final);
                request.body = {
                    archivingReport: jobsIds,
                }
                client.Retry(1000);
                return {
                    success: true,
                    errorMessage:'',
                    archiveJobs: jobsIds,
                }
            }
            else {
                await service.uploadReportToS3(executionData.ArchiveReportURL.UploadUrl, report);
                request.body = {
                    pageIndex: pageIndex,
                    archiveDataFileURL: executionData.ArchiveReportURL,
                }
                client.Retry(1000);
                return request.body;
            }
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
            archiveJobs: [],
        }
    }

}

export async function get_archive_report(client:Client, request: Request) {
    try {
        const service = new MyService(client);
        const addonData = await service.getAdditionalData();
        console.log("Archive data is:", addonData.ScheduledTypes_Draft);
        let executionData: ExecutionData = await GetPreviousExecutionsData(client, request);
        const {report, isDone, pageIndex}  = await service.prepareReport(processAccount, addonData.ScheduledTypes_Draft, addonData.DefaultNumofMonths_Draft, executionData);
        if(isDone) {
            const final = GenerateReport(report, x=>x.ActivityType.Key);
            await service.uploadReportToS3(executionData.ArchiveReportURL.UploadUrl, final);
            
            return {
                success:true,
                errorMessage:'',
                resultObject: final.map(item=> {
                    return {
                        ActivityType: item.ActivityType.Value,
                        BeforeCount: item.BeforeCount,
                        ArchiveCount: item.ArchiveCount,
                        AfterCount: item.AfterCount
                    }
                }),
            };
        }
        else {
            await service.uploadReportToS3(executionData.ArchiveReportURL.UploadUrl, report);
            request.body = {
                pageIndex: pageIndex,
                archiveDataFileURL: executionData.ArchiveReportURL,
            }
            client.Retry(1000);
            return request.body;
        }
    }
    catch (err) {
        return {
            success: false,
            errorMessage: ('message' in err) ? err.message : 'Unknown Error Occured',
            resultObject: []
        }
    }

}

async function processAccount(service: MyService, accountIDs: number[], archiveData, defaultNumOfMonths) : Promise<ReportTuple[]>{
    const activities :(GeneralActivity | Transaction)[] = await service.getActivitiesForAccount(accountIDs);
    let retVal:ReportTuple[] = [];
    let activitiesByType = groupBy(activities, x=>x.ActivityTypeID);
    //console.debug("after group by type: ", activitiesByType);
    activitiesByType.forEach((items:(GeneralActivity | Transaction)[]) => {
        if(items.length > 0) { 
            let type: ScheduledType = archiveData.find(x=> x.ActivityType.Key == items[0].ActivityTypeID) || 
            {
                ActivityType: {
                    Key: items[0].ActivityTypeID || -1, 
                    Value:items[0].Type || ""
                },
                NumOfMonths: defaultNumOfMonths,
                MinItems: -1
            };
            let tuple:(ReportTuple & {AccountID?:number})= ProcessActivitiesByType(items, type);
            //tuple.AccountID = accountIDs;
            //console.debug('ProcessActivitiesByType: ', type.ActivityType.Value, 'returned: ', tuple);
            retVal.push(tuple);
        }
    });
    //console.debug('report for account id: ', accountIDs, 'is: ', retVal);
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

async function GetPreviousExecutionsData(client: Client, request:Request):Promise<ExecutionData> {
    console.log('request.body is:', request.body);
    const service = new MyService(client);
    let retVal: ExecutionData = {
        PageIndex: 1,
        PreviousRunReport: [],
        ArchiveReportURL: {
            UploadUrl: '',
            PublicUrl: ''
        },
        ArchivingReport: [],
        ArchiveResultObject: [],
    }
    if(request.body) {
        try {
            retVal.ArchiveReportURL = 'archiveDataFileURL' in request.body ? request.body.archiveDataFileURL : await service.papiClient.fileStorage.temporaryUploadUrl();
            console.log('temporary file url is:', retVal.ArchiveReportURL);
            if('archiveDataFileURL' in request.body && request.body.archiveDataFileURL.PublicUrl != '' ) {
                retVal.PreviousRunReport = await service.getReportFromS3(retVal.ArchiveReportURL.PublicUrl);
            }
            retVal.PageIndex = 'pageIndex' in request.body ? request.body.pageIndex : 1;
            retVal.ArchivingReport = 'archivingReport' in request.body ? request.body.archivingReport : [];
            retVal.ArchiveResultObject = 'archiveResultObject' in request.body ? request.body.archiveResultObject : [];
        }
        catch (error) {
            console.error("could not get execution data. reseting...\n request.body recieved:", request.body, '\nerror message is: ', 'message' in error ? error.message : '');
        }
    }
    return retVal;
}

async function PollArchiveJobs(service: MyService, executionData: ExecutionData) {
    return new Promise((resolve) => {
        let numOfTries = 1;
        const interval = setInterval(async ()=> {
            const pollingJobsPromises = executionData.ArchivingReport.map((item) :Promise<ArchiveReturnObj> => {
                const promises = item.ArchiveJobResult.map((job):Promise<ArchiveJobResult> => {
                    return new Promise((resolve) => {
                        service.papiClient.get(job.URI).then((jobResult) => {
                            resolve({
                                URI: job.URI,
                                Status: jobResult.Status,
                                RecordsAffected: jobResult.RecordsCount,
                                ErrorMessage: jobResult.ErrorMessage
                            });
                        }, (reason)=> {
                            resolve({
                                URI: job.URI,
                                Status: "Failed",
                                RecordsAffected: 0,
                                ErrorMessage: reason
                            });
                        });
                    });
                });
                return new Promise((resolve) => {
                    Promise.all(promises).then(jobResults => {
                        resolve({
                            ActivityType: item.ActivityType,
                            Jobs: jobResults,
                            Finished: (jobResults.filter(job => job.Status == "InProgress").length == 0)
                        })
                    });
                })

            });
            const pollingJobs = await Promise.all(pollingJobsPromises.flat());
            if(pollingJobs.filter(poll => !poll.Finished).length == 0) {
                resolve ({
                    archiveResultObject: pollingJobs.map(item => {
                        return {
                            ActivityType: item.ActivityType,
                            Jobs: item.Jobs,
                        }
                    })
                });
                clearInterval(interval);
            }
            else if(numOfTries++ > 600) { 
                resolve(undefined);
                clearInterval(interval);
            }
        }, 10000);
    });
}