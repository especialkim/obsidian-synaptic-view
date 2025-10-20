import { Plugin } from 'obsidian';
import { SynapticViewSettings, DEFAULT_SETTINGS } from './src/settings';
import { SynapticViewSettingTab } from './src/settingsTab';
import { EmptyStateViewManager } from './src/views/emptyStateView';
import { registerCommands } from './src/commands';

export default class SynapticViewPlugin extends Plugin {
	settings: SynapticViewSettings;
	private emptyStateManager: EmptyStateViewManager;

	async onload() {
		await this.loadSettings();

		console.log('Synaptic View plugin loaded');

		// Empty State View Manager 초기화
		this.emptyStateManager = new EmptyStateViewManager(this.app, this.settings);

		// 설정 탭 등록
		this.addSettingTab(new SynapticViewSettingTab(this.app, this));

		// 커맨드 등록
		registerCommands(this);

		// 레이아웃이 준비된 후 실행
		this.app.workspace.onLayoutReady(() => {
			this.customizeEmptyState();
		});

		// 레이아웃 변경 시마다 체크
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.customizeEmptyState();
			})
		);
	}

	onunload() {
		console.log('Synaptic View plugin unloaded');
	}

	async customizeEmptyState() {
		await this.emptyStateManager.customizeEmptyState();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
