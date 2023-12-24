import * as vscode from 'vscode';
import { callDefectGuard } from './utils/utils'
import { SidebarProvider } from './SidebarProvider';

export async function activate(context: vscode.ExtensionContext) {
	// Create an instance of vscode.Memento for storing the state
	const state = context.workspaceState;
	
	// Create an instance of SidebarProvider
	const sidebarProvider = new SidebarProvider(
		context.extensionUri,
		state
	);

	const mainLanguage = sidebarProvider.selectedLanguage;
	const defectGuardOutput = await callDefectGuard(mainLanguage);
	sidebarProvider.runDefectGuard(defectGuardOutput);

	vscode.workspace.onDidChangeWorkspaceFolders(async () => {
		const mainLanguage = sidebarProvider.selectedLanguage;
		const defectGuardOutput = await callDefectGuard(mainLanguage);
		sidebarProvider.runDefectGuard(defectGuardOutput);
	});

	vscode.workspace.onDidOpenTextDocument(async () => {
		const mainLanguage = sidebarProvider.selectedLanguage;
		const defectGuardOutput = await callDefectGuard(mainLanguage);
		sidebarProvider.runDefectGuard(defectGuardOutput);
	});

	vscode.workspace.onDidSaveTextDocument(async () => {
		const mainLanguage = sidebarProvider.selectedLanguage;
		const defectGuardOutput = await callDefectGuard(mainLanguage);
		sidebarProvider.runDefectGuard(defectGuardOutput);
	})

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(SidebarProvider.viewType, sidebarProvider)
	);
}

export function deactivate() { }
