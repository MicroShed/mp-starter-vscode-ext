import * as vscode from 'vscode';
let properties = require('../properties');
import {
    resolveSpecs,
    getKeyFromValue,
    mapToPropertiesFile,
    openDialogForFolder,
    mapToDescription
} from './util';
var supportMatrix: string;

export async function generateProject(): Promise<void> {

    // The code you place here will be executed every time your command is executed
    // get the support matrix from the api
    const fs = require('fs');
    var request = require('request');

    var supportMatrixOptions = {
        url: 'https://start.microprofile.io/api/2/supportMatrix'
    };

    async function getSupportMatrix(error: any, response: { statusCode: number; }, body: any) {

        if (!error && response.statusCode === 200) {
            supportMatrix = body;

            var mpDict = JSON.parse(body);
            var mpVersions = Object.keys(mpDict.configs);
            // get descriptive values of MicroProfile Versions
            let mpVersionsMapped = await mapToPropertiesFile("mpVersions", mpVersions);
            // if one of the versions is null, remove it from the list
            let filterdArray = mpVersionsMapped.filter(x => x != null) as string[];
            if (filterdArray.length !== mpVersionsMapped.length) {
                mpVersionsMapped = filterdArray;
            }

            // prompt for groupId
            const groupId: string | undefined = await vscode.window.showInputBox(Object.assign({
                validateInput: (value: string) => {
                    if (!value || value.trim().length === 0) {
                        return 'Cannot set empty groupId';
                    }
                    if (value.indexOf(' ') >= 0) {
                        return "groupId cannot contain a blank space";
                    }
                    return null;
                }
            },
                {
                    placeHolder: "e.g. com.example",
                    prompt: "Specify a Group Id for your project.",
                    value: "com.example",
                    ignoreFocusOut: true
                }
            ));

            if (!groupId) { return; }

            // prompt for artifactId
            const artifactId: string | undefined = await vscode.window.showInputBox(Object.assign({
                validateInput: (value: string) => {
                    if (!value || value.trim().length === 0) {
                        return 'Cannot set empty artifactId';
                    }
                    if (value.indexOf(' ') >= 0) {
                        return "artifactId cannot contain a blank space";
                    }
                    return null;
                }
            },
                {
                    placeHolder: "demo",
                    prompt: "Specify an Artifact Id for your project.",
                    value: "demo",
                    ignoreFocusOut: true
                }
            ));

            if (!artifactId) { return; }

            var dataString = '{"groupId":"' + groupId + '", "artifactId":"' + artifactId + '"';

            // prompt for Java SE version
            const javaSEVersion: string | undefined = await vscode.window.showQuickPick(
                ["SE8"],
                { ignoreFocusOut: true, placeHolder: "Select a Java SE version." },
            );

            if (!javaSEVersion) { return; }

            // prompt for MicroProfile version
            const mpVersion = await vscode.window.showQuickPick(
                mpVersionsMapped,
                { ignoreFocusOut: true, placeHolder: "Select a MicroProfile version." },
            );

            if (mpVersion !== undefined) {
                // look up in properties file the key associated with the mpVersion value
                var apiVersion = getKeyFromValue(mpVersion, properties.mpVersions);
                if (apiVersion !== undefined) {
                    var mpServerChoices = mpDict.configs[apiVersion]["supportedServers"];
                    var mpServerSpecs = mpDict.configs[apiVersion]["specs"];
                }
            }

            // get descriptive values of MicroProfile Servers and specifications
            let mpServerChoicesMapped = await mapToPropertiesFile("mpServers", mpServerChoices);

            let specItems = await mapToDescription(mpServerSpecs, mpDict.descriptions);

            // prompt for MicroProfile server
            const mpServer: string | undefined = await vscode.window.showQuickPick(
                mpServerChoicesMapped,
                { ignoreFocusOut: true, placeHolder: "Select a MicroProfile server." },
            );

            if (!mpServer) {
                return;
            } else {
                var apiServer = getKeyFromValue(mpServer, properties.mpServers);
            }

            var specifications: vscode.QuickPickItem[] | undefined = await vscode.window.showQuickPick(
                specItems,
                { ignoreFocusOut: true, canPickMany: true, placeHolder: "Select MicroProfile specifications." },
            );


            if (!specifications) { return; }

            const targetFolder = await openDialogForFolder({ openLabel: "Generate into this folder" });
            var targetDir: string | undefined;
            if (targetFolder !== undefined) {
                targetDir = targetFolder.fsPath;
            }

            dataString += ', "mpVersion":"' + apiVersion + '", "supportedServer":"' + apiServer + '", "javaSEVersion":"' + javaSEVersion + '"';

            var modifiedSpecs: String[] = new Array;

            specifications.forEach(element => {
                var specItem: String | undefined = '';
                if (element['detail'] !== undefined) {
                    specItem = element['label'].concat(' - ', element['detail']);
                }
                modifiedSpecs.push(specItem);
            });

            var specsString = await resolveSpecs(modifiedSpecs, mpDict.descriptions);
            dataString += specsString + '}';
            console.log("dataString: " + dataString);

            var headers = {
                'Content-Type': 'application/json'
            };

            var options = {
                url: 'https://start.microprofile.io/api/2/project',
                method: 'POST',
                headers: headers,
                body: dataString
            };

            function callback(error: any, response: { statusCode: number; }, body: any) {
                if (!error && response.statusCode === 200 && targetDir !== undefined) {
                    vscode.window.showInformationMessage("Successfully generated MicroProfile starter project!");

                    //unzip the file
                    var extract = require('extract-zip');
                    extract(targetDir + '/' + artifactId + '.zip', { dir: targetDir }, async function (err: any) {
                        // extraction is complete. make sure to handle the err
                        if (err !== undefined) {
                            vscode.window.showErrorMessage("Could not extract the MicroProfile starter project.");
                        } else {
                            // open the unzipped folder in a new VS Code window
                            let uri = vscode.Uri.file(targetDir + '/' + artifactId);
                            var newWindow: boolean = false;
                            if (vscode.workspace.workspaceFolders !== undefined) {
                                newWindow = true;
                            }
                            await vscode.commands.executeCommand('vscode.openFolder', uri, newWindow);
                        }

                    });

                } else {
                    vscode.window.showErrorMessage("Could not generate an MicroProfile starter project.");
                }
            }

            await request(options, callback).pipe(fs.createWriteStream(targetDir + '/' + artifactId + '.zip'));
        } else {
            vscode.window.showErrorMessage(error);
        }
    }
    request(supportMatrixOptions, getSupportMatrix);

}