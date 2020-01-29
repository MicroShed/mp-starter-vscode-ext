import * as vscode from "vscode";
import * as fs from "fs";
import fetch from "node-fetch";
import { pipeline } from "stream";
import { OpenDialogOptions, Uri, window, QuickPickItem } from "vscode";
import { MP_SERVER_LABELS, MP_VERSION_LABELS } from "../properties";

export async function askForGroupID(): Promise<string | undefined> {
  return await vscode.window.showInputBox({
    placeHolder: "e.g. com.example",
    prompt: "Specify a Group Id for your project.",
    value: "com.example",
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (value.trim().length === 0) {
        return "Group Id is required";
      }
      if (value.indexOf(" ") >= 0) {
        return "Group Id cannot contain a blank space";
      }
      return null;
    },
  });
}

export async function askForArtifactID(): Promise<string | undefined> {
  return await vscode.window.showInputBox({
    placeHolder: "demo",
    prompt: "Specify an Artifact Id for your project.",
    value: "demo",
    ignoreFocusOut: true,
    validateInput: (value: string) => {
      if (value.trim().length === 0) {
        return "Artifact Id is required";
      }
      if (value.indexOf(" ") >= 0) {
        return "Artifact Id cannot contain a blank space";
      }
      return null;
    },
  });
}

export async function askForJavaSEVersion(): Promise<string | undefined> {
  const SUPPORTED_JAVA_SE_VERSIONS = ["SE8"];

  return await vscode.window.showQuickPick(SUPPORTED_JAVA_SE_VERSIONS, {
    ignoreFocusOut: true,
    placeHolder: "Select a Java SE version.",
  });
}

export async function askForMPVersion(mpVersions: string[]): Promise<string | undefined> {
  interface MPVersionOption extends QuickPickItem {
    label: string; // label is the long-name that is displayed in vscode
    version: string; // version is the short-name that is used internally by the microprofile starter api
  }

  const mpVersionOptions: MPVersionOption[] = [];
  for (const mpVersion of mpVersions) {
    // if we have a label defined for the given MP version short-name add it to the options array
    if (MP_VERSION_LABELS[mpVersion] != null) {
      mpVersionOptions.push({
        label: MP_VERSION_LABELS[mpVersion],
        version: mpVersion,
      });
    }
  }

  const mpVersionQuickPickResult = await vscode.window.showQuickPick(mpVersionOptions, {
    ignoreFocusOut: true,
    placeHolder: "Select a MicroProfile version.",
  });

  if (mpVersionQuickPickResult != null) {
    return mpVersionQuickPickResult.version;
  }

  return undefined;
}

export async function askForMPServer(mpServers: string[]): Promise<string | undefined> {
  interface MPServerOption extends QuickPickItem {
    label: string; // label is the long-name that is displayed in vscode
    server: string; // server is the short-name that is used internally by the microprofile starter api
  }

  const mpServerOptions: MPServerOption[] = [];
  for (const mpServer of mpServers) {
    // if we have a server label for the given mp server short-name add it to the options array
    if (MP_SERVER_LABELS[mpServer] != null) {
      mpServerOptions.push({
        label: MP_SERVER_LABELS[mpServer],
        server: mpServer,
      });
    }
  }

  const mpVersionQuickPickResult = await vscode.window.showQuickPick(mpServerOptions, {
    ignoreFocusOut: true,
    placeHolder: "Select a MicroProfile server.",
  });

  if (mpVersionQuickPickResult != null) {
    return mpVersionQuickPickResult.server;
  }
  return undefined;
}

export async function askForMPSpecifications(
  specs: string[],
  specDescriptions: Record<string, string>
): Promise<Array<string> | undefined> {
  interface MPSpecOption extends QuickPickItem {
    spec: string; // spec is the short-name used internally my microprofile starter api
    label: string; // name of mp spec
    detail: string; // description of mp spec
  }

  const mpSpecOptions: MPSpecOption[] = specs.map(spec => {
    const fullDescription = specDescriptions[spec];
    const [name, desc] = fullDescription.split("-");
    return {
      spec: spec,
      label: name,
      detail: trimCapitalizeFirstLetter(desc),
    };
  });

  const specResults: MPSpecOption[] | undefined = await vscode.window.showQuickPick(mpSpecOptions, {
    ignoreFocusOut: true,
    canPickMany: true,
    placeHolder: "Select MicroProfile specifications.",
  });

  if (specResults != null) {
    return specResults.map(result => result.spec);
  }
  return undefined;
}

export async function askForFolder(customOptions: OpenDialogOptions): Promise<Uri | undefined> {
  const options: OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  };
  const result = await window.showOpenDialog(Object.assign(options, customOptions));

  if (result && result.length > 0) {
    return result[0];
  }

  return undefined;
}

interface RequestOptions {
  url: string;
}

// Downloads a file using streams to avoid loading entire file into memory
export async function downloadFile(
  requestOptions: RequestOptions,
  downloadLocation: string
): Promise<void> {
  const { url, ...options } = requestOptions;
  const res = await fetch(url, options);
  if (res.status >= 400 && res.status < 600) {
    throw new Error(`Bad response from server ${res.status}: ${res.statusText}`);
  }

  return new Promise((resolve, reject) => {
    // create a pipeline that pipes the response to the download location
    pipeline(res.body, fs.createWriteStream(downloadLocation), err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export function trimCapitalizeFirstLetter(str: string): string {
  const newStr = str.trim(); // remove any leading whitespace
  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}
