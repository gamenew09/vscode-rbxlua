import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from '../utils';
import { RobloxReflectionApi, RbxReflection } from '../robloxapihelper';

export class RbxLuaHoverProvider implements vscode.HoverProvider {
    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.Hover> {
        return new Promise((resolve, reject) => {
            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);

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
        });
    }
}