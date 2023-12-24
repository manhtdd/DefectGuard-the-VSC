import * as vscode from 'vscode';
import { exec } from 'child_process';

export function callDefectGuard(mainLanguage: any): Promise<Object> {
	console.log(`callDefectGuard: ${mainLanguage}`)
	let wf = vscode.workspace.workspaceFolders[0].uri.path;
	const command = `defectguard -models deepjit -dataset platform -repo ${wf} -uncommit -top 9 -main_language ${mainLanguage} -sort`;

	return new Promise<Object>((resolve) => {
		exec(command, (error, stdout, stderr) => {
			const jsonStringWithDoubleQuotes = stdout.replace(/'/g, '"');
			var json = JSON.parse(jsonStringWithDoubleQuotes)
			if (!error) {
				resolve(json);
			} else {
				console.log(stderr)
				resolve({});
			}
		});
	});
}