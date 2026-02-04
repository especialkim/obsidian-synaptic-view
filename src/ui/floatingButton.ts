import { App, setIcon, setTooltip, TFile } from 'obsidian';
import { createNewFile } from '../actions/createFileAction';
import { navigateToFile } from '../actions/navigateFileAction';
import { SynapticViewSettings, QuickAccessFile, JournalGranularity } from '../settings';
import { openPluginSettings } from '../utils/openSettings';
import { getJournalNotePath, isJournalAvailable } from '../utils/pluginChecker';
import { CalendarSubmenu } from './calendarSubmenu';
import { JournalSubmenu } from './journalSubmenu';
import { DailyNoteBadgeManager } from './dailyNoteBadge';
import { t } from '../utils/i18n';

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
	public currentActiveButtonId: string | null = null; // 현재 활성화된 버튼 ID 저장 (외부 접근 가능)
	private buttonContainer: HTMLElement | null = null;
	private isModifierKeyPressed: boolean = false;
	private calendarSubmenu: CalendarSubmenu;
    private journalSubmenu: JournalSubmenu;
	private dailyNoteBadgeManager: DailyNoteBadgeManager;

	// Event handlers stored for cleanup
	private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
	private keyupHandler: ((e: KeyboardEvent) => void) | null = null;
	private clickHandler: ((e: MouseEvent) => void) | null = null;

	constructor(app: App, settings: SynapticViewSettings, onFileSelect: (quickAccessFile: QuickAccessFile) => void, dailyNoteBadgeManager: DailyNoteBadgeManager, currentFilePath: string | null = null, currentActiveButtonId: string | null = null) {
		this.app = app;
		this.settings = settings;
		this.onFileSelect = onFileSelect;
		this.currentFilePath = currentFilePath;
		this.currentActiveButtonId = currentActiveButtonId;
		this.calendarSubmenu = new CalendarSubmenu(app, settings, onFileSelect, (filePath: string, activeButtonId?: string) => this.updateActiveButton(filePath, activeButtonId));
		this.journalSubmenu = new JournalSubmenu(app, settings, onFileSelect, (filePath: string, activeButtonId?: string) => this.updateActiveButton(filePath, activeButtonId));
		this.dailyNoteBadgeManager = dailyNoteBadgeManager;
	}

	async addFloatingButton(container: HTMLElement) {
		// 버튼 컨테이너를 상단 오른쪽에 배치
		this.buttonContainer = container.createDiv({ cls: 'synaptic-action-buttons' });
		
		// Default buttons
		this.addDefaultButtons(this.buttonContainer);

		// Quick Access buttons
		this.addQuickAccessButtons(this.buttonContainer);

	// Settings button (always shown last)
	this.addSettingsButton(this.buttonContainer);

	// 키보드 이벤트 리스너 추가
	this.setupKeyboardListeners();
	
	// 외부 클릭 시 서브메뉴 닫기
	this.setupOutsideClickListener();
	
	// Daily Note task 배지 업데이트 (설정이 켜져있을 때만)
	if (this.settings.showDailyNoteBadge) {
		// 배지 매니저에 버튼 컨테이너 설정 (metadataCache 이벤트에서 사용)
		this.dailyNoteBadgeManager.setButtonContainer(this.buttonContainer);
		await this.dailyNoteBadgeManager.updateDailyNoteTaskBadges(this.buttonContainer);
	}
}

	private addDefaultButtons(container: HTMLElement) {
		const translations = t();
		
		// 새 파일 생성
		const createButton = container.createDiv({ cls: 'synaptic-action-button' });
		createButton.setAttribute('aria-label', translations.buttons.createNewFile);
		setIcon(createButton, 'file-plus');
		setTooltip(createButton, translations.buttons.createNewFile, { delay: 100 });
		createButton.addEventListener('click', async (e) => {
			e.stopPropagation();
			await createNewFile(this.app);
		});

		// 파일 검색
		const searchButton = container.createDiv({ cls: 'synaptic-action-button' });
		searchButton.setAttribute('aria-label', translations.buttons.searchFiles);
		setIcon(searchButton, 'search');
		setTooltip(searchButton, translations.buttons.searchFiles, { delay: 100 });
		searchButton.addEventListener('click', (e) => {
			e.stopPropagation();
			navigateToFile(this.app);
		});
	}

	private addQuickAccessButtons(container: HTMLElement) {
		const translations = t();
		
		// enabled=true인 파일들만 버튼으로 추가
		const enabledFiles = this.settings.quickAccessFiles.filter(f => f.enabled);

		enabledFiles.forEach(file => {
			const button = container.createDiv({ cls: 'synaptic-action-button' });
			
			// Journal 타입이면 granularity 기반 라벨, 아니면 파일명
			let fileName: string;
			let actualFilePath: string;
			
		if (file.type === 'journal') {
			// Granularity 라벨 생성
			const granularity = file.granularity || 'day';
			const granularityLabels: Record<JournalGranularity, string> = {
				'all': translations.settings.granularity.all,
				'day': translations.settings.granularity.day,
				'week': translations.settings.granularity.week,
				'month': translations.settings.granularity.month,
				'quarter': translations.settings.granularity.quarter,
				'year': translations.settings.granularity.year
			};
			fileName = granularityLabels[granularity];
			
			// 런타임에 실제 파일 경로 계산
			// 'all'은 아직 구현 안 됨 - 임시로 day 사용
			actualFilePath = granularity === 'all' ? '' : getJournalNotePath(granularity);
		} else if (file.type === 'calendar') {
			// Calendar 타입
			fileName = translations.settings.fileType.calendar;
			actualFilePath = ''; // Calendar는 아직 기능 없음
		} else {
				// File/Web 타입
				fileName = file.filePath 
					? file.filePath.split('/').pop()?.replace('.md', '') || file.filePath
								: translations.settings.placeholder.noFile;
				actualFilePath = file.filePath;
			}
			
		button.setAttribute('aria-label', fileName);
		button.setAttribute('data-file-path', actualFilePath); // 실제 파일 경로 저장
		button.setAttribute('data-file-id', file.id); // 파일 ID 저장 (journal 비교용)
		button.setAttribute('data-file-type', file.type); // 파일 타입 저장 (편집 가능 여부 확인용)
		button.setAttribute('data-original-icon', file.icon); // 원본 아이콘 저장
		button.setAttribute('data-original-tooltip', fileName); // 원본 툴팁 저장
			
			// 현재 선택된 파일이면 active 클래스 추가
			// currentActiveButtonId가 있으면 해당 ID의 버튼만 활성화
			if (this.currentActiveButtonId) {
				// ID 기반 활성화 (서브메뉴 선택 등으로 명시적으로 지정된 버튼)
				if (file.id === this.currentActiveButtonId) {
					button.addClass('synaptic-action-button-active');
				}
			} else {
				// 파일 경로 기반 활성화 (일반적인 경우)
				// ALL 버튼은 경로 기반으로는 활성화하지 않음
				if (file.type === 'journal' && file.granularity === 'all') {
					// ALL 버튼은 경로 기반으로 활성화하지 않음
				} else {
					if (this.currentFilePath === actualFilePath) {
						button.addClass('synaptic-action-button-active');
					}
				}
			}
			
		setIcon(button, file.icon);
		setTooltip(button, fileName, { delay: 100 });
		
	// Journal 타입이면 배지 추가
	if (file.type === 'journal') {
		const granularity = file.granularity || 'day';
		const badgeLabels: Record<JournalGranularity, string> = {
			'all': translations.settings.badges.journal,
			'day': translations.settings.badges.day,
			'week': translations.settings.badges.week,
			'month': translations.settings.badges.month,
			'quarter': translations.settings.badges.quarter,
			'year': translations.settings.badges.year
		};
		const badgeText = badgeLabels[granularity];
		button.setAttribute('data-badge-text', badgeText); // 배지 텍스트 저장
		button.setAttribute('data-granularity', granularity); // granularity 저장
		
		const badge = button.createDiv({ cls: 'synaptic-journal-badge' });
		badge.textContent = badgeText;
		
		// 'all' granularity이면 서브메뉴 추가
        if (granularity === 'all') {
            this.journalSubmenu.addJournalSubmenu(button, file);
        }
	}
	
	// Web 타입이면 배지 추가
	if (file.type === 'web') {
		const badgeText = translations.settings.badges.web;
		button.setAttribute('data-badge-text', badgeText); // 배지 텍스트 저장
		
		const badge = button.createDiv({ cls: 'synaptic-journal-badge' });
		badge.textContent = badgeText;
	}
	
	// Calendar 타입이면 배지 추가 및 서브메뉴 생성
	if (file.type === 'calendar') {
		const badgeText = translations.settings.badges.calendar;
		button.setAttribute('data-badge-text', badgeText); // 배지 텍스트 저장
		
		const badge = button.createDiv({ cls: 'synaptic-journal-badge' });
		badge.textContent = badgeText;
		
		// Calendar 서브메뉴 추가
		this.calendarSubmenu.addCalendarSubmenu(button, file);
	}
	
    // 마우스 호버 이벤트 (편집 모드용)
    button.addEventListener('mouseenter', () => {
		// currentFilePath가 있고, file/journal/calendar 타입 편집 가능
		if (this.isModifierKeyPressed && 
		    this.currentFilePath && 
		    (file.type === 'file' || file.type === 'journal' || file.type === 'calendar')) {
			const isAllButton = file.type === 'journal' && (file.granularity === 'all');
			const isCalendarButton = file.type === 'calendar';
			const isActive = button.hasClass('synaptic-action-button-active');
			
			if (isAllButton || isCalendarButton) {
				// ALL 또는 Calendar 버튼이 활성화되어 있으면 편집 아이콘 표시
				if (isActive) {
					this.showEditIcon(button);
				}
			} else if (actualFilePath === this.currentFilePath) {
				this.showEditIcon(button);
			}
		}
	});

    button.addEventListener('mouseleave', () => {
        this.restoreOriginalIcon(button);
    });
	
	button.addEventListener('click', (e) => {
		e.stopPropagation();
		
		
	// Ctrl/Cmd + 클릭: 편집 모드로 split right에서 열기 (file, journal, calendar 타입)
	if ((e.ctrlKey || e.metaKey) && (file.type === 'file' || file.type === 'journal' || file.type === 'calendar')) {
		const isAllButton = file.type === 'journal' && (file.granularity === 'all');
		const isCalendarButton = file.type === 'calendar';
		const isActive = button.hasClass('synaptic-action-button-active');
		
		// ALL 또는 Calendar 버튼인 경우
		if (isAllButton || isCalendarButton) {
			// 활성화되어 있고, currentFilePath가 있으면 편집 모드로 열기
			if (isActive && this.currentFilePath) {
				this.openInEditMode(this.currentFilePath);
			}
		} else {
			// 일반 버튼인 경우 (Daily, Weekly, Yearly 등)
			// 버튼이 활성화되어 있고, actualFilePath가 currentFilePath와 일치하면 편집 모드로 열기
			if (isActive && actualFilePath && actualFilePath === this.currentFilePath) {
				this.openInEditMode(actualFilePath);
			}
		}
	} else {
		// 일반 클릭: 파일/웹 보기
		// ALL 버튼은 클릭 무시 (서브메뉴로만 선택 가능)
		const isAllButton = file.type === 'journal' && (file.granularity === 'all');
		if (isAllButton) {
			return;
		}
		
		// Calendar 버튼: Daily Notes가 활성화되어 있으면 오늘 Daily Note 열기
		const isCalendarButton = file.type === 'calendar';
		if (isCalendarButton) {
			this.openTodayDailyNote();
			return;
		}
		
		this.updateActiveButton(actualFilePath, file.id);
		this.onFileSelect(file);
	}
	});
	});
}

	private setupKeyboardListeners() {
		this.keydownHandler = (e: KeyboardEvent) => {
			if (e.ctrlKey || e.metaKey) {
				this.isModifierKeyPressed = true;
				this.updateButtonsForEditMode();
			}
		};

		this.keyupHandler = (e: KeyboardEvent) => {
			if (!e.ctrlKey && !e.metaKey) {
				this.isModifierKeyPressed = false;
				this.updateButtonsForEditMode();
			}
		};

		activeWindow.document.addEventListener('keydown', this.keydownHandler);
		activeWindow.document.addEventListener('keyup', this.keyupHandler);
	}

	private setupOutsideClickListener() {
		this.clickHandler = (e: MouseEvent) => {
			// 서브메뉴나 All 버튼, Calendar 버튼 클릭이 아니면 서브메뉴 닫기
			const target = e.target as HTMLElement;
            if (!target.closest('.synaptic-journal-submenu') &&
                !target.closest('.synaptic-calendar-submenu') &&
                !target.closest('.synaptic-action-button[data-granularity="all"]') &&
                !target.closest('.synaptic-action-button[data-file-type="calendar"]')) {
				this.journalSubmenu.closeSubmenu();
                this.calendarSubmenu.closeSubmenu();
            }
		};

		activeWindow.document.addEventListener('click', this.clickHandler);
	}

	/**
	 * 이벤트 리스너 정리 (plugin unload 시 호출 필요)
	 */
	destroy() {
		if (this.keydownHandler) {
			activeWindow.document.removeEventListener('keydown', this.keydownHandler);
			this.keydownHandler = null;
		}
		if (this.keyupHandler) {
			activeWindow.document.removeEventListener('keyup', this.keyupHandler);
			this.keyupHandler = null;
		}
		if (this.clickHandler) {
			activeWindow.document.removeEventListener('click', this.clickHandler);
			this.clickHandler = null;
		}
	}

	private updateButtonsForEditMode() {
		if (!this.buttonContainer) return;
		if (!this.currentFilePath) return;

		this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
			const filePath = btn.getAttribute('data-file-path');
			const fileType = btn.getAttribute('data-file-type');
			const granularity = btn.getAttribute('data-granularity');
			const isActive = btn.hasClass('synaptic-action-button-active');
			
			// ALL 또는 Calendar 버튼의 경우
			if ((fileType === 'journal' && granularity === 'all') || fileType === 'calendar') {
				// 버튼이 활성화되어 있으면 편집 아이콘 표시 가능
				if (isActive) {
				if (this.isModifierKeyPressed && btn.matches(':hover')) {
					this.showEditIcon(btn as HTMLElement);
				} else {
					this.restoreOriginalIcon(btn as HTMLElement);
				}
				}
			} 
			// 일반 버튼의 경우
			else if (filePath && 
			    filePath === this.currentFilePath && 
			    (fileType === 'file' || fileType === 'journal')) {
			if (this.isModifierKeyPressed && btn.matches(':hover')) {
				this.showEditIcon(btn as HTMLElement);
			} else {
				this.restoreOriginalIcon(btn as HTMLElement);
			}
			}
		});
	}

	private showEditIcon(button: HTMLElement) {
		const translations = t();
		button.addClass('edit-mode');
		
		// 서브메뉴 임시 저장 (삭제 방지)
		const submenus = Array.from(
			button.querySelectorAll('.synaptic-journal-submenu, .synaptic-calendar-submenu')
		) as HTMLElement[];
		submenus.forEach(submenu => submenu.detach());
		
		button.empty();
		setIcon(button, 'pencil');
		const originalTooltip = button.getAttribute('data-original-tooltip') || '';
			setTooltip(button, `${originalTooltip} ${translations.buttons.edit}`, { delay: 100 });
		
		// Journal 배지 복원
		const badgeText = button.getAttribute('data-badge-text');
		if (badgeText) {
			const badge = button.createDiv({ cls: 'synaptic-journal-badge' });
			badge.textContent = badgeText;
		}
		
		// 서브메뉴 복원
		submenus.forEach(submenu => button.appendChild(submenu));
	}

	private restoreOriginalIcon(button: HTMLElement) {
		button.removeClass('edit-mode');
		const originalIcon = button.getAttribute('data-original-icon') || 'file-text';
		const originalTooltip = button.getAttribute('data-original-tooltip') || '';
		
		// 서브메뉴 임시 저장 (삭제 방지)
		const submenus = Array.from(
			button.querySelectorAll('.synaptic-journal-submenu, .synaptic-calendar-submenu')
		) as HTMLElement[];
		submenus.forEach(submenu => submenu.detach());
		
		// Task 배지 임시 저장 (삭제 방지)
		const taskBadge = DailyNoteBadgeManager.saveTaskBadge(button);
		
		button.empty();
		setIcon(button, originalIcon);
		setTooltip(button, originalTooltip, { delay: 100 });
		
		// Journal 배지 복원
		const badgeText = button.getAttribute('data-badge-text');
		if (badgeText) {
			const badge = button.createDiv({ cls: 'synaptic-journal-badge' });
			badge.textContent = badgeText;
		}
		
		// Task 배지 복원
		DailyNoteBadgeManager.restoreTaskBadge(button, taskBadge);
		
		// 서브메뉴 복원
		submenus.forEach(submenu => button.appendChild(submenu));
	}



	private async openInEditMode(filePath: string) {
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file && file instanceof TFile) {
			// Split right로 편집 모드로 열기
			const leaf = this.app.workspace.getLeaf('split', 'vertical');
			await leaf.openFile(file, { state: { mode: 'source' } });
		}
	}

	private addSettingsButton(container: HTMLElement) {
		const translations = t();
		
		// 설정 버튼
		const settingsButton = container.createDiv({ cls: 'synaptic-action-button synaptic-settings-button' });
		settingsButton.setAttribute('aria-label', translations.buttons.settings);
		setIcon(settingsButton, 'settings');
		setTooltip(settingsButton, translations.buttons.settings, { delay: 100 });
		settingsButton.addEventListener('click', async (e) => {
			e.stopPropagation();
			await openPluginSettings(this.app);
		});
	}

	private updateActiveButton(filePath: string, activeButtonId?: string) {
		this.currentFilePath = filePath;
		
		// activeButtonId가 명시적으로 제공되면 저장, 아니면 현재 값 유지
		if (activeButtonId !== undefined) {
			this.currentActiveButtonId = activeButtonId;
		}
		
		if (!this.buttonContainer) return;
		
		// 모든 버튼에서 active 클래스 제거
		this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
			btn.removeClass('synaptic-action-button-active');
		});
		
		// currentActiveButtonId가 있으면 해당 ID의 버튼만 활성화
		if (this.currentActiveButtonId) {
			this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
				const btnId = btn.getAttribute('data-file-id');
				if (btnId === this.currentActiveButtonId) {
					btn.addClass('synaptic-action-button-active');
				}
			});
		} else {
			// currentActiveButtonId가 없는 경우: 현재 파일 경로와 일치하는 버튼 활성화
			this.buttonContainer.querySelectorAll('.synaptic-action-button').forEach(btn => {
				const btnFilePath = btn.getAttribute('data-file-path');
				if (btnFilePath === filePath) {
					btn.addClass('synaptic-action-button-active');
				}
			});
		}
	}

	setCurrentFile(filePath: string | null) {
		if (filePath) {
			this.updateActiveButton(filePath);
		}
	}

	/**
	 * 오늘 Daily Note를 엽니다 (Calendar 버튼 클릭 시 사용)
	 */
	private openTodayDailyNote() {
		// Daily Notes가 활성화되어 있지 않으면 아무것도 하지 않음
		if (!isJournalAvailable()) {
			console.log('[Synaptic View] Daily Notes is not enabled');
			return;
		}

		// Calendar 버튼 찾기
		const calendarFile = this.settings.quickAccessFiles.find(f => f.type === 'calendar' && f.enabled);
		if (!calendarFile) {
			console.log('[Synaptic View] Calendar button not found');
			return;
		}

		// 오늘 Daily Note 경로 가져오기
		const todayPath = getJournalNotePath('day');
		
		// Calendar 버튼 활성화 상태로 업데이트
		this.updateActiveButton(todayPath, calendarFile.id);

		// Journal Daily 타입의 QuickAccessFile을 생성하여 onFileSelect 호출
		const todayDailyFile: QuickAccessFile = {
			id: 'temp-daily-from-calendar',
			type: 'journal',
			filePath: '', // getJournalNotePath에서 자동 계산됨
			icon: 'calendar-days',
			enabled: true,
			granularity: 'day'
		};

		this.onFileSelect(todayDailyFile);
	}

}
