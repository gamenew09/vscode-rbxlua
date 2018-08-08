import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from '../utils';
import { RobloxReflectionApi, RbxReflection } from '../robloxapihelper';

const LUA_KEYWORDS = [
    "and",
    "break",
    "do",
    "else",
    "elseif",
    "end",
    "for",
    "function",
    "if",
    "in",
    "local",
    "not",
    "or",
    "repeat",
    "return",
    "then",
    "until",
    "while"
];

const LUA_CONSTS = [
    "true",
    "false",
    "nil"
];

export class RbxLuaCompletionItemProvider implements vscode.CompletionItemProvider {
    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
    Thenable<vscode.CompletionItem[]> {
        return new Promise<vscode.CompletionItem[]>((resolve, reject) =>{
            let word = document.getText(document.getWordRangeAtPosition(position));

            let completionItems: vscode.CompletionItem[] = new Array<vscode.CompletionItem>();

            if(word.startsWith("Enum."))
            {
                let count = word.match(/\./g).length;

                if(count == 1)
                {
                    RbxReflection.getEnumerations().forEach(rbxEnum => {
                        let completionItem: vscode.CompletionItem = new vscode.CompletionItem(rbxEnum.Name, vscode.CompletionItemKind.Enum);
                        completionItems.push(completionItem);
                    });
                }
                else if(count == 2)
                {
                    let EnumName = word.substr(word.indexOf(".") + 1, (word.lastIndexOf(".") - word.indexOf(".") - 1));
                    let rbxEnum = RbxReflection.getFirstEnumByName(EnumName);

                    if(rbxEnum !== null)
                    {
                        rbxEnum.Items.forEach((rbxEnumItem) => {
                            let completionItem: vscode.CompletionItem = new vscode.CompletionItem(rbxEnumItem.Name, vscode.CompletionItemKind.EnumMember);
                            completionItems.push(completionItem);
                        });
                    }
                }
            }
            else
            {
                let dataTypes = RbxReflection.getGlobalProvider().getDatatypes();

                let filteredDTs = dataTypes.filter((val) => {
                    return word.startsWith(val.Name + ".");
                });

                if(filteredDTs != null && filteredDTs.length > 0)
                {
                    completionItems = filteredDTs[0].Globals.map((global) => {
                        let completionItemKind = vscode.CompletionItemKind.Constant;
                        if(global.Type == "function")
                        {
                            completionItemKind = vscode.CompletionItemKind.Function;
                        }
                        let completionItem = new vscode.CompletionItem(global.Name, completionItemKind);
                        
                        let detail = symbolizeGlobal(global, filteredDTs[0].Name, false);
                        if(global.Deprecated)
                        {
                            detail = detail.concat(" (Deprecated)")
                        }
    
                        completionItem.detail = detail;
                        completionItem.insertText = global.Name;
                        completionItem.documentation = new vscode.MarkdownString(global.Documentation);
                        return completionItem;
                    });
                }
                else
                {
                    completionItems = RbxReflection.getGlobalProvider().getGlobals().map((global) => {
                        let completionItemKind = vscode.CompletionItemKind.Constant;
                        if(global.Type == "function")
                        {
                            completionItemKind = vscode.CompletionItemKind.Function;
                        }
                        let completionItem = new vscode.CompletionItem(global.Name, completionItemKind);
                        
                        let detail = symbolizeGlobal(global);
                        if(global.Deprecated)
                        {
                            detail = detail.concat(" (Deprecated)")
                        }
    
                        completionItem.detail = detail;
                        completionItem.insertText = global.Name;
                        completionItem.documentation = new vscode.MarkdownString(global.Documentation);
                        return completionItem;
                    }).concat(dataTypes.map((dataType) => {
                        let completionItem = new vscode.CompletionItem(dataType.Name, vscode.CompletionItemKind.Class);
                        completionItem.insertText = dataType.Name;
                        if(dataType.Documentation)
                        {
                            completionItem.documentation = dataType.Documentation;
                        }
                        return completionItem;
                    }));
    
                    LUA_KEYWORDS.forEach((keyword) => {
                        let completionItem = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                        completionItem.insertText = keyword;
                        completionItems.push(completionItem);
                    });
    
                    LUA_CONSTS.forEach((constantName) => {
                        let completionItem = new vscode.CompletionItem(constantName, vscode.CompletionItemKind.Constant);
                        completionItem.insertText = constantName;
                        completionItems.push(completionItem);
                    });
                }
            }

            resolve(completionItems);
        });
    }
}