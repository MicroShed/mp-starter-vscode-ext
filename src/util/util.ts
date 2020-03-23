import * as fs from "fs";
import fetch from "node-fetch";
import { pipeline } from "stream";
import { promisify } from "util";
import * as path from "path";
import * as admZip from "adm-zip";

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

export const deleteFile = promisify(fs.unlink);

export const exists = promisify(fs.exists);

export function trimCapitalizeFirstLetter(str: string): string {
  const newStr = str.trim();
  return newStr.charAt(0).toUpperCase() + newStr.slice(1);
}

export async function unzipFile(
  zipPath: string,
  targetDir: string,
  zipName: string
): Promise<void> {
  const zip = new admZip(zipPath);
  zip.extractAllTo(targetDir, false);
  const zipFolder = path.resolve(zipPath, zipName);
  return new Promise((resolve, reject) => {
    if (exists(zipFolder)) {
      console.log("returning resolve");
      resolve();
    } else {
      reject(new Error("Unable to extract zip folder: " + zipFolder));
    }
  });
}
