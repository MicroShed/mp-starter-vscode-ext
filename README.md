# VS Code MicroProfile Starter Extension

This is a VS Code extension for the MicroProfile Starter (https://start.microprofile.io/).  This extension makes use of the API https://test-start.microprofile.io/api/2.

## Input

The extension prompts for the following parameters:
1. groupId
2. artifactId 
3. Java SE version
4. MicroProfile server
5. MicroProfile specifications
6. A folder to generate the project into

The extension will generate a `.zip` file of the starter project, unzip the file into the specified directory and open it in a VS Code window.

## Installing the Extension
- download the latest `mp-starter-vscode-ext-0.x.vsix` file from [releases](https://github.com/MicroShed/mp-starter-vscode-ext/releases)
- from VS Code select `Install from vsix...` and select the `mp-starter-vscode-ext-0.x.vsix` file

### Generate and install the .vsix file
- `git clone git@github.com:MicroShed/mp-starter-vscode-ext.git`
- navigate to the cloned `mp-starter-vscode-ext` directory
- `vsce package` to generate the `mp-starter-vscode-ext-0.x.vsix` file
- from VS Code select `Install from vsix...` and select the `mp-starter-vscode-ext-0.x.vsix` file

### Start the extension in debug mode
- Open this example in VS Code 1.25+
- `npm install`
- `F5` to start debugging

## Contributing
Our [CONTRIBUTING](CONTRIBUTING.md) document contains details for submitting pull requests.
