import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';


@Component({
  selector: 'data-retention-tabs',
  templateUrl: './data-retention-tabs.component.html',
  styleUrls: ['./data-retention-tabs.component.scss']
})
export class DataRetentionTabsComponent implements OnInit {
  monitorLevel: number;
  tabID = 0;

  constructor(
    ) { }

  ngOnInit() {
    this.init();
  }

  async init() {
  }

  tabClick(event){
    window.dispatchEvent(new Event("resize"));
    this.tabID = event.index;
  }
}  
