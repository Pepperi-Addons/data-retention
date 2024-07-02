import { DoBootstrap, Injector, NgModule, Type } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { PepAddonService } from '@pepperi-addons/ngx-lib';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app.routes';

import { SettingsComponent, SettingsModule } from './settings';

// import { BlockModule, BlockComponent } from './block';
// import { BlockEditorModule, BlockEditorComponent } from './block-editor';

import { config } from './app.config';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepIconRegistry, pepIconNumberPlus } from '@pepperi-addons/ngx-lib/icon';

const pepIcons = [
    pepIconNumberPlus
];
@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        // BlockModule,
        // BlockEditorModule,
        SettingsModule,
        MatButtonModule,
        MatDialogModule,
        PepSelectModule,
        PepTextboxModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }
        }),
        AppRoutingModule,
    ],
    providers: [],
    bootstrap: [
        // AppComponent
    ]
})
export class AppModule implements DoBootstrap {
    constructor(
        private injector: Injector,
        translate: TranslateService,
        private pepAddonService: PepAddonService,
        private pepIconRegistry: PepIconRegistry

    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
    }

    ngDoBootstrap() {
        this.pepAddonService.defineCustomElement(`settings-element-${config.AddonUUID}`, SettingsComponent, this.injector);
        this.pepIconRegistry.registerIcons(pepIcons);

        // this.pepAddonService.defineCustomElement(`block-element-${config.AddonUUID}`, BlockComponent, this.injector);
        // this.pepAddonService.defineCustomElement(`block-editor-element-${config.AddonUUID}`, BlockEditorComponent, this.injector);
    }
}

