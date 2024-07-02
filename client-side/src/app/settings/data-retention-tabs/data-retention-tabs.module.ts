import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, PepIconModule, pepIconSystemClose } from '@pepperi-addons/ngx-lib/icon';
import { MatTabsModule } from '@angular/material/tabs';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';

import { SchedulerModule } from '../scheduler/scheduler.module';
import { DataRetentionTabsComponent } from './data-retention-tabs.component';
import { AllActivitiesModule } from '../all-activities/all-activities.module';

const pepIcons = [
    pepIconSystemClose,
];

export const routes: Routes = [
    {
        path: '',
        component: DataRetentionTabsComponent
    }
];

@NgModule({
    declarations: [
        DataRetentionTabsComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        PepTopBarModule,
        PepPageLayoutModule,
        PepGenericListModule,
        MatTabsModule,
        SchedulerModule,
        AllActivitiesModule,
        TranslateModule.forChild(),
        RouterModule.forChild(routes)
    ],
    exports:[DataRetentionTabsComponent]
})
export class DataRetentionTabsModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
