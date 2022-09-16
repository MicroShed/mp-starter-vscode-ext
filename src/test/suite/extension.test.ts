/**
 * (C) Copyright IBM Corporation 2019.
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
import { expect } from "chai";

const MP_STARTER_IDENTIFIER = "MicroProfile-Community.mp-starter-vscode-ext";
const MP_STARTER_COMMAND = "extension.microProfileStarter";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../extension';

describe("VS Code extension", () => {
  it("should be present", () => {
    expect(vscode.extensions.getExtension(MP_STARTER_IDENTIFIER)).to.exist;
  });

  it("should register an activation event", () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const extensionPackageJSON = vscode.extensions.getExtension(MP_STARTER_IDENTIFIER)!.packageJSON;

    expect(extensionPackageJSON.activationEvents).to.include(
      `onCommand:${MP_STARTER_COMMAND}`,
      `The ${MP_STARTER_COMMAND} command is not registered as an activation event in package.json`
    );
  });
});
