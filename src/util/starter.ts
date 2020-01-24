import * as vscode from "vscode";
import * as rp from "request-promise";
import * as request from "request";
import * as fs from "fs";
import * as extract from "extract-zip";
import * as util from "./util";

export async function generateProject(): Promise<void> {
  try {
    const response = await rp.get("https://start.microprofile.io/api/2/supportMatrix");
    const mpSupportMatrix = JSON.parse(response);

    // map of MP version -> mp configuration
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

    const allMpServersForVersion = mpConfigurations[mpVersion].supportedServers;

    const mpServer = await util.askForMPserver(allMpServersForVersion);
    if (mpServer === undefined) {
      return;
    }

    // all of the possible specs supported by the users selected version of microprofile
    const allSupportedSpecs = mpConfigurations[mpVersion].specs;
    const specDescriptions = mpSupportMatrix.descriptions;

    const mpSpecifications = await util.askForMPSpecifications(allSupportedSpecs, specDescriptions);
    if (mpSpecifications === undefined) {
      return;
    }

    const targetFolder = await util.askForFolder({ openLabel: "Generate into this folder" });
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload),
    };

    // TODO: Move to streaming API so entire ZIP does not have to be loaded in memory.
    request(requestOptions, (err) => {
      if (!err) {
        extract(zipPath, { dir: targetDirString }, async function (err: any) {
          // extraction is complete
          if (err !== undefined) {
            vscode.window.showErrorMessage("Could not extract the MicroProfile starter project.");
          } else {
            // open the unzipped folder in a new VS Code window
            const uri = vscode.Uri.file(targetDirString + "/" + artifactId);
            const openInNewWindow = vscode.workspace.workspaceFolders !== undefined;
            await vscode.commands.executeCommand("vscode.openFolder", uri, openInNewWindow);
          }

        });
      } else {
        vscode.window.showErrorMessage("Could not generate an MicroProfile starter project.");
      }
    }).pipe(fs.createWriteStream(zipPath));

  } catch (e) {
    console.error(e);
    vscode.window.showErrorMessage("Failed to generate a MicroProfile starter project");
  }
}
