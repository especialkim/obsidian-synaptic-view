import { App, TFile, WorkspaceLeaf, setIcon, Notice } from 'obsidian';
import { SynapticViewSettings, SynapticContainer, QuickAccessFile, JournalGranularity } from '../settings';
import { FloatingButtonManager } from '../ui/floatingButton';
import { DailyNoteBadgeManager } from '../ui/dailyNoteBadge';
import { getJournalNotePath, createJournalNote } from '../utils/pluginChecker';
import { openPluginSettings } from '../utils/openSettings';
import { t } from '../utils/i18n';

/**
 * Synaptic View의 핵심 로직을 담당하는 클래스
 * - 커맨드로 열기
 * - New Tab 대체
 * 두 가지 방식 모두에서 재사용됩니다.
 */
export class SynapticView {
	private app: App;
	private settings: SynapticViewSettings;
	private floatingButtonManager: FloatingButtonManager | null = null;
	private currentFilePath: string | null = null;
	private dailyNoteBadgeManager: DailyNoteBadgeManager;

	constructor(app: App, settings: SynapticViewSettings, dailyNoteBadgeManager: DailyNoteBadgeManager) {
		this.app = app;
		this.settings = settings;
		this.dailyNoteBadgeManager = dailyNoteBadgeManager;
	}

	/**
	 * Initialize Synaptic View on the given leaf.
	 * @param leaf - WorkspaceLeaf to apply Synaptic View to
	 * @param initialFile - Initial file to load (uses default index if not provided)
	 */
	async initializeSynapticView(leaf: WorkspaceLeaf, initialFile?: QuickAccessFile | null) {
		const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);
		
		const container = leaf.view.containerEl;
		if (!container) return;
		
		// No enabled files - show setup message
		if (enabledFiles.length === 0) {
			const emptyState = container.querySelector('.empty-state');
			if (emptyState) {
				emptyState.empty();
				(emptyState as HTMLElement).addClass('synaptic-empty-state');
				this.showSetupMessage(emptyState as HTMLElement);
				return;
			}
		}
		
		// Determine file to load
		let quickAccessFileToLoad = initialFile;
		
		// If no initialFile provided, use default or first non-calendar/non-all file
		if (!quickAccessFileToLoad) {
			quickAccessFileToLoad = enabledFiles.find(file => {
				// Calendar type: auto-load excluded (user must select from calendar)
				if (file.type === 'calendar') return false;
				// 'all' granularity: auto-load excluded (submenu only)
				if (file.type === 'journal' && file.granularity === 'all') return false;
				return true;
			});
		}
		
		// No loadable items - show buttons only
		if (!quickAccessFileToLoad) {
			this.addFloatingButtonsOnly(leaf);
			return;
		}
		
