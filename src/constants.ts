/**
 * (C) Copyright IBM Corporation 2019, 2022.
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
export const MP_STARTER_API_ROOT = "https://start.microprofile.io/api/6";

export const MP_VERSION_LABELS: Record<string, string> = {
  MP50: "Version 5.0",
  MP41: "Version 4.1",
  MP40: "Version 4.0",
  MP33: "Version 3.3",
  MP32: "Version 3.2",
  MP30: "Version 3.0",
  MP22: "Version 2.2",
  MP21: "Version 2.1",
  MP20: "Version 2.0",
  MP14: "Version 1.4",
  MP13: "Version 1.3",
  MP12: "Version 1.2",
};

export const MP_SERVER_LABELS: Record<string, string> = {
  LIBERTY: "Open Liberty",
  HELIDON: "Helidon",
  PAYARA_MICRO: "Payara Micro",
  THORNTAIL_V2: "Thorntail Version 2",
  KUMULUZEE: "KumuluzEE",
  TOMEE: "Apache TomEE 8.00-M3",
  WILDFLY: "WildFly",
  WILDFLY_SWARM: "WildFly Swarm",
  QUARKUS: "Quarkus",
};

export const OPEN_NEW_PROJECT_OPTIONS = {
  ADD_CURRENT_WORKSPACE: "Add to current workspace",
  OPEN_NEW_WINDOW: "Open in new window",
};

export const EXTENSION_USER_AGENT = "Visual Studio Code";

export const CONFIRM_OPTIONS = {
  YES: "Yes",
  NO: "No",
};

export const ERRORS = {
  FETCH_ERROR: "FetchError",
  EXTRACT_PROJECT_ERROR: "ExtractProjectError",
};
