import * as vscode from "vscode";
import * as starter from "./util/starter";

// this method is called when the extension is activated
// the extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
	context.subscriptions.push(
		vscode.commands.registerCommand("extension.microProfileStarter", () => starter.generateProject())
	);
}

// this method is called when the extension is deactivated
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function deactivate(): void { }
