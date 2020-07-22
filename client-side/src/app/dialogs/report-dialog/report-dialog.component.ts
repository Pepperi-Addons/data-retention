import {
    Component,
    OnInit,
    ViewChild,
    Input,
    OnChanges,
    Output,
    Inject,
    Injectable
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
    styleUrls: ["./report-dialog.component.scss"]
})
export class ReportDialogComponent implements OnInit, OnChanges {
    reportRows: any = [];

    title: string;
    svgIcons: any;

    // @Output() emitClose: EventEmitter<any> = new EventEmitter<any>();

    dataSource: MatTableDataSource<any>;
    displayedColumns: string[];
    operationTypes: any;

    private paginator: MatPaginator;
    private sort: MatSort;

    // ----------- Uncomment to enable Sorting -----------
    // @ViewChild(MatSort) set matSort(ms: MatSort) {
    //     if (this.data.Rows && this.data.Rows.length > 0) {
    //         this.sort = ms;
    //         this.setDataSourceAttributes();
    //     }
    // }

    // setDataSourceAttributes() {
    //     this.dataSource.sort = this.sort;
    // }

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
        // if (this.reportRows && this.reportRows.length > 0) {
        //     this.displayedColumns = Object.keys(this.reportRows[0]);
        //     this.dataSource = new MatTableDataSource(this.data);
        //     // ----------- Uncomment to enable Sorting -----------
        //     //this.dataSource.sort = this.sort;
        // }
    }
}