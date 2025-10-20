import { App, setIcon, setTooltip } from 'obsidian';
import { createNewFile } from '../actions/createFileAction';
import { navigateToFile } from '../actions/navigateFileAction';
import { SynapticViewSettings, QuickAccessFile } from '../settings';
import { openPluginSettings } from '../utils/openSettings';

export interface ActionButton {
	id: string;
	tooltip: string;
	icon: string;
	action: (app: App) => void;
}

export class FloatingButtonManager {
	private app: App;
	private settings: SynapticViewSettings;
	private onFileSelect: (quickAccessFile: QuickAccessFile) => void;
	private currentFilePath: string | null = null;
	private buttonContainer: HTMLElement | null = null;
	private isModifierKeyPressed: boolean = false;

	constructor(app: App, settings: SynapticViewSettings, onFileSelect: (quickAccessFile: QuickAccessFile) => void, currentFilePath: string | null = null) {
		this.app = app;
		this.settings = settings;
		this.onFileSelect = onFileSelect;
		this.currentFilePath = currentFilePath;
	}

	addFloatingButton(container: HTMLElement) {
		// 버튼 컨테이너를 상단 오른쪽에 배치
		this.buttonContainer = container.createDiv({ cls: 'synaptic-action-buttons' });
		
		// 기본 버튼들
		this.addDefaultButtons(this.buttonContainer);

		// Quick Access 버튼들 (활성화된 경우)
		if (this.settings.enableQuickAccess) {
			this.addQuickAccessButtons(this.buttonContainer);
		}

		// 설정 버튼 (항상 마지막에 표시)
		this.addSettingsButton(this.buttonContainer);

		// 키보드 이벤트 리스너 추가
		this.setupKeyboardListeners();
	}

	private addDefaultButtons(container: HTMLElement) {
		// 새 파일 생성
		const createButton = container.createDiv({ cls: 'synaptic-action-button' });
		createButton.setAttribute('aria-label', '새 파일 생성');
		setIcon(createButton, 'file-plus');
		setTooltip(createButton, '새 파일 생성', { delay: 100 });
		createButton.addEventListener('click', (e) => {
			e.stopPropagation();
			createNewFile(this.app);
		});

		// 파일 검색
		const searchButton = container.createDiv({ cls: 'synaptic-action-button' });
		searchButton.setAttribute('aria-label', '파일 검색');
		setIcon(searchButton, 'search');
		setTooltip(searchButton, '파일 검색', { delay: 100 });
		searchButton.addEventListener('click', (e) => {
			e.stopPropagation();
			navigateToFile(this.app);
		});
	}

	private addQuickAccessButtons(container: HTMLElement) {
		// enabled=true인 파일들만 버튼으로 추가
		const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);

		enabledFiles.forEach(file => {
			const button = container.createDiv({ cls: 'synaptic-action-button' });
			
			// 파일 경로에서 파일명만 추출 (확장자 제외)
			const fileName = file.filePath 
				? file.filePath.split('/').pop()?.replace('.md', '') || file.filePath
				: '파일 없음';
			
			button.setAttribute('aria-label', fileName);
			button.setAttribute('data-file-path', file.filePath); // 파일 경로 저장
			button.setAttribute('data-original-icon', file.icon); // 원본 아이콘 저장
			button.setAttribute('data-original-tooltip', fileName); // 원본 툴팁 저장
			
			// 현재 선택된 파일이면 active 클래스 추가
			if (this.currentFilePath === file.filePath) {
				button.addClass('synaptic-action-button-active');
			}
			
			setIcon(button, file.icon);
			setTooltip(button, fileName, { delay: 100 });
			
			// 마우스 호버 이벤트
			button.addEventListener('mouseenter', () => {
				// currentFilePath가 있고, 현재 파일과 일치할 때만 편집 아이콘 표시
				if (this.isModifierKeyPressed && this.currentFilePath && file.filePath === this.currentFilePath) {
					this.showEditIcon(button);
				}
			});

			button.addEventListener('mouseleave', () => {
				this.restoreOriginalIcon(button);
			});
			
		button.addEventListener('click', (e) => {
			e.stopPropagation();
			
			// Ctrl/Cmd + 클릭: 편집 모드로 split right에서 열기 (file 타입만)
			if ((e.ctrlKey || e.metaKey) && file.filePath === this.currentFilePath && file.type === 'file') {
				this.openInEditMode(file.filePath);
			} else {
				// 일반 클릭: 파일/웹 보기
				this.updateActiveButton(file.filePath);
				this.onFileSelect(file);
			}
		});
		});
	}

	private setupKeyboardListeners() {
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey || e.metaKey) {
				this.isModifierKeyPressed = true;
				this.updateButtonsForEditMode();
			}
		});

		document.addEventListener('keyup', (e) => {
			if (!e.ctrlKey && !e.metaKey) {
				this.isModifierKeyPressed = false;
				this.updateButtonsForEditMode();
			}
		});
	}

	private updateButtonsForEditMode() {
		if (!this.buttonContainer) return;
		// currentFilePath가 null이면 편집 모드 로직 실행 안 함
		if (!this.currentFilePath) return;

		this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
			const filePath = btn.getAttribute('data-file-path');
			// data-file-path 속성이 있고, currentFilePath와 일치하는 버튼만 처리
			if (filePath && filePath === this.currentFilePath) {
				if (this.isModifierKeyPressed && btn.matches(':hover')) {
					this.showEditIcon(btn as HTMLElement);
				} else {
					this.restoreOriginalIcon(btn as HTMLElement);
				}
			}
		});
	}

	private showEditIcon(button: HTMLElement) {
		button.addClass('edit-mode');
		button.empty();
		setIcon(button, 'pencil');
		const originalTooltip = button.getAttribute('data-original-tooltip') || '';
		setTooltip(button, `${originalTooltip} 편집`, { delay: 100 });
	}

	private restoreOriginalIcon(button: HTMLElement) {
		button.removeClass('edit-mode');
		const originalIcon = button.getAttribute('data-original-icon') || 'file-text';
		const originalTooltip = button.getAttribute('data-original-tooltip') || '';
		button.empty();
		setIcon(button, originalIcon);
		setTooltip(button, originalTooltip, { delay: 100 });
	}

	private async openInEditMode(filePath: string) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file) {
			// Split right로 편집 모드로 열기
			const leaf = this.app.workspace.getLeaf('split', 'vertical');
			await leaf.openFile(file as any, { state: { mode: 'source' } });
		}
	}

	private addSettingsButton(container: HTMLElement) {
		// 설정 버튼
		const settingsButton = container.createDiv({ cls: 'synaptic-action-button synaptic-settings-button' });
		settingsButton.setAttribute('aria-label', '설정');
		setIcon(settingsButton, 'settings');
		setTooltip(settingsButton, '설정', { delay: 100 });
		settingsButton.addEventListener('click', async (e) => {
			e.stopPropagation();
			await openPluginSettings(this.app);
		});
	}

	private updateActiveButton(filePath: string) {
		this.currentFilePath = filePath;
		
		if (!this.buttonContainer) return;
		
		// 모든 버튼에서 active 클래스 제거
		this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
			btn.removeClass('synaptic-action-button-active');
		});
		
		// 현재 파일 경로와 일치하는 버튼에만 active 클래스 추가
		this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
			if (btn.getAttribute('data-file-path') === filePath) {
				btn.addClass('synaptic-action-button-active');
			}
		});
	}

	setCurrentFile(filePath: string | null) {
		if (filePath) {
			this.updateActiveButton(filePath);
		}
	}
}
