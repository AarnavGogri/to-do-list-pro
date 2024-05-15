import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "todolist" is now active!');

    let disposable = vscode.commands.registerCommand('todolist.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World from TodoList!');
    });

    context.subscriptions.push(disposable);

    let disposable2 = vscode.commands.registerCommand('to-do-list-pro.findTODOs', async () => {
        class SampleDataProvider implements vscode.TreeDataProvider<any> {
            getTreeItem(element: any): vscode.TreeItem {
                return element;
            }

            async getChildren(element?: any): Promise<any[]> {
                if (!vscode.workspace.workspaceFolders) {
                    return [];
                }

                if (!element) {
                    let todos: any[] = [];

                    for (const workspaceFolder of vscode.workspace.workspaceFolders) {
                        const pattern = new vscode.RelativePattern(workspaceFolder, '**/*.java');
                        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

                        for (const file of files) {
                            const document = await vscode.workspace.openTextDocument(file);
                            const documentText = document.getText();
                            const todoRegex = /\/\/ TODO: (.*)/g;
                            let match;

                            while ((match = todoRegex.exec(documentText))) {
                                const line = document.positionAt(match.index).line;
                                const todoLabel = `TODO at line ${line + 1}: ${match[1]}`;
                                const treeItem = new vscode.TreeItem(`${match[1]}`);
                                treeItem.command = {
                                    command: 'todolist.handleTodoItemClick',
                                    title: 'Open TODO',
                                    arguments: [todoLabel, file.fsPath]
                                };
                                todos.push(treeItem);
                            }
                        }
                    }

                    return todos;
                }
                return [];
            }
        }

        const dataProvider = new SampleDataProvider();
        vscode.window.registerTreeDataProvider('your-view-id', dataProvider);

        // Register command to handle item selection only once
        if (!context.globalState.get('todolist.handleTodoItemClickRegistered')) {
            vscode.commands.registerCommand('todolist.handleTodoItemClick', (label: string, filePath: string) => {
                handleTodoItemClick(label, filePath);
            });
            context.globalState.update('todolist.handleTodoItemClickRegistered', true);
        }
    });

    context.subscriptions.push(disposable2);

    // Define method to handle item click and navigate to the TODO
    function handleTodoItemClick(label: string, filePath: string) {
        vscode.workspace.openTextDocument(filePath).then(doc => {
            const line = Number(label.match(/line (\d+)/)?.[1]) - 1 || 0;
            vscode.window.showTextDocument(doc, { selection: new vscode.Range(line, 0, line, 0) });
        });
    }
}

export function deactivate() {}
