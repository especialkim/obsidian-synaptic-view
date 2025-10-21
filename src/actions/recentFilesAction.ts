import { App } from 'obsidian';

export function showRecentFiles(app: App) {
	// Obsidian의 "최근 파일 열기" 명령어 실행
	app.commands.executeCommandById('file-explorer:open-recent-file');
}

