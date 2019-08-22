import * as vscode from 'vscode';
import {
    OpenDialogOptions,
    Uri,
    window
} from "vscode";

let properties = require('../properties');

export async function openDialogForFolder(customOptions: OpenDialogOptions): Promise<Uri | undefined> {
    const options: OpenDialogOptions = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
    };
    const result = await window.showOpenDialog(Object.assign(options, customOptions));
    if (result && result.length) {
        return Promise.resolve(result[0]);
    } else {
        return Promise.resolve(undefined);
    }
}

export async function mapToPropertiesFile(arrayName : string, originalArray : string[]) {
	var mappedArray : string[] = new Array();
	mappedArray =  originalArray.map(function (elem) {
		return properties[arrayName][elem];
	});
	mappedArray.sort().reverse();
	return mappedArray;
}

function capitalizeFirstLetter(newString :string) {
    return newString.charAt(0).toUpperCase() + newString.slice(1);
}

export async function mapToDescription(prevArray : string[], descriptions: Object) {
	var specItems : vscode.QuickPickItem[] = new Array();
	prevArray.forEach(element => {
		var content = descriptions[element as keyof typeof descriptions];
		var contentStr = new String(content);

		var splits = contentStr.split(" - ");
		specItems.push({
			'label': splits[0],
			// 'detail': capitalizeFirstLetter(splits[1])
			'detail': splits[1]
		});
	});
	return specItems;
}

export function getKeyFromValue(value: Object, arr : any) {
	return Object.keys(arr).find(key => arr[key] === value);
}


export async function resolveSpecs(specifications : String[], descriptions: Object){
	var dataString: String = "";
	if (specifications !== undefined && specifications.length > 0) {
		dataString += ', "selectedSpecs":[';
		specifications.forEach(async element => {
			var apiSpec;
			if (element === specifications[0]){
				apiSpec = getKeyFromValue(element, descriptions);
				dataString = dataString + '"' + apiSpec + '"';
			} else {
				apiSpec = getKeyFromValue(element, descriptions);
				dataString += ', "' + apiSpec + '"';
			}
		});
		dataString = dataString + ']';
	}
	return dataString;
}
