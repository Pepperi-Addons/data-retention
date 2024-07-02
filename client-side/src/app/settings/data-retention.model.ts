import { PepDialogActionsType } from '@pepperi-addons/ngx-lib/dialog';

export class DialogModel {

    title = '';
    content: any;
    contentType: PepDialogActionsType = 'close';
    actionButtons = [];
    data?: any;


    constructor(title = '', content: any = '', contentType:PepDialogActionsType = 'close', actionButtons: Array<any> = [], data = '') {
        this.title = title;
        this.content = content;
        this.contentType = contentType;
        this.actionButtons = actionButtons;
        this.data = data;
    }
  }

export class AddonsListSearch {
    SortBy: string
    Asc: boolean
    UUID: string
    ListType: string = 'all'
}

export class PluginJsonFilter {
    ExpressionId: number = 1;
    ComplexId: number;
    ApiName: string = '';
    Operation: string = '';
    Values: string[] = [];
    FieldType: string = '';
    constructor(init?:Partial<PluginJsonFilter>) {
        Object.assign(this, init);
    }

    initFromObj(obj: PluginJsonFilter) {
        if (obj) {
            this.ExpressionId = obj.ExpressionId;
            this.ApiName = obj.ApiName;
            this.Operation = obj.Operation;
            this.FieldType = obj.FieldType

            if (this.Values != obj.Values) {
                this.Values = [];
                if (obj.Values) {
                    obj.Values.forEach(value => this.Values.push(value));
                }
            }
        }
    }

    Valid(): boolean {

        return this.Operation != "" && this.ApiName != "";
    }

}

export class FooBar {
    client: FooClient;
    hello: string;
    request: FooRequest;
}

export class FooClient {
    AddonUUID: string;
    BaseURL: string;
    Module: any;
    OAuthAccessToken: string;
}

export class FooRequest {
    body: any;
    query: any;
}

export class SystemData{
    Versions?: string[];
    EnableKey?: string;
    AngularPlugin?: boolean;
    EditorName?: string;

}

export enum AddonType {
    Public = 2,
    System = 1
}

export class Addon {
    UUID: string;
    Name: string;
    Description: string;
    SystemData: any;
    Hidden: boolean;
    Type: number;
    constructor(uuid = '', name: any = '', description = '', systemData =  {Versions: []}) {
        this.UUID = uuid;
        this.Name = name;
        this.Description = description;
        this.SystemData = systemData;

    }
}

export class InstalledAddon {
    UUID: string;
    Addon: Addon;
    Version?: string;
    SystemData?: SystemData;
    AdditionalData: string;
    Hidden: string;
    constructor(uuid = '', addon: Addon = null, additionalData = '{}', systemData =  {Versions: []}) {
        this.UUID = uuid;
        this.Addon = addon;
        this.AdditionalData = additionalData;
        this.SystemData = systemData;
    }
}


  
export interface TypeDialogData {
    numOfMonths: number;
    minItems: string;
    selectedActivity: number;
}