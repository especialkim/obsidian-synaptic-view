import { App, moment, Notice, setIcon } from 'obsidian';
import { SynapticViewSettings, QuickAccessFile } from '../settings';
import { isGranularityAvailable } from '../utils/pluginChecker';
import {
	createDailyNote,
	createWeeklyNote,
	createMonthlyNote,
	createQuarterlyNote,
	createYearlyNote,
	getDailyNote,
	getWeeklyNote,
	getMonthlyNote,
	getQuarterlyNote,
	getYearlyNote,
	getAllDailyNotes,
	getAllWeeklyNotes,
	getAllMonthlyNotes,
	getAllQuarterlyNotes,
	getAllYearlyNotes
} from 'obsidian-daily-notes-interface';

export class CalendarSubmenu {
	private app: App;
	private settings: SynapticViewSettings;
	private onFileSelect: (quickAccessFile: QuickAccessFile) => void;
	private onUpdateActiveButton: (filePath: string, activeButtonId?: string) => void;
	private openedSubmenu: HTMLElement | null = null;
	private currentDate: moment.Moment = moment();
	private hideTimeout: number | null = null;
	private calendarButtonFile: QuickAccessFile | null = null;

	constructor(
		app: App,
		settings: SynapticViewSettings,
		onFileSelect: (quickAccessFile: QuickAccessFile) => void,
		onUpdateActiveButton: (filePath: string, activeButtonId?: string) => void
	) {
		this.app = app;
		this.settings = settings;
		this.onFileSelect = onFileSelect;
		this.onUpdateActiveButton = onUpdateActiveButton;
	}

	/**
	 * Calendar 버튼에 서브메뉴 추가
	 */
	addCalendarSubmenu(button: HTMLElement, file: QuickAccessFile) {
		// Calendar 버튼 파일 정보 저장 (활성화 상태 업데이트용)
		this.calendarButtonFile = file;
		
		// 서브메뉴 컨테이너 생성
		const submenu = button.createDiv({ cls: 'synaptic-calendar-submenu' });
		
		this.renderCalendar(submenu);
		
		// 순수 CSS hover로 작동하므로 JavaScript 이벤트 핸들러 불필요
	}

