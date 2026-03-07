import { App, Component, TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { SynapticViewSettings, SynapticContainer, SynapticLeaf } from '../settings';
import { SynapticView } from './synapticView';
import { DailyNoteBadgeManager } from '../ui/dailyNoteBadge';
import { openPluginSettings } from '../utils/openSettings';
import { getJournalNotePath } from '../utils/pluginChecker';
import { t } from '../utils/i18n';

/**
 * New Tab을 Synaptic View로 대체하는 기능을 담당
 * (설정에서 on/off 가능하도록 예정)
 */
export class EmptyStateViewManager extends Component {
	private app: App;
	private settings: SynapticViewSettings;
	private dailyNoteBadgeManager: DailyNoteBadgeManager;

	constructor(app: App, settings: SynapticViewSettings, dailyNoteBadgeManager: DailyNoteBadgeManager) {
		super();
		this.app = app;
		this.settings = settings;
		this.dailyNoteBadgeManager = dailyNoteBadgeManager;

		// file-open 이벤트 감지: QuickAccess 외의 방법으로 파일을 열면 Synaptic View 속성 제거
		this.registerEvent(
			this.app.workspace.on('file-open', (file) => {
				this.handleFileOpen(file);
			})
		);
	}

	async customizeEmptyState() {
		// New Tab 대체 기능이 비활성화되어 있으면 아무것도 하지 않음 (Obsidian 기본 동작)
		if (!this.settings.replaceNewTabWithSynapticView) {
			return;
		}

		// Synaptic View 탭에서 일반 파일이 열린 경우 클래스 제거
		this.cleanupNonSynapticTabs();

		// 모든 빈 탭을 찾아서 Synaptic View로 변환
		const leaves = this.app.workspace.getLeavesOfType('empty');
		
		for (const leaf of leaves) {
			const container = leaf.view.containerEl;
			if (!container) continue;
			if (this.isHoverPreviewLeaf(container)) continue;

			const synapticLeaf = leaf as unknown as SynapticLeaf;
			if (synapticLeaf._synapticView) {
				continue;
			}
			
			// True initial open: default item auto-open / setup screen rendering 유지
			const synapticView = this.createSynapticView(leaf, container);
			await synapticView.initializeSynapticView(leaf);
		}
	}

	private createSynapticView(leaf: WorkspaceLeaf, container: HTMLElement): SynapticView {
		const synapticView = new SynapticView(this.app, this.settings, this.dailyNoteBadgeManager);
		this.register(() => synapticView.destroy());
		(leaf as unknown as SynapticLeaf)._synapticView = synapticView;
		(container as SynapticContainer)._synapticDestroy = () => synapticView.destroy();
		return synapticView;
	}

	private isHoverPreviewLeaf(container: HTMLElement): boolean {
		return container.closest('.hover-popover') !== null;
	}

	/**
	 * file-open 이벤트 핸들러
	 * QuickAccess를 통하지 않은 파일 열기 시 Synaptic View 속성 제거
	 */
	private handleFileOpen(file: TFile | null) {
		if (!file) return;
		
		// 활성화된 leaf 확인
		const activeLeaf = this.app.workspace.getMostRecentLeaf();
		if (!activeLeaf) return;
		
		const container = activeLeaf.view.containerEl;
		if (!container) return;
		
		// Synaptic View로 관리되는 컨테이너인지 확인
		if (!container.hasClass('synaptic-viewer-container')) return;
		
		// QuickAccess를 통한 탐색인지 확인 (DOM 속성으로 체크)
		if (container.getAttribute('data-synaptic-quick-access') === 'true') {
			return;
		}

		const synapticView = (activeLeaf as unknown as SynapticLeaf)._synapticView;
		const currentSynapticPath = synapticView?.getCurrentFilePath();

		// 같은 파일을 다시 활성화한 경우는 탭 전환으로 간주하고 유지
		if (currentSynapticPath && currentSynapticPath === file.path) {
			return;
		}
		
		// QuickAccess가 아닌 다른 방법으로 파일을 열었으면 Synaptic View 속성 제거
		
		// data-synaptic-managed 제거
		container.removeAttribute('data-synaptic-managed');
		
		// synaptic-viewer-container 클래스 제거
		container.removeClass('synaptic-viewer-container');
		
		// 스타일 클래스 제거
		container.removeClass('hide-inline-title');
		container.removeClass('hide-embedded-mentions');
		container.querySelector('.synaptic-setup-message')?.remove();
		const emptyState = container.querySelector('.empty-state') as HTMLElement | null;
		emptyState?.removeClass('synaptic-empty-state');

		// 플로팅 버튼 제거
		const floatingButtons = container.querySelectorAll('.synaptic-action-buttons');
		floatingButtons.forEach(button => button.remove());

		// SynapticView 리소스 정리 (document-level 리스너 해제)
		const destroyFn = (container as SynapticContainer)._synapticDestroy;
		if (destroyFn) {
			destroyFn();
			delete (container as SynapticContainer)._synapticDestroy;
		}

		delete (activeLeaf as unknown as SynapticLeaf)._synapticView;
	}

	private showSetupMessage(container: HTMLElement) {
		const translations = t();
		container.empty();
		const contentDiv = container.createDiv({ cls: 'synaptic-setup-message' });
		
		contentDiv.createEl('h2', { text: translations.settings.setup.title });
		contentDiv.createEl('p', { 
			text: translations.settings.setup.noItems,
			cls: 'synaptic-setup-text'
		});
		contentDiv.createEl('p', { 
			text: translations.settings.setup.addItems,
			cls: 'synaptic-setup-text'
		});
		
		const buttonDiv = contentDiv.createDiv({ cls: 'synaptic-setup-button-container' });
		const settingsButton = buttonDiv.createEl('button', { 
			text: translations.settings.setup.openSettings,
			cls: 'mod-cta synaptic-setup-button'
		});
		
		this.registerDomEvent(settingsButton, 'click', async () => {
			await openPluginSettings(this.app);
		});
	}

	private cleanupNonSynapticTabs() {
		// Quick Access 파일 경로 목록 준비
		const quickAccessPaths = this.settings.quickAccessFiles
			.filter(f => f.enabled)
			.map(f => {
				// journal 타입이면 granularity에 따라 경로를 동적으로 계산
				if (f.type === 'journal') {
					const granularity = f.granularity || 'day';
					return getJournalNotePath(granularity);
				}
				return f.filePath;
			});
		
		
		// 모든 leaf를 순회하면서 정리
		this.app.workspace.iterateAllLeaves(leaf => {
			const container = leaf.view.containerEl;
			
			// synaptic-viewer-container 클래스가 있는 컨테이너만 체크
			if (container.hasClass('synaptic-viewer-container')) {
				
				// Synaptic View로 관리되는 leaf는 건드리지 않음
				// (data-synaptic-managed attribute로 표시됨)
				if (container.getAttribute('data-synaptic-managed') === 'true') {
					return;
				}
				
				// 현재 leaf에 열린 파일 확인
				const file = leaf.view instanceof MarkdownView ? leaf.view.file : undefined;
				const filePath = file?.path || null;
				
				
				// Quick Access 파일인지 확인
				const isQuickAccessFile = filePath && quickAccessPaths.includes(filePath);
				
				
				if (!isQuickAccessFile) {
					
					// synaptic-viewer-container 클래스 제거
					container.removeClass('synaptic-viewer-container');
					container.querySelector('.synaptic-setup-message')?.remove();
					const emptyState = container.querySelector('.empty-state') as HTMLElement | null;
					emptyState?.removeClass('synaptic-empty-state');
					
					const floatingButtons = container.querySelectorAll('.synaptic-action-buttons');
					floatingButtons.forEach(button => button.remove());
				}
			}
		});
		
		// 탭 헤더의 synaptic-view-tab 클래스도 정리
		const synapticTabHeaders = document.querySelectorAll('.workspace-tab-header.synaptic-view-tab');
		
		synapticTabHeaders.forEach((tabHeader) => {
			const tabEl = tabHeader as HTMLElement;
			
			// data-synaptic-icon attribute가 있으면 Synaptic View 탭으로 유지
			const hasSynapticIcon = tabEl.getAttribute('data-synaptic-icon');
			
			// 타이틀이 "Synaptic View"인지 확인
			const titleEl = tabEl.querySelector('.workspace-tab-header-inner-title');
			const title = titleEl?.textContent || '';
			const isSynapticViewTitle = title === 'Synaptic View';
			
			// data-synaptic-icon이 있거나 타이틀이 "Synaptic View"면 유지
			if (!hasSynapticIcon && !isSynapticViewTitle) {
				tabHeader.removeClass('synaptic-view-tab');
			}
		});
	}

}
