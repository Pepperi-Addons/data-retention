import { Component, OnInit, Input,  ComponentRef, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { PluginService } from './../../plugin.service';
import { Subscription, SubscriptionLike } from 'rxjs';
import { DynamicComponent } from 'ng-dynamic-component';

// @ts-ignore
import { PepperiListComponent, VIEW_TYPE } from 'pepperi-custom-list';
// @ts-ignore
import { ObjectSingleData, PepperiRowData } from 'pepperi-main-service';
// @ts-ignore
import { TopBarComponent, TopBarButton, ICON_POSITION } from 'pepperi-top-bar';
// @ts-ignore
import { ListActionsItem } from 'pepperi-list-actions';
// @ts-ignore
import { JsonFilter } from 'pepperi-json-filter';
// @ts-ignore
import { PepperiTextareaComponent } from 'pepperi-textarea';
// @ts-ignore
import { TranslateService } from '@ngx-translate/core';

// @ts-ignore
import { __values } from 'tslib';

// @ts-ignore
import { GridDataView, DataViewFieldTypes } from '@pepperi-addons/papi-sdk'
import { PluginJsonFilter } from 'src/app/plugin.model';

export interface PepperiListService {
  getDataView(translates): GridDataView;
  getList(): Promise<any[]>;
  getActions(): {
    Key: string;
    Title: string;
    Filter: (obj: any) => boolean;
    Action: (obj: any) => void;
  }[];
  rightButtons?(translates): {
    Title: string;
    Icon: string;
    Action: () => void;
  }[];
}

@Component({
  selector: 'pep-list',
  templateUrl: './pepperi-list.component.html',
  styleUrls: ['./pepperi-list.component.scss'],
  providers: [ PluginService ]
})
export class PepperiListContComponent implements OnInit {


  @ViewChild('pepperiListCont', { static: false })
  pepperiListCont: ElementRef;
  @ViewChild('pepperiListComp', { static: false })
  pepperiListComp: DynamicComponent;
  @ViewChild('topBarComp', { static: false }) 
  topBarComp: DynamicComponent;

  @Input() 
  service: PepperiListService;

  list: any[]

  pepperiListComponent = PepperiListComponent;
  pepperiListInputs;
  pepperiListOutputs;
  topBarComponent = TopBarComponent;
  topBarInputs;
  topBarOutputs;

  listActions: Array<ListActionsItem> = null;
  currentList = {ListType: '', ListCustomizationParams: '', ListTabName: '',  ListFilterStr: ''};

  totalRows = 0;
  listFilter: PluginJsonFilter;
  jsonDateFilter: JsonFilter;
  searchString = '';
  updateAvailable = false;
  @Input() apiEndpoint = '';

  constructor(
    public pluginService: PluginService,
    public cd: ChangeDetectorRef,
    public translate: TranslateService,
  ) {

    let userLang = 'en';
    translate.setDefaultLang(userLang);
    userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available
    translate.use(userLang);

  }

  ngOnInit(): void {
  }

  pepperiListOnInit(compRef: ComponentRef<any>, apiEndpoint) {
    this.pepperiListInputs = {
      selectionTypeForActions: 1,
      firstFieldAsLink: false,
      listType: '',
      supportSorting: false,
      supportResizing: false,
      noDataFoundMsg: 'No Data Found',
      parentScroll: this.pepperiListCont ? this.pepperiListCont.nativeElement : null,
      top: 0
    };
    this.pepperiListOutputs = {
      notifyListChanged: event => this.onListChange(event),
      notifySortingChanged: event => this.onListSortingChange(event),
      notifyFieldClicked: event => this.onCustomizeFieldClick(event),
      notifySelectedItemsChanged: event => this.selectedRowsChanged(event)
    };

    this.loadlist(apiEndpoint);
  }

  onListChange(event) {

  }

  onListSortingChange(event) {
  }

  onCustomizeFieldClick(event) {
    // debugger;
  }

  selectedRowsChanged(selectedRowsCount) {
    const selectData = this.pepperiListComp.componentRef.instance.getSelectedItemsData(true);
    let rowData = '';
    if (selectData && selectData.rows && selectData.rows[0] !== '' && selectData.rows.length == 1) {

      const uid = selectData.rows[0];
      rowData = this.pepperiListComp.componentRef.instance.getItemDataByID(uid);
    }

    this.listActions = this.topBarComp && selectedRowsCount > 0 ? this.getListActions(rowData) : null;
    this.topBarComp.componentRef.instance.listActionsData = this.listActions;
    this.topBarComp.componentRef.instance.showListActions = this.listActions && this.listActions.length ? true : false;

    this.cd.detectChanges();
  }

  topBarOnInit(compRef: ComponentRef<any>) {
    this.translate.get([
        'Archive_Addon_TypesTableTitle', 
        'Archive_Addon_TypesActivityColumnTitle', 
        'Archive_Addon_TypesMonthsColumnTitle',
        'Archive_Addon_TypesItemsColumnTitle',
        'Archive_Addon_AddType'
    ]).subscribe((translates) => {
        const topRightButtons = [];
        const topLeftButtons = [];
        const dataView = this.service.getDataView(translates);

        let rightButtons = this.service.rightButtons(translates) || [];
        rightButtons = rightButtons.map(action => {
        return new TopBarButton(action.Title, () => action.Action(), action.Icon, ICON_POSITION.End, true, null, 'pepperi-button mat-button strong color-main lg');
        })

        this.listActions = this.getListActions();
        this.topBarInputs = {
        showSearch: false,
        selectedList: '',
        listActionsXDirection: 'after',
        listActionsData: this.listActions,
        leftButtons: topLeftButtons,
        rightButtons: rightButtons,
        showTotals: false,
        showListActions: false,
        topbarTitle: dataView.Title || '',
        standalone: true
        };

        this.topBarOutputs = {
        actionClicked: event => this.onActionClicked(event),
        jsonDateFilterChanged: event =>  this.onJsonDateFilterChanged(event),
        searchStringChanged: event => this.searchChanged(event)
        };
    });
  }

  getListActions(rowData = null): Array<ListActionsItem> {
    let obj = rowData ? this.list.find(item => item.UUID === rowData.UID) : undefined;
    return this.service.getActions().filter(action => action.Filter(obj)).map(action => {
      return new ListActionsItem(action.Key, action.Title, false);
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

  async loadlist(apiEndpoint) {
    this.translate.get([
        'Archive_Addon_TypesTableTitle', 
        'Archive_Addon_TypesActivityColumnTitle', 
        'Archive_Addon_TypesMonthsColumnTitle',
        'Archive_Addon_TypesItemsColumnTitle',
        'Archive_Addon_AddType'
    ]).subscribe(async (translates) => {
        const dataView = this.service.getDataView(translates);
        this.list = await this.service.getList();
        const rows: PepperiRowData[] = this.list.map(x => {
        const res = new PepperiRowData();
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

        const pepperiListObj = this.pluginService.pepperiDataConverter.convertListData(rows);
        const uiControl = pepperiListObj.UIControl;
        const l = pepperiListObj.Rows.map((row, i) => {
        row.UID = this.list[i].UUID || row.UID;
        const osd = new ObjectSingleData(uiControl, row);
        osd.IsEditable = false;
        return osd;
        })

        this.pepperiListComp.componentRef.instance.initListData(uiControl, l.length, l, VIEW_TYPE.Table, '', true);
    });
  }

  onActionClicked(event) {

    const selectData = this.pepperiListComp.componentRef.instance.getSelectedItemsData(true);
    if (selectData.rows.length == 1) {

      const uid = selectData.rows[0];
      const rowData = this.pepperiListComp.componentRef.instance.getItemDataByID( uid );
      const obj = rowData ? this.list.find(item => item.UUID === rowData.UID) : undefined;
      this.service.getActions().find(action => action.Key === event.ApiName).Action(obj);
    }
  }

  onJsonDateFilterChanged(jsonFilterObject: JsonFilter) {
    this.jsonDateFilter = jsonFilterObject;
    
  }

  public searchChanged(searchString: string) {
      this.searchString = searchString;
  }
}