	/**
	 * 달력 렌더링
	 */
    private renderCalendar(container: HTMLElement) {
		container.empty();
        // Determine availability based on user's periodic notes settings
        const hasWeek = isGranularityAvailable('week');
        const hasQuarter = isGranularityAvailable('quarter');
        const hasMonth = isGranularityAvailable('month');
        const hasYear = isGranularityAvailable('year');
        // Toggle layout class for week column
        if (hasWeek) {
            container.addClass('has-week');
        } else {
            container.removeClass('has-week');
        }
		
		// 헤더 (년도/월 네비게이션)
		const header = container.createDiv({ cls: 'synaptic-calendar-header' });
		
		// 이전 년도 버튼 (년간 노트)
		const prevYearBtn = header.createDiv({ cls: 'synaptic-calendar-nav-btn' });
		setIcon(prevYearBtn, 'chevrons-left');
		prevYearBtn.title = '이전 년도';
		prevYearBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.currentDate.subtract(1, 'year');
			this.renderCalendar(container);
		});
		
		// 이전 월 버튼
		const prevMonthBtn = header.createDiv({ cls: 'synaptic-calendar-nav-btn' });
		setIcon(prevMonthBtn, 'chevron-left');
		prevMonthBtn.title = '이전 월';
		prevMonthBtn.addEventListener('click', () => {
			this.currentDate.subtract(1, 'month');
			this.renderCalendar(container);
		});
		
        // 년도 표시 (클릭 시: 사용 가능하면 열기, 아니면 Notice)
		const yearEl = header.createDiv({ cls: 'synaptic-calendar-year' });
		yearEl.textContent = this.currentDate.format('YYYY');
        yearEl.title = hasYear ? '년간 노트 열기' : '년간 노트가 설정되지 않았습니다';
        yearEl.addEventListener('click', () => {
            if (hasYear) {
                this.onYearClick(this.currentDate);
            } else {
                new Notice('📅 년간 노트가 설정되지 않았습니다. Periodic Notes 또는 Yearly 설정을 확인하세요.');
            }
        });
		
        // 월 표시 (클릭 시: 사용 가능하면 열기, 아니면 Notice)
		const monthEl = header.createDiv({ cls: 'synaptic-calendar-month' });
		monthEl.textContent = this.currentDate.format('M월');
        monthEl.title = hasMonth ? '월간 노트 열기' : '월간 노트가 설정되지 않았습니다';
        monthEl.addEventListener('click', () => {
            if (hasMonth) {
                this.onMonthClick(this.currentDate);
            } else {
                new Notice('📅 월간 노트가 설정되지 않았습니다. Periodic Notes 또는 Monthly 설정을 확인하세요.');
            }
        });
		
		// 다음 월 버튼
		const nextMonthBtn = header.createDiv({ cls: 'synaptic-calendar-nav-btn' });
		setIcon(nextMonthBtn, 'chevron-right');
		nextMonthBtn.title = '다음 월';
		nextMonthBtn.addEventListener('click', () => {
			this.currentDate.add(1, 'month');
			this.renderCalendar(container);
		});
		
		// 다음 년도 버튼 (년간 노트)
		const nextYearBtn = header.createDiv({ cls: 'synaptic-calendar-nav-btn' });
		setIcon(nextYearBtn, 'chevrons-right');
		nextYearBtn.title = '다음 년도';
		nextYearBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			this.currentDate.add(1, 'year');
			this.renderCalendar(container);
		});
		
        // 분기 버튼들 (사용 시에만 표시)
        if (hasQuarter) {
            const quarters = container.createDiv({ cls: 'synaptic-calendar-quarters' });
            const quarterLabels = ['1Q', '2Q', '3Q', '4Q'];
            quarterLabels.forEach((quarter, index) => {
                const quarterBtn = quarters.createDiv({ cls: 'synaptic-calendar-quarter-btn' });
                quarterBtn.textContent = quarter;
                quarterBtn.title = `${quarter} 분기 노트 열기`;
                quarterBtn.addEventListener('click', () => {
                    this.onQuarterClick(this.currentDate.year(), index + 1);
                });
            });
        }
		
        // 요일 헤더
        const weekdays = container.createDiv({ cls: 'synaptic-calendar-weekdays' });
        
        // 주차 열 헤더 (주간 노트 사용 시에만)
        if (hasWeek) {
            const weekNumHeader = weekdays.createDiv({ cls: 'synaptic-calendar-weekday synaptic-calendar-weekday-week' });
            weekNumHeader.textContent = 'W';
        }
		
		const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
		dayNames.forEach(day => {
			const dayHeader = weekdays.createDiv({ cls: 'synaptic-calendar-weekday' });
			dayHeader.textContent = day;
		});
		
		// 달력 그리드
		const calendarGrid = container.createDiv({ cls: 'synaptic-calendar-grid' });
		
		// 현재 월의 첫 번째 날과 마지막 날
		const startOfMonth = this.currentDate.clone().startOf('month');
		const endOfMonth = this.currentDate.clone().endOf('month');
		const startOfWeek = startOfMonth.clone().startOf('week');
		const endOfWeek = endOfMonth.clone().endOf('week');
		
		// 달력 날짜 생성
		const current = startOfWeek.clone();
		const today = moment();
		
		let weekRow: HTMLElement | null = null;
		let weekStart: moment.Moment | null = null;
		
		while (current.isSameOrBefore(endOfWeek)) {
			// 새로운 주 시작
            if (current.day() === 0 || weekRow === null) {
				weekRow = calendarGrid.createDiv({ cls: 'synaptic-calendar-week' });
				weekStart = current.clone();
				const capturedWeekStart = weekStart.clone();
				
                // 주차 번호 표시 (주간 노트 사용 시에만)
                if (hasWeek) {
                    const weekNumEl = weekRow.createDiv({ cls: 'synaptic-calendar-week-number' });
                    weekNumEl.textContent = current.format('ww');
                    weekNumEl.title = `${current.format('gggg-[W]ww')} 주간 노트 열기`;
                    
                    // 주차 번호 클릭 이벤트
                    weekNumEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (capturedWeekStart) {
                            this.onWeekClick(capturedWeekStart);
                        }
                    });
                }
			}
			
			const dayEl = weekRow.createDiv({ cls: 'synaptic-calendar-day' });
			const dateForCell = current.clone();
			
			// 날짜 텍스트
			dayEl.textContent = dateForCell.format('D');
			
			// 현재 월이 아니면 회색으로
			if (!dateForCell.isSame(this.currentDate, 'month')) {
				dayEl.addClass('synaptic-calendar-day-other-month');
			}
			
			// 오늘 날짜 강조
			if (dateForCell.isSame(today, 'day')) {
				dayEl.addClass('synaptic-calendar-day-today');
			}
			
			// 날짜 클릭 이벤트
			dayEl.addEventListener('click', (e) => {
				e.stopPropagation();
				this.onDayClick(dateForCell);
			});
			
			current.add(1, 'day');
		}
		
	}

	/**
	 * 날짜 클릭 처리
	 */
	private async onDayClick(date: moment.Moment) {
		try {
			const allDailyNotes = getAllDailyNotes();
			let file = getDailyNote(date, allDailyNotes);
			
			if (!file) {
				file = await createDailyNote(date);
			}
			
			if (file && this.calendarButtonFile) {
				// 파일 경로 업데이트
				const filePath = file.path;
				this.onUpdateActiveButton(filePath, this.calendarButtonFile.id);
				
				// QuickAccessFile 형태로 변환하여 onFileSelect 호출
				// type을 'file'로 전달하여 이미 생성된 파일을 직접 열도록 함
				const tempFile: QuickAccessFile = {
					...this.calendarButtonFile,
					type: 'file',
					filePath: filePath
				};
				this.onFileSelect(tempFile);
			} else {
				new Notice('📅 데일리 노트를 열 수 없습니다.');
			}
		} catch (error) {
			console.error('[Calendar] 데일리 노트 열기 실패:', error);
			new Notice('📅 데일리 노트를 여는 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 주간 클릭 처리
	 */
	private async onWeekClick(date: moment.Moment) {
		try {
			const allWeeklyNotes = getAllWeeklyNotes();
			let file = getWeeklyNote(date, allWeeklyNotes);
			
			if (!file) {
				file = await createWeeklyNote(date);
			}
			
			if (file && this.calendarButtonFile) {
				const filePath = file.path;
				this.onUpdateActiveButton(filePath, this.calendarButtonFile.id);
				
				const tempFile: QuickAccessFile = {
					...this.calendarButtonFile,
					type: 'file',
					filePath: filePath
				};
				this.onFileSelect(tempFile);
			} else {
				new Notice('📅 주간 노트를 열 수 없습니다.');
			}
		} catch (error) {
			console.error('[Calendar] 주간 노트 열기 실패:', error);
			new Notice('📅 주간 노트를 여는 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 년간 클릭 처리
	 */
	private async onYearClick(date: moment.Moment) {
		try {
			const allYearlyNotes = getAllYearlyNotes();
			let file = getYearlyNote(date, allYearlyNotes);
			
			if (!file) {
				file = await createYearlyNote(date);
			}
			
			if (file && this.calendarButtonFile) {
				const filePath = file.path;
				this.onUpdateActiveButton(filePath, this.calendarButtonFile.id);
				
				const tempFile: QuickAccessFile = {
					...this.calendarButtonFile,
					type: 'file',
					filePath: filePath
				};
				this.onFileSelect(tempFile);
			} else {
				new Notice('📅 년간 노트를 열 수 없습니다.');
			}
		} catch (error) {
			console.error('[Calendar] 년간 노트 열기 실패:', error);
			new Notice('📅 년간 노트를 여는 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 월간 클릭 처리
	 */
	private async onMonthClick(date: moment.Moment) {
		try {
			const allMonthlyNotes = getAllMonthlyNotes();
			let file = getMonthlyNote(date, allMonthlyNotes);
			
			if (!file) {
				file = await createMonthlyNote(date);
			}
			
			if (file && this.calendarButtonFile) {
				const filePath = file.path;
				this.onUpdateActiveButton(filePath, this.calendarButtonFile.id);
				
				const tempFile: QuickAccessFile = {
					...this.calendarButtonFile,
					type: 'file',
					filePath: filePath
				};
				this.onFileSelect(tempFile);
			} else {
				new Notice('📅 월간 노트를 열 수 없습니다.');
			}
		} catch (error) {
			console.error('[Calendar] 월간 노트 열기 실패:', error);
			new Notice('📅 월간 노트를 여는 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 분기 클릭 처리
	 */
	private async onQuarterClick(year: number, quarter: number) {
		try {
			// 분기의 첫 월을 기준으로 moment 생성
			const firstMonth = (quarter - 1) * 3;
			const date = moment().year(year).month(firstMonth).startOf('month');
			
			const allQuarterlyNotes = getAllQuarterlyNotes();
			let file = getQuarterlyNote(date, allQuarterlyNotes);
			
			if (!file) {
				file = await createQuarterlyNote(date);
			}
			
			if (file && this.calendarButtonFile) {
				const filePath = file.path;
				this.onUpdateActiveButton(filePath, this.calendarButtonFile.id);
				
				const tempFile: QuickAccessFile = {
					...this.calendarButtonFile,
					type: 'file',
					filePath: filePath
				};
				this.onFileSelect(tempFile);
			} else {
				new Notice('📅 분기 노트를 열 수 없습니다.');
			}
		} catch (error) {
			console.error('[Calendar] 분기 노트 열기 실패:', error);
			new Notice('📅 분기 노트를 여는 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 서브메뉴 열기
	 */
	openSubmenu(button: HTMLElement) {
		const submenu = button.querySelector('.synaptic-calendar-submenu') as HTMLElement;
		if (!submenu) return;

		this.cancelHideTimer();

		if (this.openedSubmenu && this.openedSubmenu !== submenu) {
			this.openedSubmenu.removeClass('synaptic-submenu-opened');
		}

		submenu.addClass('synaptic-submenu-opened');
		this.openedSubmenu = submenu;
	}

	/**
	 * 서브메뉴 닫기 예약 (현재 사용되지 않음 - 순수 CSS hover 방식 사용)
	 */
	scheduleClose(delay: number = 150) {
		this.cancelHideTimer();
		this.hideTimeout = window.setTimeout(() => {
			this.closeSubmenu();
		}, delay);
	}

	/**
	 * 닫기 예약 취소
	 */
	cancelHideTimer() {
		if (this.hideTimeout !== null) {
			window.clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	/**
	 * 서브메뉴 닫기
	 */
	closeSubmenu() {
		this.cancelHideTimer();
		if (this.openedSubmenu) {
			this.openedSubmenu.removeClass('synaptic-submenu-opened');
			this.openedSubmenu = null;
		}
	}
}
