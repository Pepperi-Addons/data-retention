import { CodeJob } from "@pepperi-addons/papi-sdk";

import { DataRetentionService } from "./data-retention.service";
import { ScheduledType, AdditionalData, DEFAULT_NUM_OF_MONTHS } from "../../../../shared/entities";

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
import { PepDialogActionButton } from '@pepperi-addons/ngx-lib/dialog';
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { KeyValuePair } from './../../../../shared/entities';

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
    defaultNumOfMonths = DEFAULT_NUM_OF_MONTHS;
    disablePublish = false;
    reportInterval = undefined;
    dialogRef;

    // Events emitters to webapp
    @Output() addEditors: EventEmitter<any> = new EventEmitter<any>();
    @Output() notify: EventEmitter<any> = new EventEmitter<any>();
    @ViewChild(ListViewComponent, { static: false }) typesList: ListViewComponent;

    menuOptions: PepMenuItem[] = [];

    timeOptions = [
        { key: "0", value: "00:00" },
        { key: "1", value: "01:00" },
        { key: "2", value: "02:00" },
        { key: "3", value: "03:00" },
        { key: "4", value: "04:00" },
        { key: "5", value: "05:00" },
        { key: "6", value: "06:00" },
        { key: "7", value: "07:00" },
        { key: "8", value: "08:00" },
        { key: "9", value: "09:00" },
        { key: "10", value: "10:00" },
        { key: "11", value: "11:00" },
        { key: "12", value: "12:00" },
        { key: "13", value: "13:00" },
        { key: "14", value: "14:00" },
        { key: "15", value: "15:00" },
        { key: "16", value: "16:00" },
        { key: "17", value: "17:00" },
        { key: "18", value: "18:00" },
        { key: "19", value: "19:00" },
        { key: "20", value: "20:00" },
        { key: "21", value: "21:00" },
        { key: "22", value: "22:00" },
        { key: "23", value: "23:00" },
    ];

    dayOptions = [
        { key: "SUN", value: "Sunday" },
        { key: "MON", value: "Monday" },
        { key: "TUE", value: "Tuesday" },
        { key: "WED", value: "Wednesday" },
        { key: "THU", value: "Thursday" },
        { key: "FRI", value: "Friday" },
        { key: "SAT", value: "Saturday" },
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
        public layoutService: PepLayoutService,
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
                        this.dayOptions.findIndex((item) => item.key === parts[3]) || 0;
                }
                case "TimeSelect": {
                    index =
                        this.timeOptions.findIndex((item) => item.key === parts[1]) || 0;
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
                if (event.SelectedItem && self.activityTypes.find(item => event.SelectedItem.ActivityType.key == item.key)) {
                    self.openTypeDialog(event.ApiName, event.SelectedItem);
                }
                else {
                    const title = self.translate.instant('Archive_MissingActivityModal_Title');
                    const content = self.translate.instant('Archive_MissingActivityModal_Paragraph', { Type: event.SelectedItem.ActivityType.value });
                    
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
            () => {

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
                (item) => item.key === parts[4]
            ).key;
            this.selectedHour = this.timeOptions.find(
                (item) => item.key === parts[1]
            ).key;
        }

        this.menuOptions = [
            { 
                key: 'Report', 
                text: this.translate.instant('Archive_Menu_Report'), 
                disabled: this.disablePublish 
            },
            { 
                key: 'Executions', 
                text: this.translate.instant('Archive_Menu_Execution')
            },
            { 
                key: 'Run', 
                text: this.translate.instant('Archive_Menu_RunNow') 
            },
        ]
    }

    async publishPlugin() {
        const cronExpression = '0 ' + this.selectedHour + ' * * ' + this.selectedDay
        this.additionalData.ScheduledTypes = [...this.additionalData.ScheduledTypes_Draft];
        this.additionalData.DefaultNumofMonths = this.additionalData.DefaultNumofMonths_Draft;
        try {
            await this.pluginService.updateCodeJob({
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
            return self.additionalData.ScheduledTypes_Draft.findIndex(type => type.ActivityType.key == item.key) == -1 || (selectedObj ? selectedObj.ActivityType.key == item.key : false)
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
                    data.selectedActivity && type.ActivityType.key == data.selectedActivity
            ).length == 1 : false;
        if (exist) {
            const index = this.additionalData.ScheduledTypes_Draft.findIndex(
                (type) => type.ActivityType.key === data.selectedActivity
            );
            this.additionalData.ScheduledTypes_Draft[index].NumOfMonths = data.numOfMonths;
            this.additionalData.ScheduledTypes_Draft[index].MinItems = data.minItems;
        } else {
            const type = this.activityTypes.find(item => item.key == data.selectedActivity);
            if (type) {
                this.additionalData.ScheduledTypes_Draft.push(
                    new ScheduledType(type.key, type.value, data.numOfMonths, data.minItems)
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
                types.sort((a, b) => a.value.localeCompare(b.value))
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
            const index = this.additionalData.ScheduledTypes_Draft.findIndex(item => item.ActivityType.key == selectedObj.ActivityType.key);
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

    onValueChange(element, value) {
        switch(element) {
            case 'Days': {
                this.selectedDay = value;
                break;
            }
            case 'Hour': {
                this.selectedHour = value;
                break;
            }
            case 'defaultMonths': {
                if (value && value > 0 && value < 25) {
                    this.additionalData.DefaultNumofMonths_Draft = value;
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
                    ActivityType: item.ActivityType.value,
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
