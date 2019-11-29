# VS Code MicroProfile Starter Extension

The MicroProfile Starter extension provides support for generating a MicroProfile Maven project with examples based on the Eclipse MicroProfile Starter project (https://start.microprofile.io/) by the MicroProfile community. You will be able to generate a project by choosing a MicroProfile version, server and specifications, such as CDI, Config, Health Check, Metrics, and more.  This extension is hosted under the MicroShed organization. 

## Quick Start
* Install the extension 
* Launch the VS Code command palette, then select `MicroProfile: MicroProfile Starter` to run the extension

## Input

The extension prompts for the following parameters:
1. groupId
2. artifactId 
3. Java SE version
4. MicroProfile server
5. MicroProfile specifications
6. A directory to generate the project into

The extension will generate a `.zip` file of the starter project, unzip the file into the specified directory and open it in a VS Code window.

## Contributing
Our [CONTRIBUTING](CONTRIBUTING.md) document contains details for submitting pull requests.
