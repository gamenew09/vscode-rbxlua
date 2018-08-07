import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from '../utils';
import { RobloxReflectionApi, RbxReflection } from '../robloxapihelper';

export class RbxLuaColorProvider implements vscode.DocumentColorProvider {
    public provideDocumentColors(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.ColorInformation[]> {
        return new Promise((resolve, reject) => {
            let colorInfos:vscode.ColorInformation[] = [];

            for(let i = 0; i < document.lineCount; i++) {
                let line = document.lineAt(i);

                if(!line.isEmptyOrWhitespace)
                {
                    let regEx = /(?:Color3.(new|fromRGB|fromHSV))(\(.*\))/g;
                    let result;
                    while ((result = regEx.exec(line.text)) !== null) {
                        let combinedStr:string = result[0];
                        let colorFunc:string = result[1];
                        let prethesis:string = result[2];

                        let args = prethesis.replace(/[()]/g, "").split(',').filter((val) => { return val.trim() != ""; });

                        if(args.length == 3)
                        {
                            let addLen = "Color3".concat(colorFunc, "(").length + 1;
                            
                            let color: vscode.Color;
                            let colorNums;
                            switch(colorFunc)
                            {
                                case "new":
                                    colorNums = args.map((str) => {
                                        return parseFloat(str);
                                    });
                                    break;
                                case "fromHSV":
                                    colorNums = args.map((str) => {
                                        return parseFloat(str); // TODO: Convert HSV
                                    });
                                    break;
                                case "fromRGB":
                                    colorNums = args.map((str) => {
                                        return Math.min(Math.max(parseInt(str) / 255, 0), 1);
                                    });
                                    break;
                                default:
                                    continue;
                            }
                            color = new vscode.Color(colorNums[0], colorNums[1], colorNums[2], 1);

                            let startPos = new vscode.Position(i, line.text.indexOf(combinedStr));
                            let endPos = new vscode.Position(i, line.text.indexOf(combinedStr) + (combinedStr.length));
                            let range = new vscode.Range(startPos, endPos);

                            colorInfos.push(new vscode.ColorInformation(range, color));
                        }
                    }
                }

                if(token.isCancellationRequested)
                {
                    resolve(colorInfos);
                    return;
                }
            }
            resolve(colorInfos);
        });
    }

    public provideColorPresentations(color: vscode.Color, context: { document: vscode.TextDocument, range: vscode.Range }, token: vscode.CancellationToken): Thenable<vscode.ColorPresentation[]> {
        return new Promise((resolve, reject) => {
            let colorPresentations:vscode.ColorPresentation[] = [];
            
            let funcNameTestStr = context.document.getText(context.range);
            
            let regEx = /(?:Color3.(new|fromRGB|fromHSV))(\(.*\))/g;
            let result;
            while ((result = regEx.exec(funcNameTestStr)) !== null) {
                let colorFunc = result[1];

                let colorStr = null;
                switch(colorFunc)
                {
                    case "new":
                        colorStr = color.red.toFixed(3) + ", " + color.green.toFixed(3) + ", " + color.blue.toFixed(3);
                        break;
                    case "fromHSV":
                        colorStr = color.red.toFixed(5) + ", " + color.green.toFixed(5) + ", " + color.blue.toFixed(5);
                        break;
                    case "fromRGB":
                        colorStr = color.red * 255 + ", " + color.green * 255 + ", " + color.blue * 255;
                        break;
                }

                if(colorStr != null)
                {
                    colorPresentations.push(new vscode.ColorPresentation("Color3." + colorFunc + "(" + colorStr + ")"));
                }
            }

            resolve(colorPresentations);
        });
    }
}