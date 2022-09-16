/**
 * (C) Copyright IBM Corporation 2019, 2021.
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
import { MP_STARTER_API_ROOT, EXTENSION_USER_AGENT } from "../constants";
import fetch from "node-fetch";
import * as util from "../util/util";

interface MPVersionSupport {
  supportedServers: string[];
  specs: string[];
}

interface SupportMatrix {
  configs: Record<string, MPVersionSupport>;
  descriptions: Record<string, string>;
}

export async function getSupportMatrix(): Promise<SupportMatrix> {
  const mpSupportResponse = await fetch(`${MP_STARTER_API_ROOT}/supportMatrix`, {
    method: "GET",
    headers: {
      "User-Agent": EXTENSION_USER_AGENT,
    },
  });
  if (mpSupportResponse.status >= 400 && mpSupportResponse.status < 600) {
    throw new Error(`Bad response ${mpSupportResponse.status}: ${mpSupportResponse.statusText}`);
  }

  return mpSupportResponse.json();
}

interface SupportDetails {
  mpVersion: string;
  mpSpecs: string[];
  javaSEVersions: string[];
  buildTools: string[];
}

export async function getSupportedJavaAndSpecs(
  serverName: string,
  microprofileVersion: string
): Promise<SupportDetails> {
  const serverSupportResponse = await fetch(`${MP_STARTER_API_ROOT}/supportMatrix/servers`, {
    method: "GET",
    headers: {
      "User-Agent": EXTENSION_USER_AGENT,
    },
  });
  if (serverSupportResponse.status >= 400 && serverSupportResponse.status < 600) {
    throw new Error(
      `Bad response ${serverSupportResponse.status}: ${serverSupportResponse.statusText}`
    );
  }

  const supportJSON = await serverSupportResponse.json();
  const serverInformation = supportJSON.configs[serverName];
  const supportDetails: SupportDetails | undefined = serverInformation.find(
    (supportRecord: SupportDetails) => supportRecord.mpVersion === microprofileVersion
  );
  if (supportDetails === undefined) {
    throw new Error("Unable to find supported MicroProfile specifications and Java versions");
  }

  return supportDetails;
}

interface StarterProjectOptions {
  groupId: string;
  artifactId: string;
  mpVersion: string;
  supportedServer: string;
  javaSEVersion: string;
  selectedSpecs: string[];
}

export async function downloadMPStarterProjectZip(
  options: StarterProjectOptions,
  downloadLocation: string
): Promise<void> {
  const requestOptions = {
    url: `${MP_STARTER_API_ROOT}/project`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": EXTENSION_USER_AGENT,
    },
    body: JSON.stringify(options),
  };

  await util.downloadFile(requestOptions, downloadLocation);
}
