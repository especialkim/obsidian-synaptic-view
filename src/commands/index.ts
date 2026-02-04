import { Plugin } from 'obsidian';
import { openSynapticViewTab } from './openSynapticViewCommand';
import { addCurrentFileToQuickAccess } from './addCurrentFileCommand';
import SynapticViewPlugin from '../../main';

/**
 * 플러그인의 모든 커맨드를 등록합니다.
 */
export function registerCommands(plugin: SynapticViewPlugin) {
	// Synaptic View 탭 열기 커맨드
	plugin.addCommand({
		id: 'open-synaptic-view',
		name: 'Open Synaptic View tab',
		callback: async () => {
			await openSynapticViewTab(plugin.app, plugin.settings, plugin.dailyNoteBadgeManager);
		}
	});

	// 현재 파일을 Quick Access에 추가하는 커맨드 (활성 파일이 있을 때만 사용 가능)
	plugin.addCommand({
		id: 'add-current-file-to-quick-access',
		name: 'Add current file to Quick Access',
		checkCallback: (checking: boolean) => {
			const activeFile = plugin.app.workspace.getActiveFile();
			if (activeFile) {
				if (!checking) {
					addCurrentFileToQuickAccess(plugin);
				}
				return true;
			}
			return false;
		}
	});
}

