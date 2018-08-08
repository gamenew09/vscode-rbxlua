import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from '../utils';
import { RobloxReflectionApi, RbxReflection } from '../robloxapihelper';

export class RbxLuaSignatureHelpProvider implements vscode.SignatureHelpProvider {
    createSignatureHelpFromGlobal(document: vscode.TextDocument, position: vscode.Position, globalItem: RbxGlobalItem, className?: string): vscode.SignatureHelp {
        let help = new vscode.SignatureHelp();
                        
        let sig = new vscode.SignatureInformation(symbolizeGlobal(globalItem, className), new vscode.MarkdownString(globalItem.Documentation));

        globalItem.Arguments.forEach((arg) => {
            let param = new vscode.ParameterInformation(arg.Type + " " + arg.Name, new vscode.MarkdownString(arg.Documentation));
            sig.parameters.push(param);
        });

        help.signatures.push(sig);
        help.activeParameter = getFunctionArgumentNumber(document, position);
        let lastArg = globalItem.Arguments[globalItem.Arguments.length - 1];
        if(lastArg.Type.startsWith("Tuple"))
        {
            help.activeParameter = Math.min(globalItem.Arguments.length - 1, help.activeParameter);
        }
        help.activeSignature = 0;
        return help;
    }

    public provideSignatureHelp(
        document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken):
        Promise<vscode.SignatureHelp> {
        return new Promise((resolve, reject) => {
            // TODO: Handle more than one function signature.
            getFunctionNameAtPosition(document, position).then((funcName) => {
                let globalItem = RbxReflection.getGlobalProvider().getGlobalDefinitionByName(funcName);
                if(globalItem != null)
                {
                    resolve(this.createSignatureHelpFromGlobal(document, position, globalItem));
                }
                else
                {
                    let filter = RbxReflection.getGlobalProvider().getDatatypes().filter((val) => {
                        return funcName.startsWith(val.Name + ".");
                    });

                    if(filter != null && filter.length > 0)
                    {
                        let filter2 = filter[0].Globals.filter((val) => {
                            return val.Name == funcName.substr(funcName.lastIndexOf('.') + 1);
                        });

                        if(filter2 != null && filter2.length > 0)
                        {
                            resolve(this.createSignatureHelpFromGlobal(document, position, filter2[0], filter[0].Name));
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
            }, reject);
        });
    }
}