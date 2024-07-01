import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { TranslateModule } from '@ngx-translate/core';

import { PepNgxLibModule, PepAddonService } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepIconRegistry, PepIconModule, pepIconSystemClose } from '@pepperi-addons/ngx-lib/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { AllActivitiesComponent } from './all-activities.component';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { AddTypeDialogModule } from '../dialogs/add-type-dialog/add-type-dialog.module';
import { DataRetentionService } from 'src/app/services/data-retention.service';

const pepIcons = [
    pepIconSystemClose
];

@NgModule({
    declarations: [
        AllActivitiesComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        PepNgxLibModule,
        PepSizeDetectorModule,
        PepTopBarModule,
        PepPageLayoutModule,
        PepGenericListModule,
        PepSelectModule,
        PepTextboxModule,
        PepButtonModule,
        MatTabsModule,
        AddTypeDialogModule,
        TranslateModule.forChild()
    ],
    exports:[AllActivitiesComponent], 
    providers: [DataRetentionService]   
})
export class AllActivitiesModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
