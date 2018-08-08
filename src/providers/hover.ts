import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from '../utils';
import { RobloxReflectionApi, RbxReflection } from '../robloxapihelper';

export class RbxLuaHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
        return new Promise((resolve, reject) => {
            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);

            let dataTypeName = null;

            let testRange = new vscode.Range(range.start.translate(0, -1), range.start);

            if(document.getText(new vscode.Range(range.start.translate(0, -1), range.start)) == ".")
            {
                let append = [];
                let char = "";
                let pos = range.start.translate(0, -1);
                while(pos.character > 0 && (char = document.getText(new vscode.Range(pos.translate(0, -1), pos))) != " ")
                {
                    append.push(char);
                    pos = pos.translate(0, -1);
                }

                let realAppend = "";
                char = "";
                while((char = append.pop()) != null)
                {
                    realAppend = realAppend.concat(char);
                }

                dataTypeName = realAppend;
            }

            if(dataTypeName != null)
            {
                let dataTypes = RbxReflection.getGlobalProvider().getDatatypes();

                let filteredDTs = dataTypes.filter((val) => {
                    return val.Name == dataTypeName;
                });

                if(filteredDTs != null && filteredDTs.length > 0)
                {
                    let globals = filteredDTs[0].Globals.filter((global) => {
                        return global.Name == word;
                    });

                    if(globals != null && globals.length > 0)
                    {
                        let global = globals[0];

                        let markdownStrings = new Array();
                
                        markdownStrings.push({ language: 'rbxlua', value: symbolizeGlobal(global, filteredDTs[0].Name, false) });
                        if(global.Documentation)
                        {
                            markdownStrings.push(new vscode.MarkdownString(global.Documentation));
                        }

                        let hover = new vscode.Hover(markdownStrings, range);
                        resolve(hover);
                    }
                    else
                    {
                        resolve(null);
                    }
                }
                else
                {
                    resolve(null);
                }
            }
            else
            {
                let globalDef = RbxReflection.getGlobalProvider().getGlobalDefinitionByName(word);

                if(globalDef)
                {
                    let markdownStrings = new Array();
                    
                    markdownStrings.push({ language: 'rbxlua', value: symbolizeGlobal(globalDef) });
                    if(globalDef.Documentation)
                    {
                        markdownStrings.push(new vscode.MarkdownString(globalDef.Documentation));
                    }

                    let hover = new vscode.Hover(markdownStrings, range);
                    resolve(hover);
                }
                else
                {
                    resolve(null);
                }
            }
        });
    }
}