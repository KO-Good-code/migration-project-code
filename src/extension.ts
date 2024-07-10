import * as vscode from 'vscode';
import simpleGit from 'simple-git';
import * as fs from 'fs-extra';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('extension.migrateNewFiles', async () => {
    const git = simpleGit(vscode.workspace.rootPath || '');
    
    try {
      // 获取最新的提交
      const log = await git.log();
      const latestCommit = log.latest?.hash;

      if (!latestCommit) {
        vscode.window.showErrorMessage('No commits found in the repository.');
        return;
      }

      // 获取新添加的文件
      const diffSummary = await git.diffSummary([latestCommit + '^!', '--diff-filter=A']);
      const newFiles = diffSummary.files.map(file => file.file);

      if (newFiles.length === 0) {
        vscode.window.showInformationMessage('No new files found in the latest commit.');
        return;
      }

      // 选择目标目录
      const targetDirUri = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Select Target Directory'
      });

      if (!targetDirUri || targetDirUri.length === 0) {
        vscode.window.showErrorMessage('Target directory not selected.');
        return;
      }

      const targetDir = targetDirUri[0].fsPath;

      // 复制文件
      for (const newFile of newFiles) {
        const sourcePath = path.join(vscode.workspace.rootPath || '', newFile);
        const targetPath = path.join(targetDir, newFile);

        await fs.copy(sourcePath, targetPath);
      }

      vscode.window.showInformationMessage('New files successfully migrated to target project.');
    } catch (error: any) {
      vscode.window.showErrorMessage('An error occurred: ' + error.message);
    }
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}