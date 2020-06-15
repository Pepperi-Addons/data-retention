import { PluginService } from './plugin.service';
import { ScheduledType, AdditionalData } from './plugin.model';
import { debug } from 'util';
// @ts-ignore
import { UserService } from 'pepperi-user-service';
import { Component, EventEmitter, Input, Output, OnInit, ViewEncapsulation,
    Compiler, ViewChild, ComponentRef, ElementRef, OnDestroy, Inject  } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
// @ts-ignore
// import { SharedModule } from 'pepperi-shared';
// // @ts-ignore
// import { PepperiTextareaComponent} from 'pepperi-textarea';
// @ts-ignore
import { PepperiImageComponent} from 'pepperi-image';
// @ts-ignore
import { PepperiSelectComponent} from 'pepperi-select';
// @ts-ignore
import { PepperiTextboxComponent} from 'pepperi-textbox';
// @ts-ignore
import { PepperiListComponent, VIEW_TYPE } from 'pepperi-custom-list';
// @ts-ignore
import { TopBarComponent, TopBarButton, ICON_POSITION  } from 'pepperi-top-bar';
// @ts-ignore
import { ListActionsItem } from 'pepperi-list-actions';
import { DynamicComponent } from 'ng-dynamic-component';
// @ts-ignore
import { DialogDataType } from 'pepperi-dialog';
// @ts-ignore
import { PepperiRowData, PepperiFieldData, FIELD_TYPE } from 'pepperi-main-service';
import { AddTypeDialogComponent } from './dialogs/add-type-dialog/add-type-dialog.component';
import { DataSource, SelectionModel } from '@angular/cdk/collections';

import { MatTableDataSource } from '@angular/material';
// @ts-ignore
import { ObjectSingleData, PepperiRowData } from 'pepperi-main-service';


@Component({
  selector: "plugin",
  templateUrl: "./plugin.component.html",
  styleUrls: ["./plugin.component.scss"],
  providers: [ PluginService ],
  // To override parent component styling
  encapsulation: ViewEncapsulation.None
})
export class PluginComponent implements OnInit, OnDestroy {

  installing = false;
  showReset = false;
  panelOpenState = false;
  icon = false;
  toggleArrow = false;
  scheduledListColumns = ['Selection', 'Value', 'NumOfMonths', 'MinItems'];
  additionalData: AdditionalData;
  activityTypes = [];
  dataSource: MatTableDataSource<any>;
  scheduledList = [];
  //selection = new SelectionModel<ScheduledType>(false, []);
  listActions = [];
  // Data sent from webapp
  @Input() queryParams: any;
  @Input() routerData: any;

  // Events emitters to webapp
  @Output() addEditors: EventEmitter<any> = new EventEmitter<any>();
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  pepperiSelect = PepperiSelectComponent;

  @ViewChild("pepperiSelectTimeComp", { static: false }) pepperiSelectTimeComp: DynamicComponent;
  pepperiSelectTimeInputs;
  pepperiSelectTimeOutputs;
  timeOptions = [];

  @ViewChild("pepperiSelectDayComp", { static: false }) pepperiSelectDayComp: DynamicComponent;
  pepperiSelectDayInputs;
  pepperiSelectDayOutputs;
  dayOptions = [];

  pepperiInput = PepperiTextboxComponent;

  @ViewChild("pepperiInputComp", { static: false }) pepperiInputComp: DynamicComponent;
  pepperiInputInputs;
  pepperiInputOutputs;

  @ViewChild("genericCont", { static: false }) genericCont: ElementRef;
  @ViewChild("pepperiListComp", { static: false }) pepperiListComp: DynamicComponent;

  pepperiList = PepperiListComponent;
  pepperiListInputs;
  pepperiListOutputs;

  @ViewChild("topBarComp", { static: false }) topBarComp: DynamicComponent;

  topBar = TopBarComponent;
  topBarInputs;
  topBarOutputs;


