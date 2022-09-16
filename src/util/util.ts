/**
 * (C) Copyright IBM Corporation 2019, 2020.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as fs from "fs";
import fetch from "node-fetch";
import { pipeline } from "stream";
import { promisify } from "util";
import * as admZip from "adm-zip";
import * as path from "path";
import * as vscode from "vscode";

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

export const deleteFolder = (parent: string) => {
  if (fs.existsSync(parent)) {
    //go through each element in the directory
    fs.readdirSync(parent).forEach((entry, index) => {
      const currentPath = path.join(parent, entry);
      // if it is a file -> delete
      //if it is directory -> drill down further and repeat
      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteFolder(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }
    });
    // finally remove parent directory
    try {
      fs.rmdirSync(parent);
    } catch (e) {
      vscode.workspace.workspaceFolders?.forEach((entry, index) => {
        if (entry.name === parent) {
          vscode.commands.executeCommand("workbench.action.removeRootFolder");
          fs.rmdirSync(parent);
        }
      });
    }
  }
};

export const deleteFile = promisify(fs.unlink);

export const exists = promisify(fs.exists);

export function trimCapitalizeFirstLetter(str: string): string {
  const newStr = str.trim();
  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

export async function unzipFile(
  zipPath: string,
  targetDir: string,
  targetDirFolder: string
): Promise<void> {
  const zip = new admZip(zipPath);
  zip.extractAllTo(targetDir, false);
  const zipFolderExists = await exists(targetDirFolder);
  return new Promise((resolve, reject) => {
    if (zipFolderExists) {
      resolve();
    } else {
      reject(new Error("Unable to extract zip folder: " + targetDirFolder));
    }
  });
}

export async function validateGroupId(groupId: string): Promise<string | undefined> {
  // regex referenced from
  // https://github.com/redhat-developer/vscode-quarkus/blob/master/src/wizards/generateProject/validateInput.ts
  const re = new RegExp("^([a-zA-Z_$][a-zA-Z\\d_$]*\\.)*[a-zA-Z_$][a-zA-Z\\d_$]*$");
  if (!re.test(groupId)) {
    if (!/^[a-zA-Z_$]/.test(groupId)) {
      return "Invalid groupId: A valid groupId must start with a character from A to z, or one of the following symbols: _$";
    } else if (!/[a-zA-Z\\d_$]$/.test(groupId)) {
      return "Invalid groupId: A valid groupId must end with a character from A to z, a number, or one of the following symbols: _$";
    }
    return "Invalid groupId: A valid groupId can only contain characters from A to z, numbers, and the following symbols: ._$";
  }
  return undefined;
}

export async function validateArtifactId(artifactId: string): Promise<string | undefined> {
  // regex referenced from
  // https://github.com/redhat-developer/vscode-quarkus/blob/master/src/wizards/generateProject/validateInput.ts
  const re = new RegExp("^[a-z][a-z0-9-._]*$");
  if (!re.test(artifactId)) {
    if (!/^[a-z]/.test(artifactId)) {
      return "Invalid artifactId: A valid artifactId must start with a character from a-z";
    }
    return "Invalid artifactId: A valid artifactId can only contain characters from a-z, numbers, and the following symbols: -._";
  }
  return undefined;
}