		// Load file
		await this.loadFile(leaf, quickAccessFileToLoad, true);
	}

	/**
	 * 플로팅 버튼만 추가 (파일 로드 없이)
	 */
	private async addFloatingButtonsOnly(leaf: WorkspaceLeaf) {
		const container = leaf.view.containerEl;
		if (!container) return;
		
		// 기존 상태 보존
		const preservedFilePath = this.currentFilePath || null;
		const preservedActiveButtonId = this.floatingButtonManager?.currentActiveButtonId || null;
		
		// containerEl 전체에서 기존 버튼 제거 (view-content 내부 포함)
		const existingButtons = container.querySelectorAll('.synaptic-action-buttons');
		existingButtons.forEach(btn => btn.remove());
		
		// view-content 내부에 버튼 추가 (일관성 유지)
		const viewContent = container.querySelector('.view-content');
		const targetContainer = viewContent || container;

		// 이전 FloatingButtonManager 정리
		if (this.floatingButtonManager) {
			this.floatingButtonManager.unload();
		}

		this.floatingButtonManager = new FloatingButtonManager(
			this.app,
			this.settings,
			(qaf) => this.loadFile(leaf, qaf, false),
			this.dailyNoteBadgeManager,
			preservedFilePath,
			preservedActiveButtonId,
			() => this.dismissView(leaf)
		);
		this.floatingButtonManager.load();
		await this.floatingButtonManager.addFloatingButton(targetContainer as HTMLElement);
	}

	/**
	 * Quick Access 파일을 로드합니다.
	 * @param leaf - 파일을 열 WorkspaceLeaf
	 * @param quickAccessFile - 로드할 Quick Access 파일 정보
	 * @param isInitialLoad - 초기 로드 여부 (활성 버튼 ID 설정에 사용)
	 */
	async loadFile(leaf: WorkspaceLeaf, quickAccessFile: QuickAccessFile, isInitialLoad: boolean) {
		// Journal Note 타입이면 granularity에 따라 경로를 동적으로 계산
		let filePath = quickAccessFile.filePath;
		let granularity: JournalGranularity = 'day';
		if (quickAccessFile.type === 'journal') {
			granularity = quickAccessFile.granularity || 'day';
			
			// 'all'은 서브메뉴로만 선택 가능
			if (granularity === 'all') {
				return;
			}
			
			filePath = getJournalNotePath(granularity);
		}
		
		// 타입에 따른 기본 아이콘 설정
		const defaultIcon = quickAccessFile.type === 'journal' ? 'calendar-days' : 
		                    quickAccessFile.type === 'calendar' ? 'calendar-days' : 'file-text';
		const iconName = quickAccessFile.icon || defaultIcon;
		
		// Type에 따라 다르게 처리
		if (quickAccessFile.type === 'calendar') {
			// Calendar 타입은 버튼만 표시 (날짜 선택으로 파일 열기)
			this.addFloatingButtonsOnly(leaf);
			return;
		}
		
		if (quickAccessFile.type === 'file' || quickAccessFile.type === 'journal') {
			// File/Journal Note 타입: Obsidian 파일 열기
			let file = this.app.vault.getAbstractFileByPath(filePath);

			console.log('[Synaptic View] Loading file/journal:', {
				type: quickAccessFile.type,
				filePath,
				fileExists: !!file,
				granularity: quickAccessFile.type === 'journal' ? granularity : 'N/A'
			});

			// Journal Note 타입이고 파일이 없으면 granularity에 맞게 생성
			if (!file && quickAccessFile.type === 'journal') {
				console.log('[Synaptic View] Creating journal note:', granularity);
				file = await createJournalNote(granularity);
				if (!file) {
					console.log('[Synaptic View] Failed to create journal note');
					return;
			}
				// 생성된 파일의 실제 경로로 업데이트
				filePath = file.path;
				console.log('[Synaptic View] Journal note created:', filePath);
			}

			// File 타입인데 파일이 존재하지 않으면 사용자에게 알림하고 빈 상태로 UI만 표시
			if (!file && quickAccessFile.type === 'file') {
				const fileName = filePath.split('/').pop() || filePath;
				const translations = t();
				new Notice(`📄 "${fileName}" ${translations.settings.notices.fileNotFound}\n${translations.settings.notices.checkSettings}`);
				console.warn('[Synaptic View] File not found:', filePath);
				
				// 파일이 없어도 플로팅 버튼은 표시 (다른 파일로 전환 가능하도록)
				this.setLeafTitle(leaf, iconName);
				this.addFloatingButtonsOnly(leaf);
				return;
			}

			if (file instanceof TFile) {
				this.currentFilePath = filePath;

				// QuickAccess를 통한 탐색임을 DOM 속성으로 표시 (file-open 이벤트에서 확인용)
				const container = leaf.view.containerEl;
				if (container) {
					container.setAttribute('data-synaptic-quick-access', 'true');
				}

				// 실제로 Obsidian 뷰어로 파일 열기 (읽기 모드)
				await leaf.openFile(file, { state: { mode: 'preview' } });

				// DOM이 업데이트될 때까지 기다린 후 뷰 타이틀 변경 & 버튼 추가
				setTimeout(() => {
					console.log('[Synaptic View] Setting title and UI after file open, icon:', iconName);
					this.setLeafTitle(leaf, iconName);

					// 활성 버튼 ID 설정: 초기 로드 시 또는 현재 활성 버튼 ID 유지
					const activeButtonId = isInitialLoad ? quickAccessFile.id : (this.floatingButtonManager?.currentActiveButtonId || null);
					this.addContainerUI(leaf, filePath, activeButtonId);

					// QuickAccess 탐색 플래그 리셋
					if (container) {
						container.removeAttribute('data-synaptic-quick-access');
					}
				}, 50);
			}
		} else if (quickAccessFile.type === 'web') {
			// Web 타입: 현재 탭에서 URL 열기
			this.currentFilePath = filePath;

			// QuickAccess를 통한 탐색임을 DOM 속성으로 표시
			const webContainer = leaf.view.containerEl;
			if (webContainer) {
				webContainer.setAttribute('data-synaptic-quick-access', 'true');
			}

			// leaf에 webviewer 설정
			await leaf.setViewState({
				type: 'webviewer',
				state: { url: filePath }
			});

			// 웹페이지가 로드된 후 UI 업데이트
			setTimeout(() => {
				this.setLeafTitle(leaf, iconName);

				// 활성 버튼 ID 설정: 초기 로드 시 또는 현재 활성 버튼 ID 유지
				const activeButtonId = isInitialLoad ? quickAccessFile.id : (this.floatingButtonManager?.currentActiveButtonId || null);
				this.addContainerUI(leaf, filePath, activeButtonId);

				// QuickAccess 탐색 플래그 리셋
				if (webContainer) {
					webContainer.removeAttribute('data-synaptic-quick-access');
				}
			}, 100);
		}
	}
	
	/**
	 * 탭 타이틀과 아이콘을 설정합니다.
	 */
	private setLeafTitle(leaf: WorkspaceLeaf, iconName: string) {
		// leaf의 tabHeaderEl을 직접 사용 (활성화 여부와 관계없이)
		const tabHeaderEl = (leaf as WorkspaceLeaf & { tabHeaderEl?: HTMLElement }).tabHeaderEl;
		
		console.log('[Synaptic View] setLeafTitle called:', {
			hasTabHeaderEl: !!tabHeaderEl,
			iconName,
			leafId: (leaf as WorkspaceLeaf & { id?: string }).id
		});
		
		if (tabHeaderEl) {
			// Synaptic View 탭임을 표시하는 클래스 추가
			tabHeaderEl.addClass('synaptic-view-tab');
			
			// 아이콘 이름을 data attribute로 저장 (탭 전환 시에도 유지)
			tabHeaderEl.setAttribute('data-synaptic-icon', iconName);
			
			const titleEl = tabHeaderEl.querySelector('.workspace-tab-header-inner-title');
			const iconEl = tabHeaderEl.querySelector('.workspace-tab-header-inner-icon');
			
			console.log('[Synaptic View] Tab elements found:', {
				hasTitleEl: !!titleEl,
				hasIconEl: !!iconEl,
				currentIconData: tabHeaderEl.getAttribute('data-synaptic-icon')
			});
			
			if (titleEl) {
				titleEl.setText('Synaptic View');
			}
			
			// 아이콘 설정
			if (iconEl) {
				this.setTabIcon(iconEl, iconName);
			}
		}
	}

	/**
	 * 탭 아이콘을 설정합니다.
	 */
	private setTabIcon(iconEl: Element, iconName: string) {
		const htmlIconEl = iconEl as HTMLElement;
		
		// 기존 내용 제거
		htmlIconEl.empty();
		
		// 새 아이콘 설정
		setIcon(htmlIconEl, iconName);
	}

	/**
	 * Synaptic View 스타일 클래스를 적용합니다.
	 */
	private applySynapticViewClasses(container: HTMLElement) {
		// 기본 Synaptic View 클래스 추가
		container.addClass('synaptic-viewer-container');
		
		// Synaptic View로 관리되는 탭임을 표시 (cleanup 시 보호됨)
		container.setAttribute('data-synaptic-managed', 'true');
		
		// 스타일 옵션에 따라 추가 클래스 적용
		if (this.settings.hideInlineTitle) {
			container.addClass('hide-inline-title');
		} else {
			container.removeClass('hide-inline-title');
		}
		
		if (this.settings.hideEmbeddedMentions) {
			container.addClass('hide-embedded-mentions');
		} else {
			container.removeClass('hide-embedded-mentions');
		}
	}

	/**
	 * 컨테이너에 Synaptic View UI를 추가합니다.
	 * @param leaf - UI를 추가할 WorkspaceLeaf
	 * @param filePath - 현재 열린 파일 경로
	 * @param activeButtonId - 활성화할 버튼 ID (초기 로드 시)
	 */
	private async addContainerUI(leaf: WorkspaceLeaf, filePath: string, activeButtonId: string | null = null) {
		const container = leaf.view.containerEl;
		if (container) {
			this.applySynapticViewClasses(container);
			
			// containerEl 전체에서 기존 버튼 제거 (중복 방지)
			const existingButtons = container.querySelectorAll('.synaptic-action-buttons');
			existingButtons.forEach(btn => btn.remove());
			
			// .view-content 내부에 버튼 추가
			const viewContent = container.querySelector('.view-content');
			if (viewContent) {
				// 이전 FloatingButtonManager의 currentActiveButtonId 보존 (Journal all, Calendar 등에서 설정한 활성 상태 유지)
				const previousActiveButtonId = activeButtonId !== null
					? activeButtonId
					: (this.floatingButtonManager?.currentActiveButtonId || null);

				// filePath가 빈 문자열이면 현재 filePath 유지
				const actualFilePath = filePath || this.currentFilePath || null;

				// 이전 FloatingButtonManager 정리
				if (this.floatingButtonManager) {
					this.floatingButtonManager.unload();
				}

				this.floatingButtonManager = new FloatingButtonManager(
					this.app,
					this.settings,
					(qaf) => this.loadFile(leaf, qaf, false),
					this.dailyNoteBadgeManager,
					actualFilePath,
					previousActiveButtonId,
					() => this.dismissView(leaf)
				);
				this.floatingButtonManager.load();
				await this.floatingButtonManager.addFloatingButton(viewContent as HTMLElement);
			}
		}
	}

	/**
	 * 현재 FloatingButtonManager 반환 (외부에서 접근 가능)
	 */
	getFloatingButtonManager(): FloatingButtonManager | null {
		return this.floatingButtonManager;
	}

	/**
	 * 현재 파일 경로 반환
	 */
	getCurrentFilePath(): string | null {
		return this.currentFilePath;
	}

	/**
	 * Synaptic View를 해제하고 일반 탭으로 복원합니다.
	 */
	private dismissView(leaf: WorkspaceLeaf) {
		const container = leaf.view.containerEl;
		if (!container) return;

		// Synaptic View 클래스/속성 제거
		container.removeAttribute('data-synaptic-managed');
		container.removeClass('synaptic-viewer-container');
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

		// 탭 헤더 복원
		const tabHeaderEl = (leaf as WorkspaceLeaf & { tabHeaderEl?: HTMLElement }).tabHeaderEl;
		if (tabHeaderEl) {
			tabHeaderEl.removeClass('synaptic-view-tab');
			tabHeaderEl.removeAttribute('data-synaptic-icon');
		}

		// 컨테이너에 저장된 참조 정리
		delete (container as SynapticContainer)._synapticView;
		delete (container as SynapticContainer)._synapticDestroy;

		// FloatingButtonManager 정리
		this.destroy();
	}

	/**
	 * 설정 변경 시 열린 Synaptic View의 플로팅 버튼을 갱신합니다.
	 * 현재 보고 있는 파일/버튼 상태를 유지하면서 버튼 바만 재생성합니다.
	 */
	async refreshFloatingButtons(leaf: WorkspaceLeaf) {
		const container = leaf.view.containerEl;
		if (!container) return;

		const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);

		// Quick Access가 모두 비었으면 empty 상태로 전환
		if (enabledFiles.length === 0) {
			this.destroy();
			// 기존 버튼 제거
			const existingButtons = container.querySelectorAll('.synaptic-action-buttons');
			existingButtons.forEach(btn => btn.remove());
			// empty view로 전환
			await leaf.setViewState({ type: 'empty', active: true });
			const emptyState = container.querySelector('.empty-state');
			if (emptyState) {
				emptyState.empty();
				(emptyState as HTMLElement).addClass('synaptic-empty-state');
				this.showSetupMessage(emptyState as HTMLElement);
			}
			return;
		}

		// 현재 활성 버튼의 Quick Access 항목이 아직 존재하는지 확인
		const activeButtonId = this.floatingButtonManager?.currentActiveButtonId || null;
		const stillExists = activeButtonId
			? enabledFiles.some(f => f.id === activeButtonId)
			: false;

		if (stillExists) {
			// 현재 상태 유지하면서 버튼 바만 재생성
			this.addContainerUI(leaf, this.currentFilePath || '', activeButtonId);
		} else {
			// 삭제된 항목이었으면 전체 재초기화 (default로 전환)
			await this.initializeSynapticView(leaf);
		}
	}

	/**
	 * Quick Access가 비어있을 때 설정 안내 메시지를 표시합니다.
	 */
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

		settingsButton.addEventListener('click', async () => {
			await openPluginSettings(this.app);
		});
	}

	/**
	 * 리소스 정리 (플러그인 unload 시 호출)
	 */
	destroy() {
		if (this.floatingButtonManager) {
			this.floatingButtonManager.unload();
			this.floatingButtonManager = null;
		}
	}
}

