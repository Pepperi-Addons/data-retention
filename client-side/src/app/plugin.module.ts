import { NgModule  } from '@angular/core';
import { PluginComponent } from './plugin.component';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatTabsModule, MatIconModule, MatInputModule, MatCheckboxModule, MatFormFieldModule, MatDialogModule, MatCardModule } from '@angular/material';
import { TranslateService, TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
// @ts-ignore
// import { PepperiTextareaComponent } from 'pepperi-textarea';
import { DynamicModule, DynamicComponent } from 'ng-dynamic-component';
import { ignoreElements } from 'rxjs/operators';
//@ts-ignore
import {EnvVariables} from 'pepperi-environment-variables';

//@ts-ignore
import {AddonService} from 'pepperi-addon-service';

import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AddTypeDialogComponent } from './dialogs/add-type-dialog/add-type-dialog.component';
import { PepperiSelectComponent } from './components/pepperi-select/pepperi-select.component';
import { PepperiTextboxComponent } from './components/pepperi-textbox/pepperi-textbox.component';
import { PepperiListContComponent } from './components/pepperi-list/pepperi-list.component'
import { ListViewComponent } from './components/list-view/list-view.component'
function getUrl(){
    debugger;
}
@NgModule({
  declarations: [
    PluginComponent,
    AddTypeDialogComponent,
    PepperiSelectComponent,
    PepperiTextboxComponent,
    PepperiListContComponent,
    ListViewComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MatTabsModule,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatDialogModule,
    MatCardModule,
    FormsModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient, AddonService],
      },
  }),
    ReactiveFormsModule,
    DynamicModule.withComponents([])
    ],
  exports: [

  ],
  providers: [{
    provide: 'plugins',
    useValue: [{
      name: 'plugin-component',
      component: PluginComponent
    }],
    multi: true
  },
  TranslateService
],
  entryComponents: [
    PluginComponent,
    DynamicComponent,
    AddTypeDialogComponent
  ]
})

export class PluginModule {

}

export function createTranslateLoader(http: HttpClient, apiService: AddonService, url: string = '') {
  if (!url) {
    url = apiService.getAddonStaticFolderURL();
  }
  return new TranslateHttpLoader(http, url , '.json');
}


