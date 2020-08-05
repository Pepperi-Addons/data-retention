import { CodeJob } from "@pepperi-addons/papi-sdk";

import { PluginService } from "./plugin.service";
import { ScheduledType, AdditionalData } from "./plugin.model";
import { debug } from "util";

import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  ViewEncapsulation,
  Compiler,
  ViewChild,
  ComponentRef,
  ElementRef,
  OnDestroy,
  Inject,
  ChangeDetectorRef,
  ViewContainerRef,
} from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Router, ActivatedRoute } from "@angular/router";
// @ts-ignore
// import { SharedModule } from 'pepperi-shared';
// // @ts-ignore
// import { PepperiTextareaComponent} from 'pepperi-textarea';
// @ts-ignore
import { PepperiImageComponent } from "pepperi-image";
// @ts-ignore
import { PepperiSelectComponent } from "pepperi-select";
// @ts-ignore
import { PepperiTextboxComponent } from "pepperi-textbox";
// @ts-ignore
import { PepperiListComponent, VIEW_TYPE } from "pepperi-custom-list";
// @ts-ignore
import { TopBarComponent, TopBarButton, ICON_POSITION } from "pepperi-top-bar";
// @ts-ignore
import { ListActionsItem } from "pepperi-list-actions";
import { DynamicComponent } from "ng-dynamic-component";
// @ts-ignore
import { DialogDataType, DialogData } from "pepperi-dialog";

import { AddTypeDialogComponent } from "./dialogs/add-type-dialog/add-type-dialog.component";
import { DataSource, SelectionModel } from "@angular/cdk/collections";

import {
  MatTableDataSource,
  MatExpansionPanelActionRow,
  MatGridTileHeaderCssMatStyler,
} from "@angular/material";
// @ts-ignore
import { ObjectSingleData, PepperiRowData, FIELD_TYPE} from "pepperi-main-service";

//@ts-ignore
import { UserService } from "pepperi-user-service";
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from "constants";
import { runInThisContext } from "vm";
import { ListViewComponent } from './components/list-view/list-view.component';
import { Breakpoints } from '@angular/cdk/layout';
import { ReportDialogComponent } from './dialogs/report-dialog/report-dialog.component';

@Component({
  selector: "plugin",
  templateUrl: "./plugin.component.html",
  styleUrls: ["./plugin.component.scss"],
  providers: [PluginService],
  // To override parent component styling
  encapsulation: ViewEncapsulation.None,
})
export class PluginComponent implements OnInit, OnDestroy {
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
  //selection = new SelectionModel<ScheduledType>(false, []);
  listActions = [];
  defaultNumOfMonths = 24;
  disablePublish = false;
  // Data sent from webapp
  @Input() queryParams: any;
  @Input() routerData: any;

  // Events emitters to webapp
  @Output() addEditors: EventEmitter<any> = new EventEmitter<any>();
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

//   pepperiSelect = PepperiSelectComponent;

    @ViewChild(ListViewComponent, { static: false }) typesList:ListViewComponent;

    menuOptions = [];


//   @ViewChild("pepperiSelectTimeComp", { static: false })
//   pepperiSelectTimeComp: DynamicComponent;
//   pepperiSelectTimeInputs;
//   pepperiSelectTimeOutputs;
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

//   @ViewChild("pepperiSelectDayComp", { static: false })
//   pepperiSelectDayComp: DynamicComponent;
//   pepperiSelectDayInputs;
//   pepperiSelectDayOutputs;
  dayOptions = [
    { Key: "SUN", Value: "Sunday" },
    { Key: "MON", Value: "Monday" },
    { Key: "TUE", Value: "Tuesday" },
    { Key: "WED", Value: "Wednesday" },
    { Key: "THU", Value: "Thursday" },
    { Key: "FRI", Value: "Friday" },
    { Key: "SAT", Value: "Saturday" },
  ];

//   pepperiInput = PepperiTextboxComponent;

//   @ViewChild("pepperiInputComp", { static: false })
//   pepperiInputComp: DynamicComponent;
//   pepperiInputInputs;
//   pepperiInputOutputs;

//   @ViewChild("genericCont", { static: false }) genericCont: ElementRef;
//   @ViewChild("pepperiListComp", { static: false })
//   pepperiListComp: DynamicComponent;

//   pepperiList = PepperiListComponent;
//   pepperiListInputs;
//   pepperiListOutputs;

//   @ViewChild("topBarComp", { static: false }) topBarComp: DynamicComponent;

//   topBar = TopBarComponent;
//   topBarInputs;
//   topBarOutputs;

