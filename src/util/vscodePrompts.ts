import * as vscode from "vscode";
import * as path from "path";
import { OpenDialogOptions, Uri, window, QuickPickItem } from "vscode";
import { MP_SERVER_LABELS, MP_VERSION_LABELS, CONFIRM_OPTIONS } from "../constants";
import {
  trimCapitalizeFirstLetter,
  exists,
  deleteFolder,
  validateArtifactId,
  validateGroupId,
} from "./util";

export async function askForGroupID(): Promise<string | undefined> {
  return await vscode.window.showInputBox({
    placeHolder: "e.g. com.example",
    prompt: "Specify a Group Id for your project.",
    value: "com.example",
    ignoreFocusOut: true,
    validateInput: validateGroupId,
  });
}

export async function askForArtifactID(): Promise<string | undefined> {
  return await vscode.window.showInputBox({
    placeHolder: "demo",
    prompt: "Specify an Artifact Id for your project.",
    value: "demo",
    ignoreFocusOut: true,
    validateInput: validateArtifactId,
  });
}

export async function askForJavaSEVersion(
  supportedJavaSEVersions: string[]
): Promise<string | undefined> {
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

export async function askForTargetFolder(artifactId: string): Promise<Uri | undefined> {
  const customOptions: OpenDialogOptions = {
    openLabel: "Generate into this folder",
  };

  const targetFolder = await askForFolder(customOptions);

  if (targetFolder && (await exists(path.join(targetFolder.fsPath, artifactId)))) {
    const selection = await askConfirmation(
      `Folder ${artifactId} already exists inside the ${targetFolder.fsPath} folder. The ${artifactId} folder will be deleted and replaced with the generated MicroProfile Starter project. Are you sure you want to generate into this folder?`
    );
    if (selection === CONFIRM_OPTIONS.YES) {
      // delete the existing folder.
      try {
        deleteFolder(path.join(targetFolder.fsPath, artifactId));
      } catch (e) {
        //the folder is in use
        vscode.window.showErrorMessage(
          `Failed to delete folder ${targetFolder.fsPath} because it is being used by another process.`
        );
      }
    } else if (selection === CONFIRM_OPTIONS.NO) {
      return await askForTargetFolder(artifactId);
    }
  }

  return targetFolder;
}

export async function askConfirmation(message: string): Promise<string | undefined> {
  return await vscode.window.showWarningMessage(
    message,
    ...[CONFIRM_OPTIONS.YES, CONFIRM_OPTIONS.NO]
  );
}