  constructor(
    public pluginService: PluginService
    , private translate: TranslateService
    , public routeParams: ActivatedRoute
    , public router: Router
    , public compiler: Compiler
    ) {
    const self = this;
    
    // Parameters sent from url
    this.routeParams.params.subscribe(params => {
      self.pluginService.pluginUUID = params.pluginID;
    });
    // Parameters sent from query url (?)
    this.routeParams.queryParams.subscribe(queryParams => {
      self.showReset = queryParams.showReset;
    });

    let userLang = 'en';
    translate.setDefaultLang(userLang);
    userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available
    translate.use(userLang);


    this.initDateTime();

  }

  ngOnInit() {
    if (this.routerData) {
      const routerData = JSON.parse(this.routerData);
      this.pluginService.version = routerData.version;
      routerData.install ? this.install() : this.run();

    }

  }

  initDateTime() {
    const hours = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    hours.forEach( hour => {
      const hour24 = hour.toString().length > 1 ? hour : '0' + hour;
      this.timeOptions.push({ 'Key': '' + hour24 + ':00', 'Value': '' + hour24 + ':00' });
    });
    days.forEach( day => this.dayOptions.push({ 'Key': '' + day + '', 'Value': '' + day + '' }));
  }

  install() {
    this.installing = true;
    this.addEditorsForAddon();
  }

  pepperiSelectOnInit(compRef: ComponentRef<any>, inputs, outputs, key, label, options) {
    const self = this;
    this[inputs] = {
		key,
		label,
        rowSpan: '3',
        xAlignment: '1',
        options,
        emptyOption: false,
        value: options[0]
	    };
	   this[outputs] = {
        elementClicked: (event) => self.onElementClicked(event),
        valueChanged: (event) => self.onValueChanged(event)
        };

        // this.pepperiSelectOutputs = {
        // elementClicked: (event) => self.onElementClicked(event),
        // valueChanged: (event) => self.onValueChanged(event)
	    // };
  }

  pepperiFieldOnInit(compRef: ComponentRef<any>, inputs, outputs, key, label = '' ) {
    const self = this;
    this[inputs] = {
        key,
        label,
        rowSpan: '3',
        xAlignment: '1'
    };
    this[outputs] = {
        elementClicked: (event) => self.onElementClicked(event),
        valueChanged: (event) => self.onValueChanged(event)
        };
  }

  pepperiListOnInit(compRef: ComponentRef<any>) {
    const self = this;
    this.pepperiListInputs = {
      selectionTypeForActions: 1,
      firstFieldAsLink: false,
      listType: "code_jobs",
      supportSorting: true,
      noDataFoundMsg: 'No Data Found',
      parentScroll: this.genericCont.nativeElement
    };
    this.pepperiListOutputs = {
      notifyListChanged: (event) => self.onListChange(event),
      notifySortingChanged: (event) => self.onListSortingChange(event),
      notifyFieldClicked: (event) => self.onCustomizeFieldClick(event),
      notifySelectedItemsChanged: (event) => self.selectedRowsChanged(event),

    };
    this.loadlist();
  }

  topBarOnInit(compRef: ComponentRef<any>) {
    const self = this;
    const topBarInstance = compRef.instance;
    const topLeftButtons = [];
    const topRightButtons = [];
    self.listActions = self.getListActions();
    if (topLeftButtons.length === 0) {
        // const btn = new TopBarButton('', () => self.goBack(), 'system-edit', ICON_POSITION.End, true, 'editButton', 'strong');
        const titleBtn = new TopBarButton('Object type history', null, '', ICON_POSITION.End, true, 'titleButton', 'titleButton');
        // topLeftButtons.push(btn);
        topLeftButtons.push(titleBtn);
       }
    if (topRightButtons.length === 0) {
        const btn = new TopBarButton(self.translate.instant('Archive_Addon_AddType'), () => self.openTypeDialog('add'), 'number-plus', ICON_POSITION.End, true, 'addButton', 'strong');
        topRightButtons.push(btn);
    }
    self.topBarInputs = {
      showSearch: false,
      selectedList: '',
      // jsonDateFilter: this.jsonDateFilter,
      listActionsData: self.listActions,
      leftButtons: topLeftButtons,
      rightButtons: topRightButtons,
      showTotals: false,
      showListActions: true,
      showSideLayout: false,
      standalone: true
    };

    self.topBarOutputs = {
        actionClicked: (event) => self.onActionClicked(event),
        // jsonDateFilterChanged: self.onJsonDateFilterChanged(event),
        searchStringChanged: self.searchChanged(event)

    };
  }