  codeJob: CodeJob;

  schedulerURL = '/settings/fcb7ced2-4c81-4705-9f2b-89310d45e6c7/scheduler';

  constructor(
    public pluginService: PluginService,
    private translate: TranslateService,
    public routeParams: ActivatedRoute,
    public router: Router,
    public compiler: Compiler,
  ) {
    const self = this;

    // Parameters sent from url
    this.routeParams.params.subscribe((params) => {
      self.pluginService.pluginUUID = params.pluginID;
    });
    // Parameters sent from query url (?)
    this.routeParams.queryParams.subscribe((queryParams) => {
      self.showReset = queryParams.showReset;
    });

    let userLang = "en";
    translate.setDefaultLang(userLang);
    userLang = translate.getBrowserLang().split("-")[0]; // use navigator lang if available
    translate.use(userLang);

    //this.initDateTime();
  }

  ngOnInit() {
    if (this.routerData) {
      const routerData = JSON.parse(this.routerData);
      this.pluginService.version = routerData.version;
      //routerData.install ? this.install() : this.run();
      this.run();
    }
  }

//   initDateTime() {
//     const hours = [
//       0,
//       1,
//       2,
//       3,
//       4,
//       5,
//       6,
//       7,
//       8,
//       9,
//       10,
//       11,
//       12,
//       13,
//       14,
//       15,
//       16,
//       17,
//       18,
//       19,
//       20,
//       21,
//       22,
//       23,
//     ];
//     const days = [
//       { Key: "Sunday", Value: "SUN" },
//       { Key: "Monday", Value: "MON" },
//       { Key: "Tuesday", Value: "TUE" },
//       { Key: "Wednesday", Value: "WED" },
//       { Key: "Thursday", Value: "THU" },
//       { Key: "Friday", Value: "FRI" },
//       { Key: "Saturday", Value: "SAT" },
//     ];
//     hours.forEach((hour) => {
//       const hour24 = hour.toString().length > 1 ? hour : "0" + hour;
//       this.timeOptions.push({
//         Key: "" + hour24 + ":00",
//         Value: "" + hour24 + ":00",
//       });
//     });
//     days.forEach((day) =>
//       this.dayOptions.push({ Key: "" + day + "", Value: "" + day + "" })
//     );
//   }

//   install() {
//     this.installing = true;
//     this.addEditorsForAddon();
//   }

//   pepperiSelectOnInit(
//     compRef: ComponentRef<any>,
//     inputs,
//     outputs,
//     key,
//     label,
//     options
//   ) {
//     const self = this;
//     const index = this.getSelectedOptionIndex(key);
//     this[inputs] = {
//       key,
//       label,
//       rowSpan: "3",
//       xAlignment: "1",
//       options,
//       emptyOption: false,
//       value: options[index],
//     };
//     this[outputs] = {
//       elementClicked: (event) => self.onElementClicked(event),
//       valueChanged: (event) => self.onValueChanged(event),
//     };
//     // this.pepperiSelectOutputs = {
//     // elementClicked: (event) => self.onElementClicked(event),
//     // valueChanged: (event) => self.onValueChanged(event)
//     // };
//   }

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

//   pepperiFieldOnInit(
//     compRef: ComponentRef<any>,
//     inputs,
//     outputs,
//     key,
//     label = ""
//   ) {
//     const self = this;
//     this[inputs] = {
//       key,
//       label,
//       rowSpan: "3",
//       xAlignment: "1",
//       value: 24,
//     };
//     this[outputs] = {
//       elementClicked: (event) => self.onElementClicked(event),
//       valueChanged: (event) => self.onValueChanged(event),
//     };
//   }

//   pepperiListOnInit(compRef: ComponentRef<any>) {
//     const self = this;
//     this.pepperiListInputs = {
//       selectionTypeForActions: 1,
//       firstFieldAsLink: false,
//       listType: "code_jobs",
//       supportSorting: true,
//       noDataFoundMsg: "No Data Found",
//       parentScroll: this.genericCont.nativeElement,
//     };
//     this.pepperiListOutputs = {
//       notifyListChanged: (event) => self.onListChange(event),
//       notifySortingChanged: (event) => self.onListSortingChange(event),
//       notifyFieldClicked: (event) => self.onCustomizeFieldClick(event),
//       notifySelectedItemsChanged: (event) => self.selectedRowsChanged(event),
//     };
//   }

//   topBarOnInit(compRef: ComponentRef<any>) {
//     const self = this;
//     const topBarInstance = compRef.instance;
//     const topLeftButtons = [];
//     const topRightButtons = [];
//     self.listActions = self.getListActions();
//     // if (topLeftButtons.length === 0) {
//     //     // const btn = new TopBarButton('', () => self.goBack(), 'system-edit', ICON_POSITION.End, true, 'editButton', 'strong');
//     //     const titleBtn = new TopBarButton('Object type history', null, '', ICON_POSITION.End, true, 'titleButton', 'titleButton');
//     //     // topLeftButtons.push(btn);
//     //     topLeftButtons.push(titleBtn);
//     //    }
//     if (topRightButtons.length === 0) {
//       const btn = new TopBarButton(
//         self.translate.instant("Archive_AddType"),
//         () => self.openTypeDialog("add"),
//         "number-plus",
//         ICON_POSITION.End,
//         true,
//         "addButton",
//         "strong"
//       );
//       topRightButtons.push(btn);
//     }
//     self.topBarInputs = {
//       showSearch: false,
//       selectedList: "",
//       // jsonDateFilter: this.jsonDateFilter,
//       listActionsData: self.listActions,
//       leftButtons: topLeftButtons,
//       rightButtons: topRightButtons,
//       showTotals: false,
//       showSideLayout: false,
//       showListActions: false,
//       topbarTitle: self.translate.instant("Archive_TypesTableTitle"),
//       standalone: true,
//     };

//     self.topBarOutputs = {
//       actionClicked: (event) => self.onActionClicked(event),
//       // jsonDateFilterChanged: self.onJsonDateFilterChanged(event),
//       searchStringChanged: self.searchChanged(event),
//     };
//   }

//   goBack() {}

//   getListActions(): Array<ListActionsItem> {
//     let action: ListActionsItem;
//     const retVal = new Array<ListActionsItem>();

//     action = new ListActionsItem("edit", "Edit", false);
//     retVal.push(action);
//     action = new ListActionsItem("delete", "Delete", false);
//     retVal.push(action);

//     return retVal;
//   }

