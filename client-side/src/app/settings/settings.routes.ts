import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
// import { SettingsComponent } from './settings.component';

const routes: Routes = [
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        // component: SettingsComponent,
        children: [
            {
                path: '**',
                loadChildren: () => import('./data-retention-tabs/data-retention-tabs.module').then(m => m.DataRetentionTabsModule),
            }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
    ],
    exports: [RouterModule]
})
export class SettingsRoutingModule { }



