export class RbxFunctionArgument {
    public Name:string;
    public Type:string;
    public Default?:any;
    public Documentation:string;
}

export class RbxGlobalItem {
    public Name:string;
    public Type:string;
    public ReturnType:string;
    public Documentation:string;
    public Deprecated:boolean;
    public Arguments:RbxFunctionArgument[];
}

export class RbxDataType {
    public Name: string;
    public Documentation: string;
    public Globals: RbxGlobalItem[];
}

import * as fs from "fs";
import { isString, isArray } from "util";

export class RbxGlobalsProvider {
    private globalsJSONArray;
    private globals: RbxGlobalItem[];
    private dataTypes: RbxDataType[];

    public getGlobalDefinitionByName(globalDefName: string) {
        let global = this.globals.filter((val) => {
            return val.Name == globalDefName;
        });

        if(global === null || global.length == 0)
        {
            return null;
        }

        return global[0];
    }

    public getGlobals(): RbxGlobalItem[] {
        return this.globals;
    }

    public getDatatypes(): RbxDataType[] {
        return this.dataTypes;
    }

    public grabDatatypesFromFolder(location: string): Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.readdir(location, (err, files) => {
                if(err)
                {
                    reject(err);
                }
                else
                {
                    this.dataTypes = new Array<RbxDataType>();
                    files.forEach((file) => {
                        let json = require(location + "/" + file);

                        let dataType: RbxDataType = new RbxDataType();
                        dataType.Name = file.split('.')[0];
                        
                        if(json.documentation)
                        {
                            dataType.Documentation = json.documentation;
                        }

                        dataType.Globals = new Array<RbxGlobalItem>();

                        json.members.forEach((jsonGlobal) => {
                            dataType.Globals.push(this.jsonToGlobal(jsonGlobal));
                        });

                        this.dataTypes.push(dataType);
                    });
                }
            });
        });
    }

    jsonToGlobal(globalJson): RbxGlobalItem {
        let global: RbxGlobalItem = new RbxGlobalItem();

        global.Name = globalJson.name;
        global.Type = globalJson.type;
        if(globalJson.returnType != null)
        {
            global.ReturnType = globalJson.returnType;
        }

        global.Deprecated = globalJson.deprecated || false;
        if(isArray(globalJson.arguments))
        {
            global.Arguments = new Array();

            globalJson.arguments.forEach(argJson => {
                let arg: RbxFunctionArgument = new RbxFunctionArgument();
                if(isString(argJson.documentation)) {
                    arg.Documentation = argJson.documentation;
                }
                if(argJson.default != undefined) {
                    if(argJson.default == null)
                    {
                        arg.Default = null;
                    }
                    else
                    {
                        arg.Default = argJson.default;
                    }
                }
                arg.Name = argJson.name;
                arg.Type = argJson.type;
                global.Arguments.push(arg);
            });
        }

        if(isString(globalJson.documentation))
        {
            global.Documentation = globalJson.documentation;
        }
        return global;
    }

    public grabGlobalFunctionsFrom(location: string): Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.readFile(location, "utf8", (err, data) => {
                if(err)
                {
                    reject(err);
                }
                else
                {
                    this.globalsJSONArray = JSON.parse(data);
                    this.globals = new Array();

                    this.globalsJSONArray.forEach((globalJson) => {
                        this.globals.push(this.jsonToGlobal(globalJson));
                    });

                    resolve();
                }
            });
        });
    }
}