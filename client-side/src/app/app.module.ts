import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DataRetentionComponent } from './data-retention/data-retention.component';
import { PepUIModule } from './modules/pepperi.module';
import { MaterialModule } from './modules/material.module';
import { AddTypeDialogComponent } from './data-retention/dialogs/add-type-dialog/add-type-dialog.component';
import { PepperiListContComponent } from './data-retention/components/pepperi-list/pepperi-list.component';
import { ListViewComponent } from './data-retention/components/list-view/list-view.component';
import { ReportDialogComponent } from './data-retention/dialogs/report-dialog/report-dialog.component';
import { DataRetentionService } from './data-retention/data-retention.service';
import { PepAddonService } from '@pepperi-addons/ngx-lib';

@NgModule({
    declarations: [
        AppComponent,
        DataRetentionComponent,
        AddTypeDialogComponent,
        PepperiListContComponent,
        ListViewComponent,
        ReportDialogComponent,
        PepAddonService
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        PepUIModule,
        MaterialModule
    ],
    providers: [],
    // entryComponents: [
    //     DataRetentionComponent,
    //     AddTypeDialogComponent,
    //     ReportDialogComponent
    // ],
    bootstrap: [AppComponent]
})
export class AppModule {
}