  goBack() {}

  getListActions(): Array<ListActionsItem> {
		let action: ListActionsItem;
		const retVal = new Array<ListActionsItem>();

		action = new ListActionsItem("execute", "Execute Current Job", false);
		retVal.push(action);
		action = new ListActionsItem("edit", "Edit", false);
		retVal.push(action);
		action = new ListActionsItem("executionLog", "View Executions log", false);
		retVal.push(action);
		action = new ListActionsItem("audit", "Audit log", false);
		retVal.push(action);
		action = new ListActionsItem("deleteObj", "Delete", false);
		retVal.push(action);


		return retVal;
	}

  searchChanged(e) {

  }

  onActionClicked(event) {
    switch (event.ApiName) {
        case 'edit': {
            this.openTypeDialog(event.ApiName);
            break;
        }
        default: {
            alert('not supported');
        }
    }
  }

  onListChange(e) {
  }

  onListSortingChange(e) {
  }

  onCustomizeFieldClick(e) {
  }

  selectedRowsChanged(e) {

  }

  onValueChanged(e) {
    // debugger;
  }

  onElementClicked(e) {
    // debugger;
  }

  // Updates plugin's metadata in pluginEmits event to webapp's settings menu,
  // Refresh the settings component and navigates to tools-setup
  addEditorsForAddon() {
    const self = this;
    const systemData = {'Version':null,'Editors':null};
    systemData.Version = 'v1.0';
    systemData.Editors = [
      { ParentPackageName: 'Company Profile', PackageName: 'archive', Description: 'Data Retention' },
      { ParentPackageName: 'Company Profile', PackageName: 'archive', Description: 'Data Retrieve' },
    ];

    // Update installed add-on in webapp
    let body = {
        Addon: { UUID: this.pluginService.pluginUUID },
        SystemData: JSON.stringify(systemData)
    };

    this.pluginService.updateSystemData(body, res => {
      self.addEditors.emit();
    });

  }

  run() {
    // Implement: Run plugin (onInit)
    this.getScheduledList();
    this.getActivityTypes();
  }

  tabClick($event) {
    // Implement: Tab navigate function
  }

  resetPlugin() {
    // Implement: reset all saved UI data
  }

  openTypeDialog(operation) {
    let selectedType;
    if (operation == 'add') {

    } else if (operation == 'edit') {
        const rowUUID = this.pepperiListComp.componentRef.instance.selectedItemId.split(',')[0];
        const rows = this.pepperiListComp.componentRef.instance.items;
        const rowIndex = rows.findIndex( row => row.Data.UID === rowUUID);
        const selectedRow = rows[rowIndex];
        selectedType = this.convertPepperiRowDataToScheduledType(selectedRow);
    }

    const self = this;
    const title = self.translate.instant('Scheduler_Publish');
    const content = self.translate.instant('Scheduler_Publish_Paragraph');

    self.pluginService.openDialog('Add Activity', AddTypeDialogComponent, [],
    {
        'svgIcons': self.pluginService.userService.svgIcons,
        'activityTypes': self.activityTypes,
        'selectedType': selectedType
    },
    (data) => {
        // callback from dialog with input data
        if (data) {
            this.typeCallback(data, selectedType);
        }
    });
  }


