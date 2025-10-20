import { App, moment, Notice, setIcon } from 'obsidian';
import { SynapticViewSettings, QuickAccessFile } from '../settings';

export class CalendarSubmenu {
	private app: App;
	private settings: SynapticViewSettings;
	private onFileSelect: (quickAccessFile: QuickAccessFile) => void;
	private openedSubmenu: HTMLElement | null = null;
	private currentDate: moment.Moment = moment();
	private hideTimeout: number | null = null;

	constructor(app: App, settings: SynapticViewSettings, onFileSelect: (quickAccessFile: QuickAccessFile) => void) {
		this.app = app;
		this.settings = settings;
		this.onFileSelect = onFileSelect;
	}

	/**
	 * Calendar 버튼에 서브메뉴 추가
	 */
	addCalendarSubmenu(button: HTMLElement, file: QuickAccessFile) {
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
		
		// 년도 표시 (클릭 가능)
		const yearEl = header.createDiv({ cls: 'synaptic-calendar-year' });
		yearEl.textContent = this.currentDate.format('YYYY');
		yearEl.title = '년간 노트 열기';
		yearEl.addEventListener('click', () => {
			this.onYearClick(this.currentDate);
		});
		
		// 월 표시 (클릭 가능)
		const monthEl = header.createDiv({ cls: 'synaptic-calendar-month' });
		monthEl.textContent = this.currentDate.format('M월');
		monthEl.title = '월간 노트 열기';
		monthEl.addEventListener('click', () => {
			this.onMonthClick(this.currentDate);
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
		
		// 분기 버튼들
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
		
		// 요일 헤더
		const weekdays = container.createDiv({ cls: 'synaptic-calendar-weekdays' });
		
		// 주차 열 헤더 (빈 공간)
		const weekNumHeader = weekdays.createDiv({ cls: 'synaptic-calendar-weekday synaptic-calendar-weekday-week' });
		weekNumHeader.textContent = 'W';
		
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
				
				// 주차 번호 표시 (첫 번째 열)
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
	private onDayClick(date: moment.Moment) {
		const dateStr = date.format('YYYY-MM-DD');
		new Notice(`📅 ${dateStr} 데일리 노트를 엽니다`);
		console.log('[Calendar] 날짜 클릭:', dateStr);
		// TODO: 해당 날짜의 Daily Note 열기
	}

	/**
	 * 주간 클릭 처리
	 */
	private onWeekClick(date: moment.Moment) {
		const weekStr = date.format('gggg-[W]ww');
		new Notice(`📅 ${weekStr} 주간 노트를 엽니다`);
		console.log('[Calendar] 주간 클릭:', weekStr);
		// TODO: 해당 주의 Weekly Note 열기
	}

	/**
	 * 년간 클릭 처리
	 */
	private onYearClick(date: moment.Moment) {
		const yearStr = date.format('YYYY');
		new Notice(`📅 ${yearStr} 년간 노트를 엽니다`);
		console.log('[Calendar] 년간 클릭:', yearStr);
		// TODO: 해당 년도의 Yearly Note 열기
	}

	/**
	 * 월간 클릭 처리
	 */
	private onMonthClick(date: moment.Moment) {
		const monthStr = date.format('YYYY-MM');
		new Notice(`📅 ${monthStr} 월간 노트를 엽니다`);
		console.log('[Calendar] 월간 클릭:', monthStr);
		// TODO: 해당 월의 Monthly Note 열기
	}

	/**
	 * 분기 클릭 처리
	 */
	private onQuarterClick(year: number, quarter: number) {
		const quarterStr = `${year}-Q${quarter}`;
		new Notice(`📅 ${quarterStr} 분기 노트를 엽니다`);
		console.log('[Calendar] 분기 클릭:', quarterStr);
		// TODO: 해당 분기의 Quarterly Note 열기
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
