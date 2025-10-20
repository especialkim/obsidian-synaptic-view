import { Plugin } from 'obsidian';
import { openSynapticViewTab } from './openSynapticViewCommand';
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
			await openSynapticViewTab(plugin.app, plugin.settings);
		}
	});
}

