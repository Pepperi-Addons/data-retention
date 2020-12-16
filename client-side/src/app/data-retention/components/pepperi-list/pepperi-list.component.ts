import { Component, OnInit, Input,  ComponentRef, ViewChild, ChangeDetectorRef, ElementRef, Output, EventEmitter } from '@angular/core';
import { DataRetentionService } from './../../data-retention.service';

import {  } from '@pepperi-addons/ngx-lib/top-bar'
import { PepListComponent, PepListViewType } from '@pepperi-addons/ngx-lib/list';
import { ObjectsData, ObjectsDataRow, ObjectSingleData, PepRowData, UIControl } from '@pepperi-addons/ngx-lib/';
// import { TopBarComponent, TopBarButton, ICON_POSITION } from 'pepperi-top-bar';
// import { ListActionsItem } from 'pepperi-list-actions';
// import { JsonFilter } from 'pepperi-json-filter';
import { TranslateService } from '@ngx-translate/core';

import { GridDataView, DataViewFieldTypes } from '@pepperi-addons/papi-sdk'
import { PluginJsonFilter } from 'src/app/data-retention/data-retention.model';
import { PepMenuItem } from '@pepperi-addons/ngx-lib/menu';


export interface PepperiListService {
  getDataView(translates): GridDataView;
  getList(): Promise<any[]>;
  getActions(): {
    Key: string;
    Title: string;
    Filter: (obj: any) => boolean;
    Action: (obj: any) => void;
  }[];
  rightButtons?(): {
    Title: string;
    Icon: string;
    Action: () => void;
  }[];
}

@Component({
  selector: 'app-pep-list',
  templateUrl: './pepperi-list.component.html',
  styleUrls: ['./pepperi-list.component.scss'],
  providers: [ DataRetentionService ]
})
export class PepperiListContComponent implements OnInit {


//   @ViewChild('pepperiListCont', { static: false })
//   pepperiListCont: ElementRef;
//   @ViewChild('pepperiListComp', { static: false })
//   pepperiListComp: DynamicComponent;
//   @ViewChild('topBarComp', { static: false }) 
//   topBarComp: DynamicComponent;

@ViewChild(PepListComponent) pepperiListComp: PepListComponent;

    @Output() notifyAddButtonClicked: EventEmitter<any> = new EventEmitter<any>();


  @Input() 
  service: PepperiListService;

  list: any[]

//   pepperiListComponent = PepperiListComponent;
//   pepperiListInputs;
//   pepperiListOutputs;
//   topBarComponent = TopBarComponent;
//   topBarInputs;
//   topBarOutputs;

  listActions: Array<PepMenuItem> = []
  currentList = {ListType: '', ListCustomizationParams: '', ListTabName: '',  ListFilterStr: ''};

  totalRows = 0;
  listFilter: PluginJsonFilter;
  searchString = '';
  updateAvailable = false;
  @Input() apiEndpoint = '';

  constructor(
    public pluginService: DataRetentionService,
    public cd: ChangeDetectorRef,
    public translate: TranslateService,
  ) {

    let userLang = 'en';
    translate.setDefaultLang(userLang);
    userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available
    translate.use(userLang);

  }

  ngOnInit(): void {
      this.loadlist()
  }

  onListChange(event) {

  }

  onListSortingChange(event) {
  }

  onCustomizeFieldClick(event) {
    // debugger;
  }

  selectedRowsChanged(selectedRowsCount) {
    const selectData = this.pepperiListComp.getSelectedItemsData(true);
    let rowData: ObjectsDataRow;
    if (selectData && selectData.rows && selectData.rows[0] !== '' && selectData.rows.length == 1) {
      const uid = selectData.rows[0];
      rowData = this.pepperiListComp.getItemDataByID(uid);
    }

    this.listActions = selectedRowsCount > 0 ? this.getListActions(rowData) : null;

    //this.cd.detectChanges();
  }

  getListActions(rowData = null): Array<PepMenuItem> {
    let obj = rowData ? this.list.find(item => item.UUID === rowData.UID) : undefined;
    return this.service.getActions().filter(action => action.Filter(obj)).map(action => {
      return new PepMenuItem({key: action.Key, title: action.Title});
    })
  }

  getValue(object: any, apiName: string): string {
    if (!apiName) {
        return '';
    }

    if (typeof object !== 'object') {
        return '';
    }

    // support regular APINames & dot anotation
    if (apiName in object && object[apiName]) {
        return object[apiName].toString();
    }

    // support nested object & arrays
    const arr = apiName.split('.');
    return this.getValue(object[arr[0]], arr.slice(1).join('.'));
  } 

  async loadlist() {
    this.translate.get([
        'Archive_TypesTable_Title', 
        'Archive_TypesTable_ActivityColumnTitle', 
        'Archive_TypesTable_MonthsColumnTitle',
        'Archive_TypesTable_ItemsColumnTitle',
        'Archive_AddType'
    ]).subscribe(async (translates) => {
        const dataView = this.service.getDataView(translates);
        this.list = await this.service.getList();
        const rows: PepRowData[] = this.list.map(x => {
        const res = new PepRowData();
        res.Fields = dataView.Fields.map((field, i) => {
            return {
            ApiName: field.FieldID,
            Title: field.Title,
            XAlignment: 1,
            FormattedValue: this.getValue(x, field.FieldID),
            Value:  this.getValue(x, field.FieldID),
            ColumnWidth: dataView.Columns[i].Width,
            AdditionalValue: '',
            OptionalValues: [],
            FieldType: DataViewFieldTypes[field.Type]
            }
        })
        return res;
        });

        let pepperiListObj = rows.length > 0 ? this.pluginService.pepperiDataConverter.convertListData(rows) : new ObjectsData();
        let uiControl = rows.length > 0 ? pepperiListObj.UIControl: new UIControl();
        let l = rows.length > 0 ? pepperiListObj.Rows.map((row, i) => {
            row.UID = this.list[i].UUID || row.UID;
            const osd = new ObjectSingleData(uiControl, row);
            osd.IsEditable = false;
            return osd;
        }) : [];
        
        // if (this.topBarComp) {
            //     this.listActions = this.getListActions(null, translates);
            //     this.topBarComp.componentRef.instance.listActionsData = null;
            //     this.topBarOnInit(this.topBarComp.componentRef);
            //   }
            this.pepperiListComp.initListData(uiControl, l.length, l, 'table', '', true);
    });
    }

  onActionClicked(event) {

    const selectData = this.pepperiListComp.getSelectedItemsData(true);
    if (selectData.rows.length == 1) {

      const uid = selectData.rows[0];
      const rowData = this.pepperiListComp.getItemDataByID( uid );
      const obj = rowData ? this.list.find(item => item.UUID === rowData.UID) : undefined;
      this.service.getActions().find(action => action.Key === event.source.key).Action(obj);
    }
  }

  public searchChanged(searchString: string) {
      this.searchString = searchString;
  }

  addButtonClicked() {
    this.notifyAddButtonClicked.emit();
  }
}