  typeCallback(data, selectedType) {
            const update = this.scheduledList
                .filter(type => data.selectedType && type.ActivityType.Key == data.selectedType.Key ).length == 0;
            if (selectedType) {
              const index = this.scheduledList.findIndex( type => type.Key === data.selectedType.Key);
              this.scheduledList[index] =  data.selectedType ;
            } else if (update) {
              this.scheduledList.push(new ScheduledType(data.selectedType.Key, data.selectedType.Value, data.maxHistory, data.minItems ));
              this.dataSource = new MatTableDataSource(this.scheduledList);
            }
  }

  getScheduledList(): any {
      const self = this;
    //   this.pluginService.getAdditionalData( res =>{
    //     if (res){
    //         return res;
    //     }
    //   }, null);
    // this.loadlist();


  }

  updateScheduledList(additionalData): any {
    const self = this;
    this.pluginService.updateAdditionalData(additionalData,  res => {
      return res.ScheduledType;
    }, null);
  }

  getActivityTypes() {
    this.pluginService.getActivityTypes( types => {
        if (types) {
            types.forEach(type =>
                this.activityTypes.push({ Key: type.TypeID.toString(), Value: type.ExternalID })
            );
        }
    });

  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    // const numSelected = this.selection.selected.length;
    // const numRows = this.dataSource.data.length;
    // return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    // this.isAllSelected() ?
    //     this.selection.clear() :
    //     this.dataSource.data.forEach(row => this.selection.select(row));
  }

  editType() {

  }

  deleteType() {
    // if (this.selection.selected.length > 0) {
    //     this.scheduledList = this.scheduledList
    //         .filter(scheduledType => scheduledType.ActivityType.Key !== this.selection.selected[0].ActivityType.Key);
    //     this.dataSource = new MatTableDataSource(this.scheduledList);
    // }
  }


  loadlist() {
        this.pluginService.getAdditionalData( (res: AdditionalData) => {
            if (res) {
                const tableData = new Array<PepperiRowData>();
                res.ScheduledTypes.forEach(scheduledType => {
                    tableData.push(this.convertScheduledTypeToPepperiRowData(scheduledType));
                });
                const pepperiListObj = this.pluginService.pepperiDataConverter.convertListData(tableData);
                // this.totalRows = res.TotalRows;
                const buffer = [];
                if (pepperiListObj.Rows) {
                  pepperiListObj.Rows.forEach( row => {
                    const osd = new ObjectSingleData(pepperiListObj.UIControl, row);
                    osd.IsEditable = false;
                    buffer.push(osd);
                  });
                }
                this.pepperiListComp.componentRef.instance.initListData(pepperiListObj.UIControl, buffer.length, buffer, VIEW_TYPE.Table, '', true);
            }
        }, null);
  }


  convertScheduledTypeToPepperiRowData(scheduledType: ScheduledType) {
    const row = new PepperiRowData();
    row.Fields = [];
    Object.keys(scheduledType).forEach(key => {
        row.Fields.push(
            {
                ApiName: key,
                FormattedValue: key === 'ActivityType' ? scheduledType[key].Value.toString() : scheduledType[key].toString(),
                Value: key === 'ActivityType' ? scheduledType[key].Key.toString() : scheduledType[key].toString(),
                FieldType: FIELD_TYPE.TextBox,
                ColumnWidth: 1,
                XAlignment: 1,
                Title: key
            });
     });
    return row;
  }

  convertPepperiRowDataToScheduledType(row: PepperiRowData) {
        const ActivityType = {};
        let NumOfMonths;
        let MinItems;
        row.Data.Fields.forEach(field => {
            if (field.ApiName === 'ActivityType') {
                ActivityType['Key'] = field.FormattedValue.toString();
                ActivityType['Value'] = field.Value.toString();
            }
            field.ApiName === 'NumOfMonths' ? NumOfMonths = field.Value : null;
            field.ApiName === 'MinItems' ? MinItems = field.Value : null;
        });
        return new ScheduledType(ActivityType['Key'].toString(), ActivityType['Value'].toString(), NumOfMonths, MinItems);
  }

  ngOnDestroy() {
    
  }
  
}
