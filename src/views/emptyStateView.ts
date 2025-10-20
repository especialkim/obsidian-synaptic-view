import { App, TFile, Component, WorkspaceLeaf, setIcon } from 'obsidian';
import { SynapticViewSettings, QuickAccessFile, JournalGranularity } from '../settings';
import { FloatingButtonManager } from '../ui/floatingButton';
import { openPluginSettings } from '../utils/openSettings';
import { getJournalNotePath, createJournalNote } from '../utils/pluginChecker';

export class EmptyStateViewManager {
	private app: App;
	private settings: SynapticViewSettings;
	private floatingButtonManager: FloatingButtonManager | null = null;
	private currentFilePath: string | null = null;
	private component: Component;

	constructor(app: App, settings: SynapticViewSettings) {
		this.app = app;
		this.settings = settings;
		this.component = new Component();
		this.component.load();
	}

	async customizeEmptyState() {
		console.log('[customizeEmptyState] 시작');
		
		// Quick Access가 비활성화되어 있으면 아무것도 하지 않음 (Obsidian 기본 동작)
		if (!this.settings.enableQuickAccess) {
			console.log('[customizeEmptyState] Quick Access 비활성화, 종료');
			return;
		}

		// Synaptic View 탭에서 일반 파일이 열린 경우 클래스 제거
		this.cleanupNonSynapticTabs();

		// 모든 빈 탭을 찾아서 커스터마이징
		const leaves = this.app.workspace.getLeavesOfType('empty');
		console.log('[customizeEmptyState] 빈 탭 개수:', leaves.length);
		
		for (const leaf of leaves) {
			console.log('[customizeEmptyState] 빈 탭 처리 시작, leaf:', leaf);
			
			// 활성화된 파일이 있으면 실제로 파일을 열기
			const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);
			console.log('[customizeEmptyState] 활성화된 파일 개수:', enabledFiles.length);
			
			if (enabledFiles.length === 0) {
				// 등록된 파일이 없을 때 안내 메시지 표시
				const container = leaf.view.containerEl;
				if (!container) continue;

				const emptyState = container.querySelector('.empty-state');
				if (!emptyState) continue;

				emptyState.empty();
				emptyState.addClass('synaptic-empty-state');
				this.showSetupMessage(emptyState as HTMLElement);
				
			// 플로팅 버튼 추가 (기본 버튼 + 설정 버튼)
			const existingButtons = container.querySelector('.synaptic-action-buttons');
			if (existingButtons) {
				existingButtons.remove();
			}
			
			// 이전 FloatingButtonManager의 currentActiveButtonId 저장
			const previousActiveButtonId = this.floatingButtonManager?.currentActiveButtonId || null;
			
			this.floatingButtonManager = new FloatingButtonManager(
				this.app,
				this.settings,
				(qaf) => this.loadFile(leaf, qaf),
				null,
				previousActiveButtonId  // 이전 활성 버튼 ID 전달
			);
			this.floatingButtonManager.addFloatingButton(container);
			continue;
			}
			
		// enabledFiles.length > 0 인 경우
		// 새 탭(빈 탭)을 열 때는 항상 첫 번째 우선순위 파일/웹 로드
		const quickAccessFileToLoad = enabledFiles[0];
		console.log('[customizeEmptyState] 로드할 항목:', quickAccessFileToLoad);
		
		// Type에 따라 다르게 처리
		if (quickAccessFileToLoad.type === 'file' || quickAccessFileToLoad.type === 'journal') {
		// Journal Note 타입이면 granularity에 따라 경로를 동적으로 계산
		let filePathToLoad = quickAccessFileToLoad.filePath;
		if (quickAccessFileToLoad.type === 'journal') {
			const granularity = quickAccessFileToLoad.granularity || 'day';
			
			// 'all'은 아직 구현 안 됨 - 건너뛰기
			if (granularity === 'all') {
				console.log('[customizeEmptyState] All granularity는 아직 구현되지 않았습니다');
				continue;
			}
			
			filePathToLoad = getJournalNotePath(granularity);
			console.log(`[customizeEmptyState] ${granularity} Journal Note 경로:`, filePathToLoad);
		}
		
		this.currentFilePath = filePathToLoad;
		let file = this.app.vault.getAbstractFileByPath(filePathToLoad);
		console.log(`[customizeEmptyState] ${quickAccessFileToLoad.type} 파일 찾기 결과:`, file);
		
		// Journal Note 타입이고 파일이 없으면 granularity에 맞게 생성
		if (!file && quickAccessFileToLoad.type === 'journal') {
			const granularity = quickAccessFileToLoad.granularity || 'day';
			console.log(`[customizeEmptyState] ${granularity} Journal Note 파일이 없어서 생성합니다`);
			file = await createJournalNote(granularity);
			if (!file) {
				console.error(`[customizeEmptyState] ${granularity} Journal Note 생성 실패`);
				continue;
			}
			console.log(`[customizeEmptyState] ${granularity} Journal Note 생성 완료:`, file);
			// 생성된 파일의 실제 경로로 업데이트
			filePathToLoad = file.path;
			this.currentFilePath = filePathToLoad;
		}
				
				if (file instanceof TFile) {
					console.log(`[customizeEmptyState] ${quickAccessFileToLoad.type} TFile 확인, leaf.openFile 호출`);
					// 빈 탭에 실제로 파일을 Obsidian 뷰어로 열기 (읽기 모드)
					await leaf.openFile(file, { state: { mode: 'preview' } });
					console.log('[customizeEmptyState] leaf.openFile 완료');
					
					// 타입에 따른 기본 아이콘 설정
					const defaultIcon = quickAccessFileToLoad.type === 'journal' ? 'calendar-days' : 'file-text';
					const iconName = quickAccessFileToLoad.icon || defaultIcon;
					console.log('[customizeEmptyState] 아이콘:', iconName);
					
					// DOM이 업데이트될 때까지 기다린 후 뷰 타이틀 변경
					console.log('[customizeEmptyState] setTimeout으로 setLeafTitle 호출 예약');
					setTimeout(() => {
						console.log('[customizeEmptyState] setTimeout 콜백 실행, setLeafTitle 호출');
						this.setLeafTitle(leaf, iconName);
					}, 50);
					
					// 액션 버튼은 .view-content 내부에 추가
					const container = leaf.view.containerEl;
					if (container) {
						// Synaptic View 클래스 추가 (CSS 스타일링용)
						this.applySynapticViewClasses(container);
						
						// .view-content 찾기
						const viewContent = container.querySelector('.view-content');
						if (viewContent) {
							const existingButtons = viewContent.querySelector('.synaptic-action-buttons');
							if (existingButtons) {
								existingButtons.remove();
							}
							
							// 이전 FloatingButtonManager의 currentActiveButtonId 저장
							const previousActiveButtonId = this.floatingButtonManager?.currentActiveButtonId || null;
							
							this.floatingButtonManager = new FloatingButtonManager(
								this.app,
								this.settings,
								(qaf) => this.loadFile(leaf, qaf),
								this.currentFilePath,
								previousActiveButtonId  // 이전 활성 버튼 ID 전달
							);
							this.floatingButtonManager.addFloatingButton(viewContent as HTMLElement);
						}
					}
				}
		} else if (quickAccessFileToLoad.type === 'web') {
			// Web 타입: 현재 탭에서 URL 열기
			console.log('[customizeEmptyState] Web 타입 - URL 열기:', quickAccessFileToLoad.filePath);
			this.currentFilePath = quickAccessFileToLoad.filePath;
			
			const iconName = quickAccessFileToLoad.icon || 'globe';
			
			// leaf에 webviewer 설정
			await leaf.setViewState({
				type: 'webviewer',
				state: { url: quickAccessFileToLoad.filePath }
			});
			console.log('[customizeEmptyState] webviewer 설정 완료');
			
			// 웹페이지가 로드된 후 floatingButton 추가
			setTimeout(() => {
				console.log('[customizeEmptyState] Web - setLeafTitle 호출');
				this.setLeafTitle(leaf, iconName);
				
				// 컨테이너에 클래스 추가
				const container = leaf.view.containerEl;
				if (container) {
					this.applySynapticViewClasses(container);
					
					// .view-content 찾기
					const viewContent = container.querySelector('.view-content');
					if (viewContent) {
						const existingButtons = viewContent.querySelector('.synaptic-action-buttons');
						if (existingButtons) {
							existingButtons.remove();
						}
						
						// 이전 FloatingButtonManager의 currentActiveButtonId 저장
						const previousActiveButtonId = this.floatingButtonManager?.currentActiveButtonId || null;
						
						this.floatingButtonManager = new FloatingButtonManager(
							this.app,
							this.settings,
							(qaf) => this.loadFile(leaf, qaf),
							this.currentFilePath,
							previousActiveButtonId  // 이전 활성 버튼 ID 전달
						);
						this.floatingButtonManager.addFloatingButton(viewContent as HTMLElement);
					}
				}
			}, 100);
		}
		}
	}

	private showSetupMessage(container: HTMLElement) {
		container.empty();
		const contentDiv = container.createDiv({ cls: 'synaptic-setup-message' });
		
		contentDiv.createEl('h2', { text: '🎯 Synaptic View' });
		contentDiv.createEl('p', { 
			text: 'Quick Access가 활성화되어 있지만 등록된 파일이 없습니다.',
			cls: 'synaptic-setup-text'
		});
		contentDiv.createEl('p', { 
			text: '설정에서 Quick Access 파일을 추가해주세요.',
			cls: 'synaptic-setup-text'
		});
		
		const buttonDiv = contentDiv.createDiv({ cls: 'synaptic-setup-button-container' });
		const settingsButton = buttonDiv.createEl('button', { 
			text: '⚙️ 설정으로 이동',
			cls: 'mod-cta synaptic-setup-button'
		});
		
		settingsButton.addEventListener('click', async () => {
			await openPluginSettings(this.app);
		});
	}

	private cleanupNonSynapticTabs() {
		console.log('[cleanupNonSynapticTabs] Synaptic View 클래스 정리 시작');
		
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
	
	// 현재 열린 파일 경로도 Quick Access 파일로 인식
	if (this.currentFilePath) {
		quickAccessPaths.push(this.currentFilePath);
	}
		
		console.log('[cleanupNonSynapticTabs] Quick Access 파일 경로:', quickAccessPaths);
		console.log('[cleanupNonSynapticTabs] 현재 파일 경로:', this.currentFilePath);
		
		// 모든 leaf를 순회하면서 정리
		this.app.workspace.iterateAllLeaves(leaf => {
			const container = leaf.view.containerEl;
			
			// synaptic-viewer-container 클래스가 있는 컨테이너만 체크
			if (container.hasClass('synaptic-viewer-container')) {
				console.log('[cleanupNonSynapticTabs] Synaptic 컨테이너 발견, leaf 타입:', leaf.view.getViewType());
				
				// 현재 leaf에 열린 파일 확인
				const file = (leaf.view as any).file as TFile | undefined;
				const filePath = file?.path || null;
				
				console.log('[cleanupNonSynapticTabs] 파일 경로:', filePath);
				
				// Quick Access 파일인지 확인
				const isQuickAccessFile = filePath && quickAccessPaths.includes(filePath);
				
				console.log('[cleanupNonSynapticTabs] isQuickAccessFile:', isQuickAccessFile);
				
				if (!isQuickAccessFile) {
					console.log('[cleanupNonSynapticTabs] 일반 파일 감지, 정리 시작');
					
					// synaptic-viewer-container 클래스 제거
					container.removeClass('synaptic-viewer-container');
					console.log('[cleanupNonSynapticTabs] 컨테이너 클래스 제거');
					
					// 플로팅 버튼 제거 (.view-content 내부 확인)
					const viewContent = container.querySelector('.view-content');
					if (viewContent) {
						const floatingButtons = viewContent.querySelector('.synaptic-action-buttons');
						if (floatingButtons) {
							floatingButtons.remove();
							console.log('[cleanupNonSynapticTabs] 플로팅 버튼 제거 (.view-content 내부)');
						}
					}
					
					// 혹시 컨테이너 직속에도 있을 수 있으니 확인
					const directButtons = container.querySelector('.synaptic-action-buttons');
					if (directButtons) {
						directButtons.remove();
						console.log('[cleanupNonSynapticTabs] 플로팅 버튼 제거 (직속)');
					}
				}
			}
		});
		
		// 탭 헤더의 synaptic-view-tab 클래스도 정리
		const synapticTabHeaders = document.querySelectorAll('.workspace-tab-header.synaptic-view-tab');
		console.log('[cleanupNonSynapticTabs] Synaptic View 탭 헤더 개수:', synapticTabHeaders.length);
		
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
				console.log('[cleanupNonSynapticTabs] 일반 탭 헤더 클래스 제거:', ariaLabel);
				tabHeader.removeClass('synaptic-view-tab');
			}
		});
	}

	private setLeafTitle(leaf: WorkspaceLeaf, iconName: string) {
		console.log('[setLeafTitle] 시작 - iconName:', iconName);
		
		// 참조 코드처럼 전역 document에서 활성화된 탭 찾기
		// document.querySelector('.workspace-tabs.mod-active .workspace-tab-header.is-active .workspace-tab-header-inner-title')
		const activeTabContainer = document.querySelector('.workspace-tabs.mod-active');
		console.log('[setLeafTitle] activeTabContainer:', activeTabContainer);
		
		if (activeTabContainer) {
			const activeTabHeader = activeTabContainer.querySelector('.workspace-tab-header.is-active');
			console.log('[setLeafTitle] activeTabHeader:', activeTabHeader);
			
			if (activeTabHeader) {
				// Synaptic View 탭임을 표시하는 클래스 추가
				activeTabHeader.addClass('synaptic-view-tab');
				console.log('[setLeafTitle] synaptic-view-tab 클래스 추가');
				
				const titleEl = activeTabHeader.querySelector('.workspace-tab-header-inner-title');
				const iconEl = activeTabHeader.querySelector('.workspace-tab-header-inner-icon');
				
				console.log('[setLeafTitle] titleEl:', titleEl);
				console.log('[setLeafTitle] iconEl:', iconEl);
				
				if (titleEl) {
					console.log('[setLeafTitle] 타이틀 변경 전:', titleEl.textContent);
					titleEl.setText('Synaptic View');
					console.log('[setLeafTitle] 타이틀 변경 후:', titleEl.textContent);
				} else {
					console.warn('[setLeafTitle] titleEl을 찾을 수 없음');
				}
				
				// 아이콘 설정
				if (iconEl) {
					console.log('[setLeafTitle] 아이콘 설정:', iconName);
					this.setTabIcon(iconEl, iconName);
				} else {
					console.warn('[setLeafTitle] iconEl을 찾을 수 없음');
				}
			} else {
				console.warn('[setLeafTitle] activeTabHeader를 찾을 수 없음');
			}
		} else {
			console.warn('[setLeafTitle] activeTabContainer를 찾을 수 없음');
		}
	}

	private setTabIcon(iconEl: Element, iconName: string) {
		console.log('[setTabIcon] 시작 - iconName:', iconName, 'iconEl:', iconEl);
		
		// Obsidian의 setIcon API 사용
		const htmlIconEl = iconEl as HTMLElement;
		console.log('[setTabIcon] iconEl 내용 (변경 전):', htmlIconEl.innerHTML);
		
		// 기존 내용 제거
		htmlIconEl.empty();
		console.log('[setTabIcon] empty() 완료');
		
		// 새 아이콘 설정
		setIcon(htmlIconEl, iconName);
		console.log('[setTabIcon] setIcon() 완료, 내용 (변경 후):', htmlIconEl.innerHTML);
	}

	private applySynapticViewClasses(container: HTMLElement) {
		// 기본 Synaptic View 클래스 추가
		container.addClass('synaptic-viewer-container');
		
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

	private async loadFile(leaf: WorkspaceLeaf, quickAccessFile: QuickAccessFile) {
		console.log('[loadFile] 시작 - quickAccessFile:', quickAccessFile);
		
	// Journal Note 타입이면 granularity에 따라 경로를 동적으로 계산
	let filePath = quickAccessFile.filePath;
	let granularity: JournalGranularity = 'day';
	if (quickAccessFile.type === 'journal') {
		granularity = quickAccessFile.granularity || 'day';
		
		// 'all'은 아직 구현 안 됨 - 임시로 빈 경로
		if (granularity === 'all') {
			console.log('[loadFile] All granularity는 아직 구현되지 않았습니다');
			return;
		}
		
		filePath = getJournalNotePath(granularity);
		console.log(`[loadFile] ${granularity} Journal Note 경로:`, filePath);
	}
	
	// 타입에 따른 기본 아이콘 설정
	const defaultIcon = quickAccessFile.type === 'journal' ? 'calendar-days' : 'file-text';
	const iconName = quickAccessFile.icon || defaultIcon;
	
	// Type에 따라 다르게 처리
	if (quickAccessFile.type === 'file' || quickAccessFile.type === 'journal') {
		// File/Journal Note 타입: Obsidian 파일 열기
		let file = this.app.vault.getAbstractFileByPath(filePath);
		console.log(`[loadFile] ${quickAccessFile.type} 파일 찾기 결과:`, file);

		// Journal Note 타입이고 파일이 없으면 granularity에 맞게 생성
		if (!file && quickAccessFile.type === 'journal') {
			console.log(`[loadFile] ${granularity} Journal Note 파일이 없어서 생성합니다`);
			file = await createJournalNote(granularity);
			if (!file) {
				console.error(`[loadFile] ${granularity} Journal Note 생성 실패`);
				return;
			}
			console.log(`[loadFile] ${granularity} Journal Note 생성 완료:`, file);
			// 생성된 파일의 실제 경로로 업데이트
			filePath = file.path;
		}

			if (file instanceof TFile) {
				console.log(`[loadFile] ${quickAccessFile.type} TFile 확인`);
				this.currentFilePath = filePath;
				
				// 실제로 Obsidian 뷰어로 파일 열기 (읽기 모드)
				console.log('[loadFile] leaf.openFile 호출');
				await leaf.openFile(file, { state: { mode: 'preview' } });
				console.log('[loadFile] leaf.openFile 완료');

				// DOM이 업데이트될 때까지 기다린 후 뷰 타이틀 변경 & 버튼 추가
				console.log('[loadFile] setTimeout으로 setLeafTitle 호출 예약');
				setTimeout(() => {
					console.log('[loadFile] setTimeout 콜백 실행, setLeafTitle 호출');
					this.setLeafTitle(leaf, iconName);
					
					// 컨테이너에 클래스 추가 및 버튼 추가
					this.addContainerUI(leaf, filePath);
				}, 50);
			}
		} else if (quickAccessFile.type === 'web') {
			// Web 타입: 현재 탭에서 URL 열기
			console.log('[loadFile] Web 타입 - URL 열기:', filePath);
			this.currentFilePath = filePath;
			
			// leaf에 webviewer 설정
			await leaf.setViewState({
				type: 'webviewer',
				state: { url: filePath }
			});
			console.log('[loadFile] webviewer 설정 완료');
			
			// 웹페이지가 로드된 후 floatingButton 추가
			setTimeout(() => {
				console.log('[loadFile] Web - setLeafTitle 호출');
				this.setLeafTitle(leaf, iconName);
				
				// 컨테이너에 클래스 추가 및 버튼 추가
				this.addContainerUI(leaf, filePath);
			}, 100);
		}
	}
	
	private addContainerUI(leaf: WorkspaceLeaf, filePath: string) {
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
			
			// 이전 FloatingButtonManager의 currentActiveButtonId 저장
			const previousActiveButtonId = this.floatingButtonManager?.currentActiveButtonId || null;
			
			// 새 버튼 추가
			this.floatingButtonManager = new FloatingButtonManager(
				this.app,
				this.settings,
				(qaf) => this.loadFile(leaf, qaf),
				filePath,
				previousActiveButtonId  // 이전 활성 버튼 ID 전달
			);
			this.floatingButtonManager.addFloatingButton(viewContent as HTMLElement);
		}
		}
	}
}
