import * as vscode from "vscode";
import * as util from "../util/util";
import * as prompts from "../util/vscodePrompts";
import * as path from "path";
import fetch from "node-fetch";
import { MP_STARTER_API_ROOT, OPEN_NEW_PROJECT_OPTIONS, EXTENSION_USER_AGENT } from "../constants";

export async function generateProject(): Promise<void> {
  try {
    const mpSupportResponse = await fetch(`${MP_STARTER_API_ROOT}/supportMatrix`, {
      method: "GET",
      headers: {
        "User-Agent": EXTENSION_USER_AGENT,
      },
    });
    if (mpSupportResponse.status >= 400 && mpSupportResponse.status < 600) {
      throw new Error(`Bad response ${mpSupportResponse.status}: ${mpSupportResponse.statusText}`);
    }

    const mpSupportMatrix = await mpSupportResponse.json();

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

    const javaSEVersion = await prompts.askForJavaSEVersion(mpVersion, mpServer);
    if (javaSEVersion === undefined) {
      return;
    }

    // ask user to pick a list of mp specifications to use for the given version of mp they selected
    const allSupportedSpecs = mpConfigurations[mpVersion].specs;
    const specDescriptions = mpSupportMatrix.descriptions;
    const mpSpecifications = await prompts.askForMPSpecifications(
      allSupportedSpecs,
      specDescriptions
    );
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

    try {
      const targetDirFolder = path.join(targetDirString, artifactId);
      await util.unzipFile(zipPath, targetDirString, targetDirFolder);
      try {
        await util.deleteFile(zipPath);
      } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(`Failed to delete file ${zipName}`);
      }

      // open the unzipped folder in a new VS Code window
      const uriPath = vscode.Uri.file(targetDirFolder);
      // prompt user whether they want to add project to current workspace or open in a new window
      const selection = await vscode.window.showInformationMessage(
        "MicroProfile Starter project generated.  Would you like to add your project to the current workspace or open it in a new window?",
        ...[
          OPEN_NEW_PROJECT_OPTIONS.ADD_CURRENT_WORKSPACE,
          OPEN_NEW_PROJECT_OPTIONS.OPEN_NEW_WINDOW,
        ]
      );
      if (selection === OPEN_NEW_PROJECT_OPTIONS.ADD_CURRENT_WORKSPACE) {
        vscode.workspace.updateWorkspaceFolders(0, 0, { uri: uriPath });
      } else if (selection === OPEN_NEW_PROJECT_OPTIONS.OPEN_NEW_WINDOW) {
        await vscode.commands.executeCommand("vscode.openFolder", uriPath, true);
      }
    } catch (err) {
      console.error(err);
      vscode.window.showErrorMessage("Failed to extract the MicroProfile Starter project.");
    }
  } catch (e) {
    console.error(e);
    if (e.name === "FetchError") {
      vscode.window.showErrorMessage(
        "Failed to connect to the MicroProfile Starter. Please check your network connection and try again."
      );
    } else {
      vscode.window.showErrorMessage("Failed to generate a MicroProfile Starter project");
    }
  }
}
