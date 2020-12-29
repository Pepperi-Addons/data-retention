import { Component, OnInit } from '@angular/core';
import { IPepFieldClickEvent, IPepFieldValueChangeEvent } from '@pepperi-addons/ngx-lib';
// import { PepGroupButtonClick, PepGroupButton } from '@pepperi-addons/ngx-lib/group-buttons';
import { pepIconSystemBin } from '@pepperi-addons/ngx-lib/icon';
import { PepMenuItem, IPepMenuItemClickEvent } from '@pepperi-addons/ngx-lib/menu';

@Component({
    // tslint:disable-next-line: component-selector
    selector: 'addon-ngx-lib-examples',
    templateUrl: './pepperi-ngx-lib-examples.component.html',
    styleUrls: ['./pepperi-ngx-lib-examples.component.scss']
})
export class PepperiNgxLibExamplesComponent implements OnInit {

    title = 'client-side';
    minDateValue: number;
    maxDateValue: number;
    // groupButtons: Array<PepGroupButton>;
    richHtml;

    menuItems: Array<PepMenuItem>;

    constructor() { 
        this.minDateValue = new Date('1-1-2019').getTime();
        this.maxDateValue = new Date('1-1-2021').getTime();

        // this.groupButtons = [
        //     {
        //         key: 'action',
        //         value: 'test for check the size of the button',
        //         callback: (event: PepGroupButtonClick) => this.onGroupButtonClicked(event)
        //     },
        //     {
        //         key: 'del',
        //         class: 'caution',
        //         callback: (event: PepGroupButtonClick) => this.onGroupButtonClicked(event),
        //         icon: pepIconSystemBin.name 
        //     }
        // ];

        this.richHtml = "<h1><u>Rich Text Value Example</u></h1><h2><em style=' color: rgb(147, 200, 14);'>Pepperi Rich Text Value </em><u style='color: rgb(0, 102, 204);'>Example</u></h2><ol><li><strong><u>Pepperi Rich Text Value Example</u></strong></li><li>Pepperi Rich text [value] example</li></ol>";
    }

    ngOnInit(): void {
        this.loadMenuItems();
    }

    getMenuItems(): Array<PepMenuItem> {
        const menuItems: Array<PepMenuItem> = [
            { key: 'test1', text: 'test 1'},
            { key: 'test2', text: 'test 2', disabled: true },
            { key: 'sep', type: 'splitter' },
            { key: 'test3', text: 'test 3'}];

        return menuItems;
    }

    private loadMenuItems(): void {
        this.menuItems = this.getMenuItems();
    }

    onMenuItemClicked(action: IPepMenuItemClickEvent): void {
        alert(action.source.key);
    }

    menuClicked(event): void {
        alert('menu clicked');
    }

    onValueChanged(event: IPepFieldValueChangeEvent) {
        alert(`${event.key}: value was changed to ${event.value}`);
    }

    elementClicked(event: IPepFieldClickEvent) {
        alert(`${event.key}: was clicked`);
    }

    onGroupButtonClicked(event: any): void {
        alert(`${event.source.key}: was clicked`);
    }
}
