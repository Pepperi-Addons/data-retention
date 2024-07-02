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
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { AddTypeDialogComponent } from './add-type-dialog.component';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

const pepIcons = [
    pepIconSystemClose,
];

@NgModule({
    declarations: [
        AddTypeDialogComponent
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
        MatButtonModule,
        MatDialogModule,
        TranslateModule.forChild()
    ],
    exports:[AddTypeDialogComponent],    
})
export class AddTypeDialogModule {
    constructor(
        private pepIconRegistry: PepIconRegistry,
    ) {
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
