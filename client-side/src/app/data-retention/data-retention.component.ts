import { CodeJob } from "@pepperi-addons/papi-sdk";

import { DataRetentionService } from "./data-retention.service";
import { ScheduledType, AdditionalData } from "./data-retention.model";

import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnInit,
    ViewEncapsulation,
    Compiler,
    ViewChild,
    OnDestroy,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Router, ActivatedRoute } from "@angular/router";
import { AddTypeDialogComponent } from "./dialogs/add-type-dialog/add-type-dialog.component";

import {
    MatTableDataSource,
} from "@angular/material/table";

import { ListViewComponent } from './components/list-view/list-view.component';
import { ReportDialogComponent } from './dialogs/report-dialog/report-dialog.component';
import { DialogService, PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { LayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepMenuItem } from '@pepperi-addons/ngx-lib/menu';

@Component({
    selector: "data-retention",
    templateUrl: "./data-retention.component.html",
    styleUrls: ["./data-retention.component.scss"],
    providers: [DataRetentionService],
    // To override parent component styling
    encapsulation: ViewEncapsulation.None,
})
export class DataRetentionComponent implements OnInit, OnDestroy {
    PepScreenSizeType = PepScreenSizeType;

    installing = false;
    showReset = true;
    panelOpenState = false;
    icon = false;
    toggleArrow = false;
    scheduledListColumns = ["Selection", "Value", "NumOfMonths", "MinItems"];
    additionalData: AdditionalData;
    activityTypes = [];
    dataSource: MatTableDataSource<any>;
    scheduledList = [];
    selectedDay: string = "";
    selectedHour: string = "";
    latestReport = undefined;
    listActions = [];
    defaultNumOfMonths = 24;
    disablePublish = false;
    reportInterval = undefined;
    dialogRef;

    // Data sent from webapp
    @Input() queryParams: any;
    @Input() routerData: any;

    // Events emitters to webapp
    @Output() addEditors: EventEmitter<any> = new EventEmitter<any>();
    @Output() notify: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(ListViewComponent, { static: false }) typesList: ListViewComponent;

    menuOptions: PepMenuItem[] = [];

    timeOptions = [
        { Key: "0", Value: "00:00" },
        { Key: "1", Value: "01:00" },
        { Key: "2", Value: "02:00" },
        { Key: "3", Value: "03:00" },
        { Key: "4", Value: "04:00" },
        { Key: "5", Value: "05:00" },
        { Key: "6", Value: "06:00" },
        { Key: "7", Value: "07:00" },
        { Key: "8", Value: "08:00" },
        { Key: "9", Value: "09:00" },
        { Key: "10", Value: "10:00" },
        { Key: "11", Value: "11:00" },
        { Key: "12", Value: "12:00" },
        { Key: "13", Value: "13:00" },
        { Key: "14", Value: "14:00" },
        { Key: "15", Value: "15:00" },
        { Key: "16", Value: "16:00" },
        { Key: "17", Value: "17:00" },
        { Key: "18", Value: "18:00" },
        { Key: "19", Value: "19:00" },
        { Key: "20", Value: "20:00" },
        { Key: "21", Value: "21:00" },
        { Key: "22", Value: "22:00" },
        { Key: "23", Value: "23:00" },
    ];

    dayOptions = [
        { Key: "SUN", Value: "Sunday" },
        { Key: "MON", Value: "Monday" },
        { Key: "TUE", Value: "Tuesday" },
        { Key: "WED", Value: "Wednesday" },
        { Key: "THU", Value: "Thursday" },
        { Key: "FRI", Value: "Friday" },
        { Key: "SAT", Value: "Saturday" },
    ];

    codeJob: CodeJob;

    screenSize: PepScreenSizeType;

    schedulerURL = '/settings/fcb7ced2-4c81-4705-9f2b-89310d45e6c7/scheduler';

    constructor(
        public pluginService: DataRetentionService,
        private translate: TranslateService,
        public routeParams: ActivatedRoute,
        public router: Router,
        public compiler: Compiler,
        public dialogService: DialogService,
        public layoutService: LayoutService,
    ) {
        const self = this;

        // Parameters sent from url
        this.pluginService.pluginUUID = this.routeParams.snapshot.params['addon_uuid'];
        let userLang = "en";
        translate.setDefaultLang(userLang);
        userLang = translate.getBrowserLang().split("-")[0]; // use navigator lang if available
        translate.use(userLang);
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;

            // this.searchOpenOnSmallDevice = this.screenSize > PepScreenSizeType.SM && this.searchListCompStateIsOpen;
        });

    }

    ngOnInit() {
        this.run();
    }
    getSelectedOptionIndex(mode: string) {
        let index = 0;
        const parts = this.codeJob ? this.codeJob.CronExpression.split(" ") : [];
        console.log("part array is:", parts);
        if (parts.length > 4) {
            switch (mode) {
                case "DaySelect": {
                    index =
                        this.dayOptions.findIndex((item) => item.Key === parts[3]) || 0;
                }
                case "TimeSelect": {
                    index =
                        this.timeOptions.findIndex((item) => item.Key === parts[1]) || 0;
                }
                default: {
                    break;
                }
            }
        }
        return index;
    }

    onActionClicked(event) {
        const self = this;
        switch (event.ApiName) {
            case "Add": {
                self.openTypeDialog(event.ApiName, event.SelectedItem);
                break;
            }
            case "Edit": {
                if (event.SelectedItem && self.activityTypes.find(item => event.SelectedItem.ActivityType.Key == item.Key)) {
                    self.openTypeDialog(event.ApiName, event.SelectedItem);
                }
                else {
                    const title = self.translate.instant('Archive_MissingActivityModal_Title');
                    const content = self.translate.instant('Archive_MissingActivityModal_Paragraph', { Type: event.SelectedItem.ActivityType.Value });
                    
                    const buttons = [
                        new PepDialogActionButton(
                            this.translate.instant("Archive_Confirm"),
                            "",
                            () => {
                                this.deleteType(event.selectedItem);
                            })]
                    self.pluginService.openTextDialog(title, content, buttons, 'custom');
                }
                break;
            }
            case "Delete": {
                self.deleteTypeDialog(event.SelectedItem);
                break;
            }
            default: {
                alert("not supported");
            }
        }
    }

    onMenuItemClicked(event) {
        if (this.disablePublish) {
            const title = this.translate.instant('Archive_InvalidFormModal_Title');
            const content = this.translate.instant('Archive_InvalidFormModal_Paragraph');

            this.pluginService.openTextDialog(title, content, [], 'close');
        }
        else {
            switch (event.source.key) {
                case 'Report': {

                    this.latestReport = undefined;
                    this.additionalData.LatestReportURL = '';
                    this.pluginService.updateAdditionalData(this.additionalData);
                    this.generateReport();
                    break;
                }
                case 'Executions': {
                    this.router.navigate([
                        this.schedulerURL
                    ], {
                        queryParams: {
                            view: 'executions',
                            job_id: this.additionalData.CodeJobUUID
                        }
                    });
                    break;
                }
                case 'Run': {
                    this.showRunMessage();
                    break;
                }
                default: {
                    alert(event.apiName + " is not supported");
                }
            }
        }
    }
    async generateReport() {
        const self = this;
        const token = await this.pluginService.getReportToken();
        if (token) {
            const title = this.translate.instant('Archive_ReportModal_Title');
            const content = this.translate.instant('Archive_ReportModal_Paragraph');

            this.pluginService.openTextDialog(title, content, [], 'close');
            this.reportInterval = window.setInterval(() => {
                this.pluginService.getExecutionLog(token).then(logRes => {
                    if (logRes && logRes.Status && logRes.Status.Name !== 'InProgress' && logRes.Status.Name !== 'InRetry') {
                        window.clearInterval(this.reportInterval);
                        const resultObj = JSON.parse(logRes.AuditInfo.ResultObject);
                        if (resultObj.success == true) {
                            self.latestReport = resultObj.resultObject;
                            console.log('latest report is:', self.latestReport);
                            if (self.pluginService.dialogRef.componentInstance) {
                                self.pluginService.dialogRef.close();
                                self.viewReport();
                            }
                        }
                    }
                    else if(logRes && logRes.Status && logRes.Status.Name === 'InRetry') {
                        const resultObj = JSON.parse(logRes.AuditInfo.ResultObject);
                        if (resultObj.success == 'Exception') {
                            window.clearInterval(this.reportInterval);
                            console.log('Report generation failed! \n error message is:', resultObj.errorMessage);
                            if (self.pluginService.dialogRef.componentInstance) {
                                const content = self.translate.instant("Archive_ReportModal_Exception");
                                self.pluginService.dialogRef.componentInstance.content = content;
                            }
                        }
                    }
                });
            }, 1500);
        }
    }

    viewReport() {
        const dialogTitle = this.translate.instant('Archive_ReportModal_Title');
        this.pluginService.openDialog(
            dialogTitle,
            ReportDialogComponent,
            [],
            {
                title: dialogTitle,
                data: {
                    reportRows: this.latestReport
                },
            },
            (data) => {
                // callback from dialog with input data
            }
        );
    }

    showRunMessage() {
        const title = this.translate.instant('Archive_ExecuteModal_Title');
        const content = this.translate.instant('Archive_ExecuteModal_Paragraph');
        const buttons = [
            new PepDialogActionButton(
                this.translate.instant("Archive_Cancel"),
                "",
                () => {
                }),
            new PepDialogActionButton(
                this.translate.instant("Archive_Confirm"),
                "pepperi-button md strong",
                () => {
                    this.runJob();
                })
            ]

        this.pluginService.openTextDialog(title, content, buttons, 'custom');
    }

    async runJob() {
        this.additionalData.ScheduledTypes = [...this.additionalData.ScheduledTypes_Draft];
        this.additionalData.DefaultNumofMonths = this.additionalData.DefaultNumofMonths_Draft;
        await this.pluginService.updateAdditionalData(this.additionalData);
        this.pluginService.papiClient.codeJobs.async().uuid(this.additionalData.CodeJobUUID).execute().then(value => {
            const executionLogLink = `${this.schedulerURL}?view=executions&job_id=${this.additionalData.CodeJobUUID}`;
            const title = this.translate.instant('Archive_ExecuteModal_Title');
            const content = this.translate.instant('Archive_ExecutingModal_Paragraph', {
                ExecutionLogLink: executionLogLink
            });
            this.pluginService.openTextDialog(title, content, [], 'close');
        });
    }

    async run() {
        const self = this;
        this.getActivityTypes();
        this.additionalData = await this.pluginService.getAdditionalData();
        this.defaultNumOfMonths = this.additionalData.DefaultNumofMonths_Draft;
        this.latestReport = this.additionalData.LatestReportURL ? await this.getLatestReport() : undefined;
        this.codeJob = await this.pluginService.papiClient.codeJobs
            .uuid(this.additionalData.CodeJobUUID)
            .find();
        const parts = this.codeJob ? this.codeJob.CronExpression.split(" ") : [];
        if (parts.length > 4) {
            this.selectedDay = this.dayOptions.find(
                (item) => item.Key === parts[4]
            ).Key;
            this.selectedHour = this.timeOptions.find(
                (item) => item.Key === parts[1]
            ).Key;
        }

        this.menuOptions = [
            { 
                key: 'Report', 
                title: this.translate.instant('Archive_Menu_Report'), 
                disabled: this.disablePublish 
            },
            { 
                key: 'Executions', 
                title: this.translate.instant('Archive_Menu_Execution')
            },
            { 
                key: 'Run', 
                title: this.translate.instant('Archive_Menu_RunNow') 
            },
        ]
    }

    async publishPlugin() {
        const cronExpression = '0 ' + this.selectedHour + ' * * ' + this.selectedDay
        this.additionalData.ScheduledTypes = [...this.additionalData.ScheduledTypes_Draft];
        this.additionalData.DefaultNumofMonths = this.additionalData.DefaultNumofMonths_Draft;
        try {
            await this.pluginService.papiClient.codeJobs.upsert({
                UUID: this.codeJob.UUID,
                CodeJobName: this.codeJob.CodeJobName,
                CronExpression: cronExpression
            });
            await this.pluginService.updateAdditionalData(this.additionalData);

            const title = this.translate.instant("Archive_PublishModal_Title");
            const content = this.translate.instant("Archive_PublishModal_Success");
            this.pluginService.openTextDialog(title, content, [], 'close');
        }
        catch (error) {
            const title = this.translate.instant("Archive_PublishModal_Title");
            const content = this.translate.instant("Archive_PublishModal_Failure", {
                message: ('message' in error) ? error.message : 'Unknown error occured'
            });
            this.pluginService.openTextDialog(title, content, [], 'close');
        }
        // Implement: save UI data
    }

    openTypeDialog(operation, selectedObj = undefined) {
        const self = this;
        const types = self.additionalData.ScheduledTypes_Draft ? self.activityTypes.filter((item) => {
            return self.additionalData.ScheduledTypes_Draft.findIndex(type => type.ActivityType.Key == item.Key) == -1 || (selectedObj ? selectedObj.ActivityType.Key == item.Key : false)
        }) : self.activityTypes;
        const dialogTitle = operation == 'Add' ? this.translate.instant('Archive_TypesModalTitle_Add') : this.translate.instant('Archive_TypesModalTitle_Update');
        self.pluginService.openDialog(
            dialogTitle,
            AddTypeDialogComponent,
            [],
            {
                title: dialogTitle,
                data: {
                    activityTypes: types,
                    selectedType: selectedObj,
                    maxHistory: self.additionalData.DefaultNumofMonths_Draft
                }
            },
            (data) => {
                // callback from dialog with input data
                if (data) {
                    this.typeCallback(data, selectedObj);
                }
            }
        );
    }

    typeCallback(data, selectedType) {
        const exist = this.additionalData.ScheduledTypes_Draft ?
            this.additionalData.ScheduledTypes_Draft.filter(
                (type) =>
                    data.selectedActivity && type.ActivityType.Key == data.selectedActivity
            ).length == 1 : false;
        if (exist) {
            const index = this.additionalData.ScheduledTypes_Draft.findIndex(
                (type) => type.ActivityType.Key === data.selectedActivity
            );
            this.additionalData.ScheduledTypes_Draft[index].NumOfMonths = data.numOfMonths;
            this.additionalData.ScheduledTypes_Draft[index].MinItems = data.minItems;
        } else {
            const type = this.activityTypes.find(item => item.Key == data.selectedActivity);
            if (type) {
                this.additionalData.ScheduledTypes_Draft.push(
                    new ScheduledType(type.Key, type.Value, data.numOfMonths, data.minItems)
                );
            }
        }
        this.pluginService.updateAdditionalData(this.additionalData);
        this.typesList ? this.typesList.reload() : null;
    }

    getActivityTypes() {
        this.activityTypes = [];
        this.pluginService.getTypes((types) => {
            if (types) {
                types.sort((a, b) => a.Value.localeCompare(b.Value))
                this.activityTypes = [...types];
            }
        });
    }

    deleteTypeDialog(selectedObj) {
        const self = this;
        const actionButton = [
            new PepDialogActionButton(
                this.translate.instant("Archive_Cancel"),
                "",
                () => {
                }), 
            new PepDialogActionButton(
                this.translate.instant("Archive_Confirm"),
                "pepperi-button md strong caution",
                () => {
                    this.deleteType(selectedObj);
                })];
        const title = this.translate.instant("Archive_DeleteModal_Title");
        const content = this.translate.instant("Archive_DeleteModal_Paragraph");
        this.pluginService.openTextDialog(title, content, actionButton, 'custom');
    }

    deleteType(selectedObj) {
        if (selectedObj) {
            const index = this.additionalData.ScheduledTypes_Draft.findIndex(item => item.ActivityType.Key == selectedObj.ActivityType.Key);
            index > -1 ? this.additionalData.ScheduledTypes_Draft.splice(index, 1) : null;
            this.pluginService.updateAdditionalData(this.additionalData);
            this.typesList ? this.typesList.reload() : null;
        }
    }

    ngOnDestroy() { 
        if (this.reportInterval) {
            window.clearInterval(this.reportInterval);
        }
    }

    onValueChange(element, $event) {
        switch(element) {
            case 'Days': {
                this.selectedDay = $event.value;
                break;
            }
            case 'Hour': {
                this.selectedHour = $event.value;
                break;
            }
            case 'defaultMonths': {
                if ($event.value && $event.value > 0 && $event.value < 25) {
                    this.additionalData.DefaultNumofMonths_Draft = $event.value;
                    this.pluginService.updateAdditionalData(this.additionalData);
                }
                break;
            }
        }
    }

    async getLatestReport(): Promise<any> {
        try {
            const response: Response = await this.pluginService.apiCall('GET', this.additionalData.LatestReportURL);
            const responseText = await response.text();
            return (responseText ? JSON.parse(responseText) : '').map(item => {
                return {
                    ActivityType: item.ActivityType.Value,
                    BeforeCount: item.BeforeCount,
                    ArchiveCount: item.ArchiveCount,
                    AfterCount: item.AfterCount
                }
            });
        }
        catch(error) {
            console.log('Cannot get report. error is:', JSON.stringify(error));
            return undefined;
        }
    }
}
