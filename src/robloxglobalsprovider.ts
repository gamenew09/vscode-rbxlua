export class RbxFunctionArgument {
    public Name:string;
    public Type:string;
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

import * as fs from "fs";
import { isString, isArray } from "util";

export class RbxGlobalsProvider {
    private globalsJSONArray;
    private globals: RbxGlobalItem[];

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
                                if(isString(argJson.documentation))
                                {
                                    arg.Documentation = argJson.documentation;
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


                        this.globals.push(global);
                    });

                    resolve();
                }
            });
        });
    }
}