import { MP_STARTER_API_ROOT, EXTENSION_USER_AGENT } from "../constants";
import fetch from "node-fetch";

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
    throw new Error("Error finding MicroProfile spec support");
  }

  return supportDetails;
}
