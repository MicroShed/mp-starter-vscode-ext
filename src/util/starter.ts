import * as vscode from "vscode";
import * as extract from "extract-zip";
import * as util from "./util";
import fetch from "node-fetch";

export async function generateProject(): Promise<void> {
  try {
    const mpSupportResponse = await fetch("https://start.microprofile.io/api/2/supportMatrix");
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

    const javaSEVersion = await util.askForJavaSEVersion();
    if (javaSEVersion === undefined) {
      return;
    }

    const mpVersion = await util.askForMPVersion(allMpVersions);
    if (mpVersion === undefined) {
      return;
    }

    // ask user to select one of the servers that are avalaible for the version of mp they selected
    const mpServer = await util.askForMPserver(mpConfigurations[mpVersion].supportedServers);
    if (mpServer === undefined) {
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

    // location to download the zip file
    const zipPath = targetDirString + "/" + artifactId + ".zip";

    const requestOptions = {
      url: "https://start.microprofile.io/api/2/project",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestPayload),
    };

    // downloads the file to the given path using streams to avoid
    // loading entire file into memory
    await util.downloadFile(requestOptions, zipPath);

    extract(zipPath, { dir: targetDirString }, async function(err: any) {
      if (err !== undefined) {
        console.error(err);
        vscode.window.showErrorMessage("Failed to extract the MicroProfile starter project.");
      } else {
        // open the unzipped folder in a new VS Code window
        const uri = vscode.Uri.file(targetDirString + "/" + artifactId);
        const openInNewWindow = vscode.workspace.workspaceFolders !== undefined;
        await vscode.commands.executeCommand("vscode.openFolder", uri, openInNewWindow);
      }
    });
  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage("Failed to generate a MicroProfile starter project");
  }
}
