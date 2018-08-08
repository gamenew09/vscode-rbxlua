import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';

export function symbolizeGlobal(global: RbxGlobalItem, className?: string, useColonInClassName: boolean = false): string
{
    if(global.Type == "function")
    {
        let funcName = global.Name;

        let params = "";

        global.Arguments.forEach((arg) => {
            params = params.concat(arg.Type + " " + arg.Name + (arg.Default != null ? " = ".concat(arg.Default.toString()) : "") + ", ");
        });

        params = params.substr(0, params.length - 2);

        let deprecated = global.Deprecated;

        return global.ReturnType + " " + (className != null ? className + (useColonInClassName ? ":" : ".") : "") + funcName + "(" + params + ")";
    }
    else
    {
        return global.Type + " " + global.Name;
    }
}

export function getFunctionNameAtPosition(document: vscode.TextDocument, position: vscode.Position): Thenable<string> {
    return new Promise((resolve, reject) => {
        let line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));
        let funcName = line;
        if(funcName.indexOf(')') != -1)
        {
            funcName = funcName.substr(funcName.indexOf(')') + 1);
        }
        if(funcName.indexOf('(') != -1)
        {
            funcName = funcName.substr(0, funcName.indexOf('('));
        }
        resolve(funcName);
    });
}

export function getFunctionArgumentNumber(document: vscode.TextDocument, position: vscode.Position)
{
    let line = document.getText(new vscode.Range(new vscode.Position(position.line, 0), position));

    if(line.indexOf('(') == -1)
    {
        return -1;
    }

    let commas = line.match(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g);

    if(commas === null)
    {
        return 0;
    }

    return commas.length;
}