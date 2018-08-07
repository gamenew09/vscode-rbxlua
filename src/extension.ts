'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { RobloxReflectionApi, RbxReflection, createRobloxReflection } from './robloxapihelper';
import { symbolizeGlobal, getFunctionNameAtPosition, getFunctionArgumentNumber } from './utils';
import { RbxGlobalItem } from './robloxglobalsprovider';

import { RbxLuaCompletionItemProvider } from './providers/autoComplete';
import { RbxLuaHoverProvider } from './providers/hover';
import { RbxLuaSignatureHelpProvider } from './providers/signatureHelper';

// The selector used for the language providers.
const RBXLUA_SELECTOR: vscode.DocumentSelector = "rbxlua";

export function activate(context: vscode.ExtensionContext) {
    let extensionPath: string = context.extensionPath; // The path the extension is held under.

    createRobloxReflection(extensionPath); // Sets the RbxReflection object to a new RobloxReflectionApi object.

    // Grab the latest Roblox Reflection API or get it from the cache.
    // If the version online is the same as the cache then we just use cache.
    RbxReflection.grabApiWithCache().then(() => {
        vscode.window.showInformationMessage("Loaded Roblox Reflection data!");
    }, (err) => {
        vscode.window.showErrorMessage(err);
    });

    // Grab the globals defined in the extension.
    RbxReflection.getGlobalProvider().grabGlobalFunctionsFrom(extensionPath + "/globals.json").then(() => {
        vscode.window.showInformationMessage("Loaded Roblox Globals data!");
    }, (err) => {
        vscode.window.showErrorMessage(err);
    });

    // Register the Refres Reflection Command.
    context.subscriptions.push(vscode.commands.registerCommand("rbxlua.refreshReflectionApi", () => {
        RbxReflection.grabApi().then(() => {
            vscode.window.showInformationMessage("Updated the Roblox API being used!");
        }, (err) => {
            vscode.window.showErrorMessage(err);
        });
    }));

    // Push our Language Providers.
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(RBXLUA_SELECTOR, new RbxLuaCompletionItemProvider(), '.'));
    context.subscriptions.push(vscode.languages.registerHoverProvider(RBXLUA_SELECTOR, new RbxLuaHoverProvider()));
    context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(RBXLUA_SELECTOR, new RbxLuaSignatureHelpProvider(), '(', ','));
}

// this method is called when your extension is deactivated
export function deactivate() {
}