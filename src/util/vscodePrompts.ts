import * as vscode from "vscode";
import * as fs from "fs";
import { OpenDialogOptions, Uri, window, QuickPickItem } from "vscode";
import { MP_SERVER_LABELS, MP_VERSION_LABELS } from "../constants";
import { trimCapitalizeFirstLetter } from "./util";

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

export async function askForJavaSEVersion(
  mpVersion: string,
  mpServer: string
): Promise<string | undefined> {
  const MP32_JAVA_11_SUPPORTED = ["LIBERTY", "PAYARA_MICRO", "HELIDON", "THORNTAIL_V2"];

  let supportedJavaSEVersions = ["SE8"];

  if (mpVersion === "MP32" && MP32_JAVA_11_SUPPORTED.includes(mpServer)) {
    supportedJavaSEVersions = ["SE8", "SE11"];
  }

  return await vscode.window.showQuickPick(supportedJavaSEVersions, {
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

export async function askForFolder(
  customOptions: OpenDialogOptions,
  artifactId: string
): Promise<Uri | undefined> {
  const options: OpenDialogOptions = {
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
  };
  const result = await window.showOpenDialog(Object.assign(options, customOptions));

  if (result && result.length > 0) {
    const targetFolder = result[0];

    if (fs.existsSync(`${targetFolder.path}/${artifactId}`)) {
      const selection = await askYesOrNo(
        `Folder ${artifactId} already exists inside the ${targetFolder.path} folder. Contents of the ${artifactId} folder and the generated MicroProfile Starter Project will be merged. Are you sure you want to generate into this folder?`
      );
      if (selection === "Yes") {
        return targetFolder;
      } else if (selection === "No") {
        return await askForFolder(customOptions, artifactId);
      }
      return undefined;
    }
    return targetFolder;
  }
  return undefined;
}

export async function askYesOrNo(message: string): Promise<string | undefined> {
  return await vscode.window.showWarningMessage(message, ...["Yes", "No"]);
}
