import { Plugin, WorkspaceLeaf, setIcon, addIcon } from 'obsidian';
import { SynapticViewSettings, SynapticContainer, SynapticLeaf, DEFAULT_SETTINGS } from './src/settings';
import { SynapticViewSettingTab } from './src/settingsTab';
import { EmptyStateViewManager } from './src/views/emptyStateView';
import { SynapticView } from './src/views/synapticView';
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
	private refreshOpenViewsTimeout: number | null = null;

	private isLeafVisiblyRendered(leaf: { view: { containerEl: HTMLElement } }): boolean {
		const container = leaf.view.containerEl;
		return container.isConnected && (container.offsetParent !== null || container.getClientRects().length > 0);
	}

	private ensureSynapticLeaf(leaf: WorkspaceLeaf): SynapticLeaf | null {
		const synapticLeaf = leaf as unknown as SynapticLeaf;
		if (synapticLeaf._synapticView) {
			return synapticLeaf;
		}

		const tabHeaderEl = (leaf as WorkspaceLeaf & { tabHeaderEl?: HTMLElement }).tabHeaderEl;
		const hasSynapticTabMarker = !!tabHeaderEl?.hasClass('synaptic-view-tab') || !!tabHeaderEl?.getAttribute('data-synaptic-icon');
		if (!hasSynapticTabMarker) {
			return null;
		}

		const container = leaf.view.containerEl;
		if (!container) {
			return null;
		}

		const synapticView = new SynapticView(this.app, this.settings, this.dailyNoteBadgeManager);
		this.register(() => synapticView.destroy());
		synapticView.syncCurrentLeafState(leaf);
		synapticLeaf._synapticView = synapticView;
		(container as SynapticContainer)._synapticDestroy = () => synapticView.destroy();
		return synapticLeaf;
	}

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
		this.emptyStateManager = this.addChild(new EmptyStateViewManager(this.app, this.settings, this.dailyNoteBadgeManager));

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
			this.app.workspace.on('active-leaf-change', (leaf) => {
				this.restoreSynapticViewTabIcons();
				if (!leaf) {
					return;
				}

				const synapticLeaf = this.ensureSynapticLeaf(leaf);
				if (synapticLeaf?._synapticView) {
					void synapticLeaf._synapticView.refreshFloatingButtons(leaf);
				}
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
		if (this.refreshOpenViewsTimeout !== null) {
			window.clearTimeout(this.refreshOpenViewsTimeout);
			this.refreshOpenViewsTimeout = null;
		}
		// EmptyStateViewManager는 addChild로 등록되어 자동 정리됨
	}

	async customizeEmptyState() {
		await this.emptyStateManager.customizeEmptyState();
	}

	/**
	 * 열려있는 Synaptic View 탭의 UI만 비내비게이션 방식으로 갱신합니다.
	 */
	refreshOpenSynapticViews() {
		if (this.refreshOpenViewsTimeout !== null) {
			window.clearTimeout(this.refreshOpenViewsTimeout);
		}

		this.refreshOpenViewsTimeout = window.setTimeout(() => {
			this.refreshOpenViewsTimeout = null;
			this.app.workspace.iterateAllLeaves(leaf => {
				const synapticLeaf = this.ensureSynapticLeaf(leaf);
				if (synapticLeaf?._synapticView) {
					if (this.isLeafVisiblyRendered(leaf)) {
						void synapticLeaf._synapticView.refreshFloatingButtons(leaf);
					} else {
						synapticLeaf._synapticView.markFloatingButtonRefreshPending();
					}
				}
			});
		}, 0);
	}

	/**
	 * Synaptic View 탭의 아이콘을 복원합니다.
	 * 탭 전환이나 레이아웃 변경 시 아이콘이 사라지는 것을 방지합니다.
	 */
	restoreSynapticViewTabIcons() {
		// 모든 Synaptic View 탭 찾기
		const synapticTabHeaders = document.querySelectorAll('.workspace-tab-header.synaptic-view-tab');
		
		synapticTabHeaders.forEach((tabHeader) => {
			const iconEl = tabHeader.querySelector('.workspace-tab-header-inner-icon');
			const iconName = tabHeader.getAttribute('data-synaptic-icon');
			
			// 아이콘 엘리먼트가 있고, 아이콘 이름이 저장되어 있으면 복원
			if (iconEl && iconName) {
				const htmlIconEl = iconEl as HTMLElement;
				
				// 아이콘이 비어있거나 SVG가 없으면 복원
				if (!htmlIconEl.querySelector('svg')) {
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
