import { App } from 'obsidian';

/**
 * Obsidian 설정 페이지를 열고 특정 플러그인 탭으로 이동
 * @param app - Obsidian App 인스턴스
 * @param pluginId - 이동할 플러그인 ID (기본값: 'obsidian-synaptic-view')
 */
export async function openPluginSettings(app: App, pluginId: string = 'obsidian-synaptic-view'): Promise<void> {
	// Obsidian의 공식 API를 사용하여 설정 열기
	await app.setting.open();
	app.setting.openTabById(pluginId);
}

