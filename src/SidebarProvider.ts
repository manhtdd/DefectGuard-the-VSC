import * as vscode from 'vscode';

export class SidebarProvider implements vscode.WebviewViewProvider {

    public static readonly viewType = 'defect-guard-sidebar';
    private _view?: vscode.WebviewView;
    private _selectedLanguage: string;
    private _supportedLanguages: string[];

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _state: vscode.Memento
    ) {
        this._selectedLanguage = this._state.get<string>('selectedLanguage') || 'C';
        this._supportedLanguages = this._state.get<string[]>('supportedLanguages') || ['C', 'C++', 'Java', 'Python'];
    }

    // Getter for selectedLanguage
    get selectedLanguage(): string {
        return this._selectedLanguage;
    }

    // Setter for selectedLanguage
    set selectedLanguage(value: string) {
        // You can add validation or additional logic here if needed
        this._selectedLanguage = value;
    }

    public runDefectGuard(defectGuardOutput: any) {
        console.log(defectGuardOutput.deepjit)
        if (this._view) {
            this._view.show?.(true);
            this._view.webview.postMessage({
                type: 'runDefectGuard',
                data: {
                    defectGuardOutput: defectGuardOutput,
                    selectedLanguage: this._selectedLanguage,
                    supportedLanguages: this._supportedLanguages
                }
            });
        }
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'selectLanguage':
                    {
                        const selectedLanguage = data.data;

                        // Move the selectedLanguage to the top of the supportedLanguages list
                        const index = this._supportedLanguages.indexOf(selectedLanguage);
                        if (index !== -1) {
                            this._supportedLanguages.splice(index, 1); // Remove from the current position
                            this._supportedLanguages.unshift(selectedLanguage); // Add to the beginning of the list
                        }

                        this._selectedLanguage = selectedLanguage;

                        this._state.update('selectedLanguage', this._selectedLanguage);
                        this._state.update('supportedLanguages', this._supportedLanguages);

                        // Send a message back to the webview to update the UI
                        if (this._view) {
                            this._view.show?.(true);
                            this._view.webview.postMessage({
                                type: 'updateUI',
                                data: {
                                    selectedLanguage: this._selectedLanguage,
                                    supportedLanguages: this._supportedLanguages
                                }
                            });
                        }
                    }
            }
        });
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

        // // Create the options for the select element
        const languageOptions = this._supportedLanguages.map(language => `<option value="${language}" ${language === this.selectedLanguage ? 'selected' : ''}>${language}</option>`).join('');

        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat Colors</title>
			</head>
			<body>
                <h3>Defect Guard</h3>
                <p>A cutting-edge defect prediction tool with up-to-date Just-in-Time techniques and a robust API</p>

                <hr>

                <label for="language">Language:</label>
                <select id="language" name="language">
                    ${languageOptions}
                </select>

                <hr>

				<ul class=commit-list>
                </ul>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}