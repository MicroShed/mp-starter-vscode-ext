import * as vscode from "vscode";
import * as util from "../util/util";
import * as prompts from "../util/vscodePrompts";
import * as path from "path";
import {
  MP_STARTER_API_ROOT,
  OPEN_NEW_PROJECT_OPTIONS,
  EXTENSION_USER_AGENT,
  ERRORS,
} from "../constants";
import * as mpStarterApi from "../util/mpStarterApi";

export async function generateProject(): Promise<void> {
  try {
    const mpSupportMatrix = await mpStarterApi.getSupportMatrix();
    // mpConfigurations is a map of mp version -> mp configuration
    const mpConfigurations = mpSupportMatrix.configs;
    const allMpVersions = Object.keys(mpConfigurations);

    const groupId = await prompts.askForGroupID();
    if (groupId === undefined) {
      return;
    }

    const artifactId = await prompts.askForArtifactID();
    if (artifactId === undefined) {
      return;
    }

    const mpVersion = await prompts.askForMPVersion(allMpVersions);
    if (mpVersion === undefined) {
      return;
    }

    // ask user to select one of the servers that are available for the version of mp they selected
    const mpServer = await prompts.askForMPServer(mpConfigurations[mpVersion].supportedServers);
    if (mpServer === undefined) {
      return;
    }

    // gets support information about which JavaSE versions / microprofile specs are supported by the
    // users selected mp server / mp version combination
    const { javaSEVersions, mpSpecs } = await mpStarterApi.getSupportedJavaAndSpecs(
      mpServer,
      mpVersion
    );

    const javaSEVersion = await prompts.askForJavaSEVersion(javaSEVersions);
    if (javaSEVersion === undefined) {
      return;
    }

    const specDescriptions = mpSupportMatrix.descriptions;
    const mpSpecifications = await prompts.askForMPSpecifications(mpSpecs, specDescriptions);
    if (mpSpecifications === undefined) {
      return;
    }

    const targetFolder = await prompts.askForTargetFolder(artifactId);
    if (targetFolder === undefined) {
      return;
    }

    const targetDirString = targetFolder.fsPath;

    const requestPayload = {
      groupId: groupId,
      artifactId: artifactId,
      mpVersion: mpVersion,
      supportedServer: mpServer,
      javaSEVersion: javaSEVersion,
      selectedSpecs: mpSpecifications,
    };

    const zipName = `${artifactId}.zip`;
    // location to download the zip file
    const zipPath = path.join(targetDirString, zipName);

    const requestOptions = {
      url: `${MP_STARTER_API_ROOT}/project`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": EXTENSION_USER_AGENT,
      },
      body: JSON.stringify(requestPayload),
    };

    // show a progress bar as the zip file is being downloaded
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating the MicroProfile Starter project...",
        cancellable: false,
      },
      () => util.downloadFile(requestOptions, zipPath)
    );

    const targetDirFolder = path.join(targetDirString, artifactId);

    try {
      await util.unzipFile(zipPath, targetDirString, targetDirFolder);
    } catch (e) {
      console.error(e);
      const err = new Error("Unable to extract MicroProfile Starter Project");
      err.name = ERRORS.EXTRACT_PROJECT_ERROR;
      throw err;
    }

    // if failed to delete the zip, no need to error out but show a warning to users
    try {
      await util.deleteFile(zipPath);
    } catch (e) {
      console.error(e);
      vscode.window.showErrorMessage(`Failed to delete file ${zipName}`);
    }

    const uriPath = vscode.Uri.file(targetDirFolder);
    // prompt user whether they want to add project to current workspace or open in a new window
    const selection = await vscode.window.showInformationMessage(
      "MicroProfile Starter project generated.  Would you like tPo add your project to the current workspace or open it in a new window?",
      ...[OPEN_NEW_PROJECT_OPTIONS.ADD_CURRENT_WORKSPACE, OPEN_NEW_PROJECT_OPTIONS.OPEN_NEW_WINDOW]
    );
    if (selection === OPEN_NEW_PROJECT_OPTIONS.ADD_CURRENT_WORKSPACE) {
      vscode.workspace.updateWorkspaceFolders(0, 0, { uri: uriPath });
    } else if (selection === OPEN_NEW_PROJECT_OPTIONS.OPEN_NEW_WINDOW) {
      await vscode.commands.executeCommand("vscode.openFolder", uriPath, true);
    }
  } catch (e) {
    console.error(e);
    if (e.name === ERRORS.FETCH_ERROR) {
      vscode.window.showErrorMessage(
        "Failed to connect to the MicroProfile Starter. Please check your network connection and try again."
      );
    } else if (e.name === ERRORS.EXTRACT_PROJECT_ERROR) {
      vscode.window.showErrorMessage("Failed to extract the MicroProfile Starter project");
    } else {
      vscode.window.showErrorMessage("Failed to generate a MicroProfile Starter project");
    }
  }
}