  onActionClicked(event) {
      const self = this;
    switch (event.ApiName) {
      case "Add": {
        self.openTypeDialog(event.ApiName, event.SelectedItem);
          break;
      }
      case "Edit": {
          if(event.SelectedItem && self.activityTypes.find(item => event.SelectedItem.ActivityType.Key == item.Key)) {
            self.openTypeDialog(event.ApiName, event.SelectedItem);
          }
          else {
            const title = self.translate.instant('Archive_MissingActivityModal_Title');
            const content = self.translate.instant('Archive_MissingActivityModal_Paragraph', {Type: event.SelectedItem.ActivityType.Value});
            const buttons = [{
                title: self.translate.instant("Archive_Confirm"),
                callback: res => { 
                    self.deleteType(event.SelectedItem);
                },
                className: "",
                icon: null
            }]
            self.pluginService.openTextDialog(title, content, buttons);
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
    if(this.disablePublish) {
        const title = this.translate.instant('Archive_InvalidFormModal_Title');
        const content = this.translate.instant('Archive_InvalidFormModal_Paragraph');
        const buttons = [{
            title: this.translate.instant("Archive_Confirm"),
            callback: res => { 
            },
            className: "",
            icon: null
        }]
        this.pluginService.openTextDialog(title, content, buttons);
    }
    else {
        switch (event.apiName) {
            case 'Report': {
                
                this.latestReport = undefined;
                this.generateReport();
                break;
            }
            // case 'Audit': {
            //     this.router.navigate([
            //         this.schedulerURL
            //     ], {
            //         queryParams: {
            //             view: 'audit',
            //             job_id: this.additionalData.CodeJobUUID
            //         }
            //     });
            //     break;
            // }
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
        if(token) {
            const title = this.translate.instant('Archive_ReportModal_Title');
            const content = this.translate.instant('Archive_ReportModal_Paragraph');
            const buttons = [{
                title: this.translate.instant("Archive_Confirm"),
                callback: res => { 
                },
                className: "",
                icon: null
            }]
            this.pluginService.openTextDialog(title, content, buttons);
            let interval = window.setInterval(() => {
                this.pluginService.getExecutionLog(token).then(logRes => {
                    // this.pluginService.userService.userServiceDialogRef
                    // ? this.pluginService.userService.userServiceDialogRef
                    //         .afterClosed()
                    //         .subscribe(result => {
                    //             window.clearInterval(interval);
                    //         })
                    //     : null;
                    if (logRes && logRes.Status && logRes.Status.Name !== 'InProgress') {
                        window.clearInterval(interval);
                        const resultObj = JSON.parse(logRes.AuditInfo.ResultObject);
                        if(resultObj.Success == true) {
                            self.latestReport = resultObj.resultObject.map(item=> {
                                return {
                                    ActivityType: item.ActivityType.Value,
                                    BeforeCount: item.BeforeCount,
                                    ArchiveCount: item.ArchiveCount,
                                    AfterCount: item.AfterCount
                                }
                            });
                            console.log('latest report is:', self.latestReport);
                            if(self.pluginService.userService.userServiceDialogRef.componentInstance) {
                                self.pluginService.userService.userServiceDialogRef.close();
                                self.viewReport();
                            }
                        }
                    }
                });
            },1500);
        }
    }

    viewReport() {
        const self = this;
        self.pluginService.openDialog(
            this.translate.instant('Archive_ReportModal_Title'),
            ReportDialogComponent,
            [],
            {
                svgIcons: self.pluginService.userService.svgIcons,
                reportRows: self.latestReport
            },
            (data) => {
                // callback from dialog with input data
            }
        );
    }

    showRunMessage() {
        const title = this.translate.instant('Archive_ExecuteModal_Title');
        const content = this.translate.instant('Archive_ExecuteModal_Paragraph');
        const buttons = [{
            title: this.translate.instant("Archive_Confirm"),
            callback: res => {
                this.runJob();
            },
            className: "",
            icon: null
        },
        {
            title: this.translate.instant("Archive_Cancel"),
            callback: res => {
            },
            className: "",
            icon: null
        }]
        this.pluginService.openTextDialog(title, content, buttons);
    }

    async runJob() {
        this.additionalData.ScheduledTypes = [...this.additionalData.ScheduledTypes_Draft];
        this.additionalData.DefaultNumofMonths = this.defaultNumOfMonths;
        await this.pluginService.updateAdditionalData(this.additionalData);
        this.pluginService.papiClient.codeJobs.async().uuid(this.additionalData.CodeJobUUID).execute().then(value => {
            const executionLogLink = `${this.schedulerURL}?view=executions&execution_id=${value.ExecutionUUID}&job_id=${this.additionalData.CodeJobUUID}`;
            const title = this.translate.instant('Archive_ExecuteModal_Title');
            const content = this.translate.instant('Archive_ExecutingModal_Paragraph', {
                ExecutionLogLink: executionLogLink
            });
            const buttons = [{
                title: this.translate.instant("Archive_Close"),
                callback: res => {                    
                },
                className: "",
                icon: null
            }]
            this.pluginService.openTextDialog(title, content, buttons);
        });
    }

  // Updates plugin's metadata in pluginEmits event to webapp's settings menu,
  // Refresh the settings component and navigates to tools-setup
//   addEditorsForAddon() {
//     const self = this;
//     const systemData = { Version: null, Editors: null };
//     systemData.Version = "v1.0";
//     systemData.Editors = [
//       {
//         ParentPackageName: "Company Profile",
//         PackageName: "archive",
//         Description: "Data Retention",
//       },
//       {
//         ParentPackageName: "Company Profile",
//         PackageName: "archive",
//         Description: "Data Retrieve",
//       },
//     ];

//     // Update installed add-on in webapp
//     let body = {
//       Addon: { UUID: this.pluginService.pluginUUID },
//       SystemData: JSON.stringify(systemData),
//     };

//     this.pluginService.updateSystemData(body, (res) => {
//       self.addEditors.emit();
//     });
//   }

  async run() {
    // Implement: Run plugin (onInit)
    const self = this;
    this.getActivityTypes();
    this.additionalData = await this.pluginService.getAdditionalData();
    this.defaultNumOfMonths = this.additionalData.DefaultNumofMonths_Draft;
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

    this.translate.get([
        'Archive_Menu_Report',
        'Archive_Menu_Execution',
        'Archive_Menu_Audit',
        'Archive_Menu_RunNow'
    ]).subscribe(texts => {
        self.menuOptions = [
            {Key:'Report', Value:texts['Archive_Menu_Report'], disabled: this.disablePublish},
            {Key:'Executions', Value:texts['Archive_Menu_Execution']},
//            {Key:'Audit', Value:texts['Archive_Menu_Audit']},
            {Key:'Run', Value:texts['Archive_Menu_RunNow']},
        ]
    })
  }

    async publishPlugin() {
        const cronExpression = '0 ' + this.selectedHour + ' * * ' + this.selectedDay
        this.additionalData.ScheduledTypes = [...this.additionalData.ScheduledTypes_Draft];
        this.additionalData.DefaultNumofMonths = this.defaultNumOfMonths;
        try {
            await this.pluginService.papiClient.codeJobs.upsert({
                UUID: this.codeJob.UUID,
                CodeJobName: this.codeJob.CodeJobName,
                CronExpression: cronExpression
            });
            await this.pluginService.updateAdditionalData(this.additionalData);
            const actionButton = {
                title: this.translate.instant("Archive_Confirm"),
                callback: res => {
                },
                className: "",
                icon: null
            };
            const title = this.translate.instant("Archive_PublishModal_Title");
            const content = this.translate.instant("Archive_PublishModal_Success");
            this.pluginService.openTextDialog(title, content, [actionButton]);
        }
        catch(error) {
            const actionButton = {
                title: this.translate.instant("Archive_Confirm"),
                callback: res => {
                },
                className: "",
                icon: null
            };
            const title = this.translate.instant("Archive_PublishModal_Title");
            const content = this.translate.instant("Archive_PublishModal_Failure", {
                 message : ('message' in error) ? error.message : 'Unknown error occured'
            });
            this.pluginService.openTextDialog(title, content, [actionButton]);
        }
    // Implement: save UI data
  }

  openTypeDialog(operation, selectedObj = undefined) {
    const self = this;
    const types = self.additionalData.ScheduledTypes_Draft ? self.activityTypes.filter((item) => {
        return self.additionalData.ScheduledTypes_Draft.findIndex(type => type.ActivityType.Key == item.Key) == -1 || (selectedObj ? selectedObj.ActivityType.Key == item.Key : false)
    }) : self.activityTypes;
    self.pluginService.openDialog(
        operation == 'Add' ? this.translate.instant('Archive_TypesModalTitle_Add') : this.translate.instant('Archive_TypesModalTitle_Update'),
      AddTypeDialogComponent,
      [],
      {
        //svgIcons: self.pluginService.addonService.getSvgIcons(),
        svgIcons: self.pluginService.userService.svgIcons,
        activityTypes: types,
        selectedType: selectedObj,
        maxHistory: self.additionalData.DefaultNumofMonths_Draft
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
        if(type) {
            this.additionalData.ScheduledTypes_Draft.push(
                new ScheduledType(type.Key, type.Value, data.numOfMonths, data.minItems)
            );
        }
    }
    this.pluginService.updateAdditionalData(this.additionalData);
    this.typesList ? this.typesList.reload(): null;
  }

//   updateScheduledList(additionalData): any {
//     const self = this;
//     this.pluginService.updateAdditionalData(
//       additionalData,
//       (res) => {
//         return res.ScheduledType;
//       },
//       null
//     );
//   }

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
        const actionButton = [{
        title: this.translate.instant("Archive_Confirm"),
        callback: res => {
            self.deleteType(selectedObj);
        },
        className: "",
        icon: null
      },
      {
        title: this.translate.instant("Archive_Cancel"),
        callback: res => {
            
        },
        className: "",
        icon: null
      }];
      const title = this.translate.instant("Archive_DeleteModal_Title");
      const content = this.translate.instant("Archive_DeleteModal_Paragraph");
      this.pluginService.openTextDialog(title, content, actionButton);
      //this.pluginService.openDialog(data);
        
    // if (this.selection.selected.length > 0) {
    //     this.scheduledList = this.scheduledList
    //         .filter(scheduledType => scheduledType.ActivityType.Key !== this.selection.selected[0].ActivityType.Key);
    //     this.dataSource = new MatTableDataSource(this.scheduledList);
    // }
  }

  deleteType(selectedObj) {
    if(selectedObj) {
        const index = this.additionalData.ScheduledTypes_Draft.findIndex(item => item.ActivityType.Key == selectedObj.ActivityType.Key);
        index > -1 ? this.additionalData.ScheduledTypes_Draft.splice(index, 1) : null;
        this.pluginService.updateAdditionalData(this.additionalData);
        this.typesList? this.typesList.reload(): null;
    }
  }

//   loadlist() {
//     if (this.additionalData && this.additionalData.ScheduledTypes) {
//       const tableData = new Array<PepperiRowData>();
//       this.additionalData.ScheduledTypes.forEach((scheduledType) => {
//         tableData.push(
//           this.convertScheduledTypeToPepperiRowData(scheduledType)
//         );
//       });
//       const pepperiListObj = this.pluginService.pepperiDataConverter.convertListData(
//         tableData
//       );
//       // this.totalRows = res.TotalRows;
//       const buffer = [];
//       if (pepperiListObj.Rows) {
//         pepperiListObj.Rows.forEach((row) => {
//           const osd = new ObjectSingleData(pepperiListObj.UIControl, row);
//           osd.IsEditable = false;
//           buffer.push(osd);
//         });
//       }
//       this.pepperiListComp.componentRef.instance.initListData(
//         pepperiListObj.UIControl,
//         buffer.length,
//         buffer,
//         VIEW_TYPE.Table,
//         "",
//         true
//       );
//     }
//   }

//   convertScheduledTypeToPepperiRowData(scheduledType: ScheduledType) {
//     const row = new PepperiRowData();
//     row.Fields = [];
//     Object.keys(scheduledType).forEach((key) => {
//       row.Fields.push({
//         ApiName: key,
//         FormattedValue:
//           key === "ActivityType"
//             ? scheduledType[key].Value.toString()
//             : scheduledType[key].toString(),
//         Value:
//           key === "ActivityType"
//             ? scheduledType[key].Key.toString()
//             : scheduledType[key].toString(),
//         FieldType: FIELD_TYPE.TextBox,
//         ColumnWidth: 1,
//         XAlignment: 1,
//         Title: key,
//       });
//     });
//     return row;
//   }

//   convertPepperiRowDataToScheduledType(row: PepperiRowData) {
//     const ActivityType = {};
//     let NumOfMonths;
//     let MinItems;
//     row.Data.Fields.forEach((field) => {
//       if (field.ApiName === "ActivityType") {
//         ActivityType["Key"] = field.FormattedValue.toString();
//         ActivityType["Value"] = field.Value.toString();
//       }
//       field.ApiName === "NumOfMonths" ? (NumOfMonths = field.Value) : null;
//       field.ApiName === "MinItems" ? (MinItems = field.Value) : null;
//     });
//     return new ScheduledType(
//       ActivityType["Key"].toString(),
//       ActivityType["Value"].toString(),
//       NumOfMonths,
//       MinItems
//     );
//   }

  ngOnDestroy() {}

  valueChanged($event) {
    if($event && $event > 0 && $event < 25) {
        this.additionalData.DefaultNumofMonths_Draft = $event;
        this.pluginService.updateAdditionalData(this.additionalData);
    }
  }
}
