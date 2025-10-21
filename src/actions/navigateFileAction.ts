import { App } from 'obsidian';

export function navigateToFile(app: App) {
	// Obsidian의 "Quick Switcher" 명령어 실행 (Cmd+O와 동일)
	app.commands.executeCommandById('switcher:open');
}

