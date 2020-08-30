import {
    Component,
    OnInit,
    OnChanges,
    Inject,
    Injectable,
    ViewEncapsulation
} from "@angular/core";
import { MatPaginator, MatSort, MatTableDataSource, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { DialogModel } from 'src/app/plugin.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AddTypeDialogService {

    private dataSource = new BehaviorSubject<any>('');
    data = this.dataSource.asObservable();

    constructor() { }

    getData(data: any) {
        this.dataSource.next(data);
    }

}

@Component({
    selector: "report-dialog",
    templateUrl: "./report-dialog.component.html",
    styleUrls: ["./report-dialog.component.scss"],
    encapsulation: ViewEncapsulation.None
})
export class ReportDialogComponent implements OnInit, OnChanges {
    reportRows: any = [];

    title: string;
    svgIcons: any;

    dataSource: MatTableDataSource<any>;
    displayedColumns: string[];
    operationTypes: any;

    private paginator: MatPaginator;
    private sort: MatSort;

    constructor( public dialogRef: MatDialogRef<ReportDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public incoming: DialogModel) {
            this.title = incoming.title;
            this.svgIcons = incoming.data.svgIcons;
            this.reportRows = incoming.data.reportRows || [];
        }

    ngOnInit() {            
        if (this.reportRows && this.reportRows.length > 0) {
            this.displayedColumns = Object.keys(this.reportRows[0]);
            this.dataSource = new MatTableDataSource(this.reportRows);
        }
    }

    ngOnChanges() {
    }
}