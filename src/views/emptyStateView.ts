import { App, TFile, Component, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { SynapticViewSettings } from '../settings';
import { SynapticView } from './synapticView';
import { openPluginSettings } from '../utils/openSettings';
import { getJournalNotePath } from '../utils/pluginChecker';

/**
 * New Tab을 Synaptic View로 대체하는 기능을 담당
 * (설정에서 on/off 가능하도록 예정)
 */
export class EmptyStateViewManager {
	private app: App;
	private settings: SynapticViewSettings;
	private synapticViews: Map<WorkspaceLeaf, SynapticView> = new Map();
	private component: Component;

	constructor(app: App, settings: SynapticViewSettings) {
		this.app = app;
		this.settings = settings;
		this.component = new Component();
		this.component.load();
		
		// file-open 이벤트 감지: QuickAccess 외의 방법으로 파일을 열면 Synaptic View 속성 제거
		this.component.registerEvent(
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
			
			// 활성화된 파일이 있는지 확인
			const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);
			
			// 등록된 파일이 없을 때 안내 메시지 표시
			if (enabledFiles.length === 0) {
				const emptyState = container.querySelector('.empty-state');
				if (!emptyState) continue;

				emptyState.empty();
				emptyState.addClass('synaptic-empty-state');
				this.showSetupMessage(emptyState as HTMLElement);
				continue;
			}
			
			// defaultViewIndex에 해당하는 파일 선택 (1-based index)
			const defaultIndex = Math.max(1, Math.min(this.settings.defaultViewIndex, enabledFiles.length));
			const defaultFile = enabledFiles[defaultIndex - 1];
			
			// Synaptic View 초기화 (defaultFile을 초기 파일로 전달)
			const synapticView = new SynapticView(this.app, this.settings);
			this.synapticViews.set(leaf, synapticView);
			await synapticView.initializeSynapticView(leaf, defaultFile);
		}
	}

	/**
	 * file-open 이벤트 핸들러
	 * QuickAccess를 통하지 않은 파일 열기 시 Synaptic View 속성 제거
	 */
	private handleFileOpen(file: TFile | null) {
		if (!file) return;
		
		// 활성화된 leaf 확인
		const activeLeaf = this.app.workspace.activeLeaf;
		if (!activeLeaf) return;
		
		const container = activeLeaf.view.containerEl;
		if (!container) return;
		
		// Synaptic View로 관리되는 컨테이너인지 확인
		if (!container.hasClass('synaptic-viewer-container')) return;
		
		// 해당 leaf의 SynapticView 인스턴스 확인
		const synapticView = this.synapticViews.get(activeLeaf);
		if (!synapticView) {
			return;
		}
		
		// QuickAccess를 통한 탐색인지 확인
		if (synapticView.isQuickAccessNavigationActive()) {
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
		
		// 플로팅 버튼 제거
		const viewContent = container.querySelector('.view-content');
		if (viewContent) {
			const floatingButtons = viewContent.querySelector('.synaptic-action-buttons');
			if (floatingButtons) {
				floatingButtons.remove();
			}
		}
		
		// synapticViews Map에서 제거
		this.synapticViews.delete(activeLeaf);
	}

	private showSetupMessage(container: HTMLElement) {
		container.empty();
		const contentDiv = container.createDiv({ cls: 'synaptic-setup-message' });
		
		contentDiv.createEl('h2', { text: '🎯 Synaptic View' });
		contentDiv.createEl('p', { 
			text: 'No Quick Access items configured.',
			cls: 'synaptic-setup-text'
		});
		contentDiv.createEl('p', { 
			text: 'Add items in settings to get started.',
			cls: 'synaptic-setup-text'
		});
		
		const buttonDiv = contentDiv.createDiv({ cls: 'synaptic-setup-button-container' });
		const settingsButton = buttonDiv.createEl('button', { 
			text: '⚙️ Open Settings',
			cls: 'mod-cta synaptic-setup-button'
		});
		
		settingsButton.addEventListener('click', async () => {
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
					
					// 플로팅 버튼 제거 (.view-content 내부 확인)
					const viewContent = container.querySelector('.view-content');
					if (viewContent) {
						const floatingButtons = viewContent.querySelector('.synaptic-action-buttons');
						if (floatingButtons) {
							floatingButtons.remove();
						}
					}
					
					// 혹시 컨테이너 직속에도 있을 수 있으니 확인
					const directButtons = container.querySelector('.synaptic-action-buttons');
					if (directButtons) {
						directButtons.remove();
					}
				}
			}
		});
		
		// 탭 헤더의 synaptic-view-tab 클래스도 정리
		const synapticTabHeaders = document.querySelectorAll('.workspace-tab-header.synaptic-view-tab');
		
		synapticTabHeaders.forEach(tabHeader => {
			const tabEl = tabHeader as HTMLElement;
			const ariaLabel = tabEl.getAttribute('aria-label') || '';
			
			// Quick Access 파일명 목록
			const quickAccessFileNames = this.settings.quickAccessFiles
				.filter(f => f.enabled)
				.map(f => {
					const fileName = f.filePath.split('/').pop() || f.filePath;
					return fileName.replace('.md', '');
				});
			
			const isQuickAccessFile = ariaLabel === 'Synaptic View' || 
				quickAccessFileNames.includes(ariaLabel);
			
			if (!isQuickAccessFile) {
				tabHeader.removeClass('synaptic-view-tab');
			}
		});
	}
}
