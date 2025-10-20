import { App } from 'obsidian';

export function createNewFile(app: App) {
	// Obsidian의 기본 "새 노트" 명령어 실행 (Cmd+N과 동일)
	(app as any).commands.executeCommandById('file-explorer:new-file');
}

