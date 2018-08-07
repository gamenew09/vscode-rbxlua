const ROBLOX_REFLECTION_JSON_API: string = "https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/API_Dump.json";
const ROBLOX_VERSION_TEXT_URL: string = "https://raw.githubusercontent.com/CloneTrooper1019/Roblox-Client-Watch/master/version.txt";

import * as request from "request-promise-native";
import { isArray } from "util";
import * as fs from "fs";
import {RbxFunctionArgument, RbxGlobalItem, RbxGlobalsProvider} from "./robloxglobalsprovider";

export class RobloxReflectionEnumItem {
    public Name: string;
    public Value: number;
}

export class RobloxReflectionEnum {
    public Name: string;
    public Items: RobloxReflectionEnumItem[];
}

export class RobloxReflectionApi {
    private robloxApiJsonObject: object;
    private haveInstanceOfApi: boolean;

    private globalsProvider: RbxGlobalsProvider;

    private enums: RobloxReflectionEnum[];

    private robloxApiCacheLocation: string;
    private robloxVersionCacheLocation: string;

    public getGlobalProvider(): RbxGlobalsProvider {
        return this.globalsProvider;
    }

    public constructor (RobloxApiCacheLocation: string, RobloxVersionCacheLocation: string) {
        this.robloxApiCacheLocation = RobloxApiCacheLocation;
        this.robloxVersionCacheLocation = RobloxVersionCacheLocation;

        this.globalsProvider = new RbxGlobalsProvider();
    }

    public hasInstanceOfApi(): boolean {
        return this.haveInstanceOfApi;
    }

    public getEnumerations(): RobloxReflectionEnum[] {
        return this.enums;
    }

    public getFirstEnumByName(enumName: string): RobloxReflectionEnum {
        let filterArr = this.getEnumerations().filter((val) => {
            return val.Name == enumName;
        });
        
        if(filterArr == null || filterArr.length == 0)
        {
            return null;
        }

        return filterArr[0];
    }

    private getEnums(): Thenable<RobloxReflectionEnum[]> {
        return new Promise((resolve, reject) => {
            let enumsArr = this.robloxApiJsonObject["Enums"];
            if(!isArray(enumsArr))
            {
                reject(new Error("Could not find Enums keys in API json. Maybe refresh the api list?"));
                return;
            }

            let enums: RobloxReflectionEnum[] = new Array<RobloxReflectionEnum>();

            enumsArr.forEach(enumJsonObject => {
                let rbxEnum: RobloxReflectionEnum = new RobloxReflectionEnum();
                rbxEnum.Name = enumJsonObject.Name;
                rbxEnum.Items = new Array<RobloxReflectionEnumItem>();

                enumJsonObject["Items"].forEach(rbxEnumItemJson => {
                    let rbxEnumItem: RobloxReflectionEnumItem = new RobloxReflectionEnumItem();
                    rbxEnumItem.Name = rbxEnumItemJson.Name;
                    rbxEnumItem.Value = rbxEnumItemJson.Value;
                    rbxEnum.Items.push(rbxEnumItem);
                });

                enums.push(rbxEnum);
            });

            resolve(enums);
        });
    }

    private getRobloxVersionOnGithub(): Thenable<string> {
        return new Promise((resolve, reject) => {
            request.get({
                uri: ROBLOX_REFLECTION_JSON_API
            }).then((response) => {
                resolve(response);
            }).catch(reject);
        });
    }

    private refreshInfo(): Thenable<void> {
        return new Promise((resolve, reject) => {
            this.getEnums().then((enums) => {
                this.enums = enums;
                resolve();
            }, (err) => {
                reject(err);
            });
        });
    }

    public grabApi(): Thenable<void> {
        return new Promise((resolve, reject) => {
            request.get({
                uri: ROBLOX_REFLECTION_JSON_API
            }).then((response) => {
                this.robloxApiJsonObject = JSON.parse(response);
                this.refreshInfo().then(resolve, reject);
            }).catch(reject);
        });
    }

    private writeApiToCache(): Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(this.robloxApiCacheLocation, JSON.stringify(this.robloxApiJsonObject), "utf8", (err) => {
                if(err)
                {
                    reject(err);
                }
                else
                {
                    resolve();
                }
            });
        });
    }

    private loadApiFromCache(): Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.readFile(this.robloxApiCacheLocation, "utf8", (err, data) => {
                if(err)
                {
                    reject(err);
                }
                else
                {
                    this.robloxApiJsonObject = JSON.parse(data);
                    this.refreshInfo().then(resolve, reject);
                }
            });
        });
    }

    private getVersionCached(): Thenable<string> {
        return new Promise((resolve, reject) => {
            fs.exists(this.robloxVersionCacheLocation, (exists) => {
                if(exists)
                {
                    fs.readFile(this.robloxVersionCacheLocation, "utf8", (err, data) => {
                        if(err)
                        {
                            reject(err);
                        }
                        else
                        {
                            resolve(data);
                        }
                    });
                }
                else
                {
                    resolve("");
                }
            });
        })
    }

    public grabApiWithCache(): Thenable<void> {
        return new Promise((resolve, reject) => {
            fs.exists(this.robloxApiCacheLocation, (exists) => {
                if(exists)
                {
                    this.getVersionCached().then((versionCached) => {
                        request.get({
                            uri: ROBLOX_VERSION_TEXT_URL
                        }).then((version) => {
                            if(version == versionCached)
                            {
                                console.log("Using cache for api.");
                                this.loadApiFromCache().then(() => {
                                    resolve();
                                }, (err) => { reject(err); });
                            }
                            else
                            {
                                console.log("Using web for api.");
                                this.grabApi().then(() => {
                                    resolve();
                                }, (err) => { reject(err); });
                            }
                        }).catch(reject);
                    }, reject);
                }
                else
                {
                    this.grabApi();
                    this.writeApiToCache().then(() => {
                        resolve();
                    }, (err) => { reject(err); });
                }
            });
        });
    }

}

export let RbxReflection: RobloxReflectionApi;

export function createRobloxReflection(extensionPath: string) {
    RbxReflection = new RobloxReflectionApi(extensionPath + "/api_cache.json", extensionPath + "/version_cache.txt");
}