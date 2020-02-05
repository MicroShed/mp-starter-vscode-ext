import * as vscode from "vscode";
import * as extract from "extract-zip";
import * as util from "./util";
import * as path from "path";
import fetch from "node-fetch";
import { OPEN_NEW_PROJECT_OPTIONS } from "../properties";

export async function generateProject(): Promise<void> {
  try {
    const mpSupportResponse = await fetch("https://start.microprofile.io/api/3/supportMatrix");
    if (mpSupportResponse.status >= 400 && mpSupportResponse.status < 600) {
      throw new Error(`Bad response ${mpSupportResponse.status}: ${mpSupportResponse.statusText}`);
    }

    const mpSupportMatrix = await mpSupportResponse.json();

    // mpConfigurations is a map of mp version -> mp configuration
    const mpConfigurations = mpSupportMatrix.configs;
    const allMpVersions = Object.keys(mpConfigurations);

    const groupId = await util.askForGroupID();
    if (groupId === undefined) {
      return;
    }

    const artifactId = await util.askForArtifactID();
    if (artifactId === undefined) {
      return;
    }

    const mpVersion = await util.askForMPVersion(allMpVersions);
    if (mpVersion === undefined) {
      return;
    }

    // ask user to select one of the servers that are available for the version of mp they selected
    const mpServer = await util.askForMPServer(mpConfigurations[mpVersion].supportedServers);
    if (mpServer === undefined) {
      return;
    }

    const javaSEVersion = await util.askForJavaSEVersion(mpVersion);
    if (javaSEVersion === undefined) {
      return;
    }

    // ask user to pick a list of mp specifications to use for the given version of mp they selected
    const allSupportedSpecs = mpConfigurations[mpVersion].specs;
    const specDescriptions = mpSupportMatrix.descriptions;
    const mpSpecifications = await util.askForMPSpecifications(allSupportedSpecs, specDescriptions);
    if (mpSpecifications === undefined) {
      return;
    }

    const targetFolder = await util.askForFolder({
      openLabel: "Generate into this folder",
    });
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
      url: "https://start.microprofile.io/api/2/project",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    };

    // show a progress bar as the zip file is being downloaded
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Generating the MicroProfile starter project...",
        cancellable: false,
      },
      () => util.downloadFile(requestOptions, zipPath)
    );

    extract(zipPath, { dir: targetDirString }, async function(err: any) {
      if (err !== undefined) {
        console.error(err);
        vscode.window.showErrorMessage("Failed to extract the MicroProfile starter project.");
      } else {
        try {
          await util.deleteFile(zipPath);
        } catch (e) {
          console.error(e);
          vscode.window.showErrorMessage(`Failed to delete file ${zipName}`);
        }

        // open the unzipped folder in a new VS Code window
        const uriPath = vscode.Uri.file(path.join(targetDirString, artifactId));
        // prompt user whether they want to add project to current workspace or open in a new window
        const selection = await vscode.window.showInformationMessage(
          "MicroProfile starter project generated.  Would you like to add your project to the current workspace or open it in a new window?",
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
      }
    });
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage("Failed to generate a MicroProfile starter project");
  }
}
