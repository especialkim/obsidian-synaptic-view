import { App, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { SynapticViewSettings, QuickAccessFile, JournalGranularity } from '../settings';
import { FloatingButtonManager } from '../ui/floatingButton';
import { getJournalNotePath, createJournalNote } from '../utils/pluginChecker';

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

	constructor(app: App, settings: SynapticViewSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * 주어진 leaf에 Synaptic View를 초기화합니다.
	 * @param leaf - Synaptic View를 적용할 WorkspaceLeaf
	 * @param initialFile - 초기 로드할 파일 (없으면 첫 번째 활성화된 파일)
	 */
	async initializeSynapticView(leaf: WorkspaceLeaf, initialFile?: QuickAccessFile | null) {
		console.log('[SynapticView.initializeSynapticView] 시작');
		
		const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);
		console.log('[SynapticView] 활성화된 파일 개수:', enabledFiles.length);
		
		const container = leaf.view.containerEl;
		if (!container) return;
		
		// 활성화된 파일이 없으면 안내 메시지만 표시
		if (enabledFiles.length === 0) {
			const emptyState = container.querySelector('.empty-state');
			if (emptyState) {
				// 안내 메시지는 emptyStateView에서 처리하도록 위임
				return;
			}
		}
		
		// 로드할 파일 결정
		const quickAccessFileToLoad = initialFile || enabledFiles.find(file => {
			// Calendar 타입은 자동 로드 제외
			if (file.type === 'calendar') return false;
			// 'all' granularity는 자동 로드 제외
			if (file.type === 'journal' && file.granularity === 'all') return false;
			return true;
		});
		
		// 로드 가능한 항목이 없으면 버튼만 표시
		if (!quickAccessFileToLoad) {
			console.log('[SynapticView] 자동 로드 가능한 항목이 없습니다 - 버튼만 표시');
			this.addFloatingButtonsOnly(leaf);
			return;
		}
		
		console.log('[SynapticView] 로드할 항목:', quickAccessFileToLoad);
		
		// 파일 로드
		await this.loadFile(leaf, quickAccessFileToLoad, true);
	}

	/**
	 * 플로팅 버튼만 추가 (파일 로드 없이)
	 */
	private addFloatingButtonsOnly(leaf: WorkspaceLeaf) {
		const container = leaf.view.containerEl;
		if (!container) return;
		
		const existingButtons = container.querySelector('.synaptic-action-buttons');
		if (existingButtons) {
			existingButtons.remove();
		}
		
		this.floatingButtonManager = new FloatingButtonManager(
			this.app,
			this.settings,
			(qaf) => this.loadFile(leaf, qaf, false),
			null,
			null
		);
		this.floatingButtonManager.addFloatingButton(container);
	}

	/**
	 * Quick Access 파일을 로드합니다.
	 * @param leaf - 파일을 열 WorkspaceLeaf
	 * @param quickAccessFile - 로드할 Quick Access 파일 정보
	 * @param isInitialLoad - 초기 로드 여부 (활성 버튼 ID 설정에 사용)
	 */
	async loadFile(leaf: WorkspaceLeaf, quickAccessFile: QuickAccessFile, isInitialLoad: boolean) {
		console.log('[SynapticView.loadFile] 시작 - quickAccessFile:', quickAccessFile);
		
		// Journal Note 타입이면 granularity에 따라 경로를 동적으로 계산
		let filePath = quickAccessFile.filePath;
		let granularity: JournalGranularity = 'day';
		if (quickAccessFile.type === 'journal') {
			granularity = quickAccessFile.granularity || 'day';
			
			// 'all'은 서브메뉴로만 선택 가능
			if (granularity === 'all') {
				console.log('[SynapticView.loadFile] All granularity는 아직 구현되지 않았습니다');
				return;
			}
			
			filePath = getJournalNotePath(granularity);
			console.log(`[SynapticView.loadFile] ${granularity} Journal Note 경로:`, filePath);
		}
		
		// 타입에 따른 기본 아이콘 설정
		const defaultIcon = quickAccessFile.type === 'journal' ? 'calendar-days' : 
		                    quickAccessFile.type === 'calendar' ? 'calendar-days' : 'file-text';
		const iconName = quickAccessFile.icon || defaultIcon;
		
		// Type에 따라 다르게 처리
		if (quickAccessFile.type === 'calendar') {
			// Calendar 타입은 버튼만 표시 (날짜 선택으로 파일 열기)
			console.log('[SynapticView.loadFile] Calendar 타입 - 버튼만 표시');
			this.addFloatingButtonsOnly(leaf);
			return;
		}
		
		if (quickAccessFile.type === 'file' || quickAccessFile.type === 'journal') {
			// File/Journal Note 타입: Obsidian 파일 열기
			let file = this.app.vault.getAbstractFileByPath(filePath);
			console.log(`[SynapticView.loadFile] ${quickAccessFile.type} 파일 찾기 결과:`, file);

			// Journal Note 타입이고 파일이 없으면 granularity에 맞게 생성
			if (!file && quickAccessFile.type === 'journal') {
				console.log(`[SynapticView.loadFile] ${granularity} Journal Note 파일이 없어서 생성합니다`);
				file = await createJournalNote(granularity);
				if (!file) {
					console.error(`[SynapticView.loadFile] ${granularity} Journal Note 생성 실패`);
					return;
				}
				console.log(`[SynapticView.loadFile] ${granularity} Journal Note 생성 완료:`, file);
				// 생성된 파일의 실제 경로로 업데이트
				filePath = file.path;
			}

			if (file instanceof TFile) {
				console.log(`[SynapticView.loadFile] ${quickAccessFile.type} TFile 확인`);
				this.currentFilePath = filePath;
				
				// 실제로 Obsidian 뷰어로 파일 열기 (읽기 모드)
				console.log('[SynapticView.loadFile] leaf.openFile 호출');
				await leaf.openFile(file, { state: { mode: 'preview' } });
				console.log('[SynapticView.loadFile] leaf.openFile 완료');

				// DOM이 업데이트될 때까지 기다린 후 뷰 타이틀 변경 & 버튼 추가
				console.log('[SynapticView.loadFile] setTimeout으로 UI 업데이트 예약');
				setTimeout(() => {
					console.log('[SynapticView.loadFile] setTimeout 콜백 실행');
					this.setLeafTitle(leaf, iconName);
					
					// 초기 로드 시 활성 버튼 ID 설정
					const activeButtonId = isInitialLoad ? quickAccessFile.id : null;
					this.addContainerUI(leaf, filePath, activeButtonId);
				}, 50);
			}
		} else if (quickAccessFile.type === 'web') {
			// Web 타입: 현재 탭에서 URL 열기
			console.log('[SynapticView.loadFile] Web 타입 - URL 열기:', filePath);
			this.currentFilePath = filePath;
			
			// leaf에 webviewer 설정
			await leaf.setViewState({
				type: 'webviewer',
				state: { url: filePath }
			});
			console.log('[SynapticView.loadFile] webviewer 설정 완료');
			
			// 웹페이지가 로드된 후 UI 업데이트
			setTimeout(() => {
				console.log('[SynapticView.loadFile] Web - UI 업데이트');
				this.setLeafTitle(leaf, iconName);
				
				// 초기 로드 시 활성 버튼 ID 설정
				const activeButtonId = isInitialLoad ? quickAccessFile.id : null;
				this.addContainerUI(leaf, filePath, activeButtonId);
			}, 100);
		}
	}

	/**
	 * 탭 타이틀과 아이콘을 설정합니다.
	 */
	private setLeafTitle(leaf: WorkspaceLeaf, iconName: string) {
		console.log('[SynapticView.setLeafTitle] 시작 - iconName:', iconName);
		
		const activeTabContainer = document.querySelector('.workspace-tabs.mod-active');
		console.log('[SynapticView.setLeafTitle] activeTabContainer:', activeTabContainer);
		
		if (activeTabContainer) {
			const activeTabHeader = activeTabContainer.querySelector('.workspace-tab-header.is-active');
			console.log('[SynapticView.setLeafTitle] activeTabHeader:', activeTabHeader);
			
			if (activeTabHeader) {
				// Synaptic View 탭임을 표시하는 클래스 추가
				activeTabHeader.addClass('synaptic-view-tab');
				console.log('[SynapticView.setLeafTitle] synaptic-view-tab 클래스 추가');
				
				const titleEl = activeTabHeader.querySelector('.workspace-tab-header-inner-title');
				const iconEl = activeTabHeader.querySelector('.workspace-tab-header-inner-icon');
				
				console.log('[SynapticView.setLeafTitle] titleEl:', titleEl);
				console.log('[SynapticView.setLeafTitle] iconEl:', iconEl);
				
				if (titleEl) {
					console.log('[SynapticView.setLeafTitle] 타이틀 변경 전:', titleEl.textContent);
					titleEl.setText('Synaptic View');
					console.log('[SynapticView.setLeafTitle] 타이틀 변경 후:', titleEl.textContent);
				} else {
					console.warn('[SynapticView.setLeafTitle] titleEl을 찾을 수 없음');
				}
				
				// 아이콘 설정
				if (iconEl) {
					console.log('[SynapticView.setLeafTitle] 아이콘 설정:', iconName);
					this.setTabIcon(iconEl, iconName);
				} else {
					console.warn('[SynapticView.setLeafTitle] iconEl을 찾을 수 없음');
				}
			} else {
				console.warn('[SynapticView.setLeafTitle] activeTabHeader를 찾을 수 없음');
			}
		} else {
			console.warn('[SynapticView.setLeafTitle] activeTabContainer를 찾을 수 없음');
		}
	}

	/**
	 * 탭 아이콘을 설정합니다.
	 */
	private setTabIcon(iconEl: Element, iconName: string) {
		console.log('[SynapticView.setTabIcon] 시작 - iconName:', iconName);
		
		const htmlIconEl = iconEl as HTMLElement;
		console.log('[SynapticView.setTabIcon] iconEl 내용 (변경 전):', htmlIconEl.innerHTML);
		
		// 기존 내용 제거
		htmlIconEl.empty();
		console.log('[SynapticView.setTabIcon] empty() 완료');
		
		// 새 아이콘 설정
		setIcon(htmlIconEl, iconName);
		console.log('[SynapticView.setTabIcon] setIcon() 완료, 내용 (변경 후):', htmlIconEl.innerHTML);
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
	private addContainerUI(leaf: WorkspaceLeaf, filePath: string, activeButtonId: string | null = null) {
		const container = leaf.view.containerEl;
		if (container) {
			this.applySynapticViewClasses(container);
			
			// .view-content 내부에 버튼 추가
			const viewContent = container.querySelector('.view-content');
			if (viewContent) {
				// 기존 버튼 제거
				const existingButtons = viewContent.querySelector('.synaptic-action-buttons');
				if (existingButtons) {
					existingButtons.remove();
				}
				
				// 이전 FloatingButtonManager의 currentActiveButtonId 보존 (Journal all, Calendar 등에서 설정한 활성 상태 유지)
				const previousActiveButtonId = activeButtonId !== null 
					? activeButtonId 
					: (this.floatingButtonManager?.currentActiveButtonId || null);
				
				this.floatingButtonManager = new FloatingButtonManager(
					this.app,
					this.settings,
					(qaf) => this.loadFile(leaf, qaf, false),
					filePath,
					previousActiveButtonId
				);
				this.floatingButtonManager.addFloatingButton(viewContent as HTMLElement);
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
}

