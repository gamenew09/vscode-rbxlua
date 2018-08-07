import * as vscode from 'vscode';
import { RbxGlobalItem } from '../robloxglobalsprovider';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from '../utils';
import { RobloxReflectionApi, RbxReflection } from '../robloxapihelper';

/*
    The HSV helper functions were derived from: https://github.com/EmmanuelOga/columns/blob/master/utils/color.lua and http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
*/

// 0-1
function rgbToHSV(r: number, g: number, b: number)
{
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);

    let d = max - min;

    let h = max;
    let s = max;
    let v = max;

    s = max == 0 ? 0 : d / max;

    if(max == min) {
        h = 0;
    }
    else {
        switch(max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }

        h /= 6;
    }

    return [h, s, v];
}

function hsvToRGBFloat(h, s, v) {
    let r, g, b;

    let i = Math.floor(h * 6);
    let f = h * 6 - i;
    let p = v * (1 - s);
    let q = v * (1 - f * s);
    let t = v * (1 - (1 - f) * s);

    switch(i % 6) {
        case 0: 
            r = v;
            g = t;
            b = p;
            break;
        case 1:
            r = q;
            g = v;
            b = p; 
            break;
        case 2: 
            r = p;
            g = v;
            b = t; 
            break;
        case 3: 
            r = p;
            g = q;
            b = v; 
            break;
        case 4: 
            r = t;
            g = p;
            b = v; 
            break;
        case 5: 
            r = v;
            g = p;
            b = q; 
            break;
    }

    return [r, g, b];
}

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
                                    let hsv = args.map((str) => {
                                        return parseFloat(str);
                                    });

                                    colorNums = hsvToRGBFloat(hsv[0], hsv[1], hsv[2]);
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
                        let hsv = rgbToHSV(color.red, color.green, color.blue);
                        colorStr = hsv[0].toFixed(3) + ", " + hsv[1].toFixed(3) + ", " + hsv[2].toFixed(3);
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