import { Component, OnInit } from '@angular/core';
import { DataRetentionService } from 'src/app/services/data-retention.service';
import {AdditionalData, DEFAULT_NUM_OF_MONTHS, KeyValuePair, ScheduledType } from "../../../../../shared/entities";
import { IPepGenericListActions, IPepGenericListDataSource, IPepGenericListParams } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { TranslateService } from '@ngx-translate/core';
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddTypeDialogComponent } from "../dialogs/add-type-dialog/add-type-dialog.component"
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';


@Component({
  selector: 'all-activities',
  templateUrl: './all-activities.component.html',
  styleUrls: ['./all-activities.component.scss'],
  providers: [ DataRetentionService ]
})
export class AllActivitiesComponent implements OnInit {
  additionalData: AdditionalData;
  activityTypes = [];
  defaultNumOfMonths = DEFAULT_NUM_OF_MONTHS;
  isLoaded: boolean = false;
  dataSource: IPepGenericListDataSource;
  listEmptyState = {
    show: true,
    title: this.translate.instant('Archive_TypesTable_NoItems')
  }
  reload: boolean = false;
  
  constructor(
    public pluginService: DataRetentionService,
    private translate: TranslateService,
    public dialogService: PepDialogService,

    ) { }

  ngOnInit() {
    this.run();

  }

  async run() {
    await this.getActivityTypes();
    this.additionalData = await this.pluginService.getAdditionalData();
    this.defaultNumOfMonths = this.additionalData.DefaultNumofMonths_Draft;
    this.dataSource = this.getDataSource();
    this.isLoaded = true;
}

getDataSource(): IPepGenericListDataSource {
  return {
    init: async (parameters: IPepGenericListParams) => {
      let items = this.additionalData?.ScheduledTypes_Draft;
      items.map((item) => {
        item['ActivityTypeValue'] = item.ActivityType.value;
        item['ActivityTypeKey'] = item.ActivityType.key;

        return item;
      });
      if(items.length !== 0) {
        this.listEmptyState.show = false;
      }

      return Promise.resolve({
        dataView: {
          Context: {
            Name: '',
            Profile: { InternalID: 0 },
            ScreenSize: 'Landscape'
          },
          Type: 'Grid',
          Title: 'All Activities',
          Fields: [
            {
              FieldID: 'ActivityTypeValue',
              Type: 'TextBox',
              Title: 'Activity',
              Mandatory: true,
              ReadOnly: true
            },
            {
              FieldID: 'NumOfMonths',
              Type: 'TextBox',
              Title: 'Months',
              Mandatory: true,
              ReadOnly: true
            },
            {
              FieldID: 'MinItems',
              Type: 'TextBox',
              Title: 'Min Records',
              Mandatory: true,
              ReadOnly: true
            }
          ],
          Columns: [
            {
              Width: 10
            },
            {
              Width: 10
            },
            {
              Width: 10
            }
          ],
          FrozenColumnsCount: 0,
          MinimumColumnWidth: 0
        },
        items: this.additionalData?.ScheduledTypes_Draft,
        totalCount: this.additionalData?.ScheduledTypes_Draft.length
      });
    }
  }
}

  actions: IPepGenericListActions = {
    get: async (data: PepSelectionData) => {
        if (data.rows.length) {
            return [
            {
              title: this.translate.instant("Edit"),
              handler: async (objs) => {
                const activityType = this.activityTypes.find(item => objs.rows[0] == item.key);
                if (objs.rows[0] && activityType) {
                  const itemData = this.additionalData?.ScheduledTypes_Draft.find((e)=> {return e.ActivityType.key.toString() === objs.rows[0]});
                  this.openTypeDialog('Edit', itemData);
                }
                else {
                    const title = this.translate.instant('Archive_MissingActivityModal_Title');
                    const content = this.translate.instant('Archive_MissingActivityModal_Paragraph', { Type: objs.rows[0].ActivityType.value });
                    
                    const buttons = [
                      new PepDialogActionButton(this.translate.instant("Archive_Confirm"),"",
                            () => {this.deleteType(objs.rows[0]);})]
                    this.pluginService.openTextDialog(title, content, buttons, 'custom');
                }
              }
          },
          {
            title: this.translate.instant("Delete"),
            handler: async (objs) => {
              const itemData = this.additionalData?.ScheduledTypes_Draft.find((e)=> {return e.ActivityType.key.toString() === objs.rows[0]});

              this.deleteTypeDialog(itemData);
            }
          }]
        } else return []
    }
}


openTypeDialog(operation, selectedObj = undefined) {
  const types = this.additionalData.ScheduledTypes_Draft ? this.activityTypes.filter((item) => {
      return this.additionalData.ScheduledTypes_Draft.findIndex(type => type.ActivityType.key == item.key) == -1 || (selectedObj ? selectedObj == item.key : false)
  }) : this.activityTypes;
  const dialogTitle = operation == 'Add' ? this.translate.instant('Archive_TypesModalTitle_Add') : this.translate.instant('Archive_TypesModalTitle_Update');
  this.pluginService.openDialog(
      dialogTitle,
      AddTypeDialogComponent,
      [],
      {
          title: dialogTitle,
          data: {
              activityTypes: types,
              selectedType: selectedObj,
              maxHistory: this.additionalData.DefaultNumofMonths_Draft
          }
      },
      async (data) => {
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
  this.activityTypes ? this.getActivityTypes() : null;
  this.dataSource = this.getDataSource();     
}

deleteTypeDialog(selectedObj) {
  const dialogData = new PepDialogData({
    title: this.translate.instant('Archive_DeleteModal_Title'),
    content: this.translate.instant('Archive_DeleteModal_Paragraph'),
    actionsType: 'cancel-delete'
  });

  this.dialogService.openDefaultDialog(dialogData).afterClosed()
    .subscribe(async (deleteClicked) => {
        if(deleteClicked) {
          this.deleteType(selectedObj);    
        }
    });
}

deleteType(selectedObj) {
  if (selectedObj) {
      const index = this.additionalData.ScheduledTypes_Draft.findIndex(item => item.ActivityType.key == selectedObj.ActivityType.key);
      index > -1 ? this.additionalData.ScheduledTypes_Draft.splice(index, 1) : null;
      this.pluginService.updateAdditionalData(this.additionalData);
      this.activityTypes ? this.getActivityTypes() : null;
      this.dataSource = this.getDataSource();       
  }
}


  onValueChange(value) {
    if (value && value > 0 && value < 25) {
      this.additionalData.DefaultNumofMonths_Draft = value;
      this.pluginService.updateAdditionalData(this.additionalData);
    }
  }

  addButtonClicked(event) {
    this.openTypeDialog('Add', event.source.key);
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
}  
