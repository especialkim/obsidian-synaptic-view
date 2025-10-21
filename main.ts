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

		// Empty State View Manager initialization
		this.emptyStateManager = new EmptyStateViewManager(this.app, this.settings);

		// Register settings tab
		this.addSettingTab(new SynapticViewSettingTab(this.app, this));

		// Register commands
		registerCommands(this);

		// Execute after layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.customizeEmptyState();
		});

		// Check on layout changes
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.customizeEmptyState();
			})
		);
	}

	onunload() {
		// Plugin unloaded
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
