
export const DEFAULT_NUM_OF_MONTHS:number = 12;

export type KeyValuePair<T> = {
    key: number;
    value: T;
}

export class ScheduledType {
    UUID?: string;
    ActivityType: KeyValuePair<string>;
    NumOfMonths: number;
    MinItems: number;

    constructor(activityTypeID, title, numOfMonths = 3, minItems){
        this.UUID = Guid.newGuid();
        this.ActivityType = { key: activityTypeID, value: title };
        this.NumOfMonths = numOfMonths;
        this.MinItems = minItems;
    }

}

export interface Phase {
    AuditUUID: string;
    ReturnData: any;
    Success: boolean;
}

export class AdditionalData {
    CodeJobUUID?: string;
    ScheduledTypes?: ScheduledType[];
    ScheduledTypes_Draft?: ScheduledType[];
    DefaultNumofMonths?: number = DEFAULT_NUM_OF_MONTHS;
    DefaultNumofMonths_Draft?: number = DEFAULT_NUM_OF_MONTHS;
    LatestReportURL?: string = '';
    NumOfDaysForHidden?: number = 90;
    HiddenTresholdDays?: number = 30;
    ArchivePhase?: Phase;
    ArchiveHiddenPhase?: Phase;
}

export class Guid {
    static newGuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
        });
    }
}

export class ReportTuple {
    ActivityType: KeyValuePair<string>;
    BeforeCount: number;
    AfterCount: number;
    ArchiveCount: number;
    Activities: number[];

    constructor(activityTypeID:number, title:string, beforeCount:number, archiveCount:number, activities:number[])
    {
        this.ActivityType = { key: activityTypeID, value: title }
        this.BeforeCount = beforeCount;
        this.ArchiveCount = archiveCount;
        this.AfterCount = beforeCount - archiveCount;
        this.Activities = activities;
    }
}