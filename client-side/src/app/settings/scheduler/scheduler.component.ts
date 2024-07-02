import { Component, OnInit } from '@angular/core';
import { DataRetentionService } from 'src/app/services/data-retention.service';


@Component({
  selector: 'scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss']
})
export class SchedulerComponent implements OnInit {
  selectedDay: string = "";
  selectedHour: string = "";
  isLoaded: boolean = false;

  timeOptions = [
    { key: "0", value: "00:00" },
    { key: "1", value: "01:00" },
    { key: "2", value: "02:00" },
    { key: "3", value: "03:00" },
    { key: "4", value: "04:00" },
    { key: "5", value: "05:00" },
    { key: "6", value: "06:00" },
    { key: "7", value: "07:00" },
    { key: "8", value: "08:00" },
    { key: "9", value: "09:00" },
    { key: "10", value: "10:00" },
    { key: "11", value: "11:00" },
    { key: "12", value: "12:00" },
    { key: "13", value: "13:00" },
    { key: "14", value: "14:00" },
    { key: "15", value: "15:00" },
    { key: "16", value: "16:00" },
    { key: "17", value: "17:00" },
    { key: "18", value: "18:00" },
    { key: "19", value: "19:00" },
    { key: "20", value: "20:00" },
    { key: "21", value: "21:00" },
    { key: "22", value: "22:00" },
    { key: "23", value: "23:00" },
  ];

  dayOptions = [
    { key: "SUN", value: "Sunday" },
    { key: "MON", value: "Monday" },
    { key: "TUE", value: "Tuesday" },
    { key: "WED", value: "Wednesday" },
    { key: "THU", value: "Thursday" },
    { key: "FRI", value: "Friday" },
    { key: "SAT", value: "Saturday" },
];
  constructor(
    public pluginService: DataRetentionService,

    ) { }

  ngOnInit() {
    this.run();
  }

  async run() {
    const CodeJobUUID = (await this.pluginService.getAdditionalData()).CodeJobUUID;

    const codeJob = await this.pluginService.papiClient.codeJobs
        .uuid(CodeJobUUID)
        .find();
    const parts = codeJob ? codeJob.CronExpression.split(" ") : [];
    if (parts.length > 4) {
        this.selectedDay = this.dayOptions.find(
            (item) => item.key === parts[4]
        ).key;
        this.selectedHour = this.timeOptions.find(
            (item) => item.key === parts[1]
        ).key;
    }
    this.isLoaded = true;
  }

  onValueChange(element, value) {
        switch(element) {
            case 'Days': {
                this.selectedDay = value;
                break;
            }
            case 'Hour': {
                this.selectedHour = value;
                break;
            }
        }
    }
}  
