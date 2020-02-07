# VS Code MicroProfile Starter Extension

[![Marketplace Version](https://vsmarketplacebadge.apphb.com/version/MicroProfile-Community.mp-starter-vscode-ext.svg "Current Release")](https://marketplace.visualstudio.com/items?itemName=MicroProfile-Community.mp-starter-vscode-ext)
[![Build Status](https://travis-ci.org/MicroShed/mp-starter-vscode-ext.svg?branch=master)](https://travis-ci.org/MicroShed/mp-starter-vscode-ext)

The MicroProfile Starter extension provides support for generating a MicroProfile Maven project with examples based on the Eclipse MicroProfile Starter project (https://start.microprofile.io/) by the MicroProfile community. You will be able to generate a project by choosing a MicroProfile version, server and specifications, such as CDI, Config, Health, Metrics, and more. This extension is hosted under the MicroShed organization.

## Quick Start

- Install the extension
- Launch the VS Code command palette (View -> Command Palette...), then select `MicroProfile: Generate a new MicroProfile starter project` to run the extension

## Input

The extension prompts for the following parameters:

1. groupId
2. artifactId
3. MicroProfile version
4. MicroProfile server
5. Java SE version
6. MicroProfile specifications
7. A folder to generate the project into

The extension will generate a `.zip` file of the starter project, unzip the file into the specified directory and open it in a VS Code window.

## Contributing

Contributions to the MicroProfile starter extension are welcome!

Our [CONTRIBUTING](CONTRIBUTING.md) document contains details for submitting pull requests.

To build and run the extension locally:

1. `git clone git@github.com:MicroShed/mp-starter-vscode-ext.git`
2. `cd mp-starter-vscode-ext`
3. `npm install`
4. Run the extension in VS Code by selecting `Run Extension` from the debug panel or by pressing `F5`

   Alternatively, build a `.vsix` file:

   - Run `vsce package` to generate the `mp-starter-vscode-ext-xxx.vsix` file
   - Install the extension to VS Code by `View/Command Palette`
   - Select `Extensions: Install from VSIX...` and choose the generated `mp-starter-vscode-ext-xxx.vsix` file

## Issues

Please report bugs, issues and feature requests by creating a [GitHub issue](https://github.com/MicroShed/mp-starter-vscode-ext/issues)
