import { Plugin, setIcon, addIcon } from 'obsidian';
import { SynapticViewSettings, DEFAULT_SETTINGS } from './src/settings';
import { SynapticViewSettingTab } from './src/settingsTab';
import { EmptyStateViewManager } from './src/views/emptyStateView';
import { DailyNoteBadgeManager } from './src/ui/dailyNoteBadge';
import { registerCommands } from './src/commands';
import {
	calendarDayIcon,
	calendarWeekIcon,
	calendarMonthIcon,
	calendarQuarterIcon,
	calendarYearIcon,
	calendarFoldIcon
} from './src/icons/calendarIcons';

export default class SynapticViewPlugin extends Plugin {
	settings: SynapticViewSettings;
	private emptyStateManager: EmptyStateViewManager;
	public dailyNoteBadgeManager: DailyNoteBadgeManager;

	async onload() {
		// Register custom calendar icons
		addIcon('calendar-day', calendarDayIcon);
		addIcon('calendar-week', calendarWeekIcon);
		addIcon('calendar-month', calendarMonthIcon);
		addIcon('calendar-quarter', calendarQuarterIcon);
		addIcon('calendar-year', calendarYearIcon);
		addIcon('calendar-fold', calendarFoldIcon);

		await this.loadSettings();

		// Daily Note Badge Manager initialization
		this.dailyNoteBadgeManager = new DailyNoteBadgeManager(this.app);

		// Empty State View Manager initialization
		this.emptyStateManager = new EmptyStateViewManager(this.app, this.settings, this.dailyNoteBadgeManager, this);

		// Register settings tab
		this.addSettingTab(new SynapticViewSettingTab(this.app, this));

		// Register commands
		registerCommands(this);

		// Execute after layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.customizeEmptyState();
			this.restoreSynapticViewTabIcons();
		});

		// Check on layout changes
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.customizeEmptyState();
			})
		);

		// Restore tab icons on active-leaf-change (탭 전환 시)
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.restoreSynapticViewTabIcons();
			})
		);

		// Daily Note task badge 실시간 업데이트 (메타데이터 캐시 사용)
		// showDailyNoteBadge가 켜져있을 때만 리스너 등록
		if (this.settings.showDailyNoteBadge) {
			this.registerEvent(
				this.app.metadataCache.on('changed', (file) => {
					this.dailyNoteBadgeManager.updateBadgeFromCache(file);
				})
			);
		}
	}

	onunload() {
		// 이벤트 리스너 정리
		this.emptyStateManager.destroy();
	}

	async customizeEmptyState() {
		await this.emptyStateManager.customizeEmptyState();
	}

	/**
	 * Synaptic View 탭의 아이콘을 복원합니다.
	 * 탭 전환이나 레이아웃 변경 시 아이콘이 사라지는 것을 방지합니다.
	 */
	restoreSynapticViewTabIcons() {
		// 모든 Synaptic View 탭 찾기
		const synapticTabHeaders = document.querySelectorAll('.workspace-tab-header.synaptic-view-tab');
		
		console.log('[Synaptic View] restoreSynapticViewTabIcons called:', {
			foundTabs: synapticTabHeaders.length
		});
		
		synapticTabHeaders.forEach((tabHeader, index) => {
			const iconEl = tabHeader.querySelector('.workspace-tab-header-inner-icon');
			const iconName = tabHeader.getAttribute('data-synaptic-icon');
			const hasSvg = iconEl ? !!(iconEl.querySelector('svg')) : false;
			
			console.log(`[Synaptic View] Tab ${index}:`, {
				hasIconEl: !!iconEl,
				iconName,
				hasSvg,
				needsRestore: iconEl && iconName && !hasSvg
			});
			
			// 아이콘 엘리먼트가 있고, 아이콘 이름이 저장되어 있으면 복원
			if (iconEl && iconName) {
				const htmlIconEl = iconEl as HTMLElement;
				
				// 아이콘이 비어있거나 SVG가 없으면 복원
				if (!htmlIconEl.querySelector('svg')) {
					console.log(`[Synaptic View] Restoring icon for tab ${index}:`, iconName);
					htmlIconEl.empty();
					setIcon(htmlIconEl, iconName);
				}
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
