import { App, TFile } from 'obsidian';
import { getDailyNoteTaskCount, isJournalAvailable, getJournalNotePath } from '../utils/pluginChecker';

/**
 * Daily Note task 배지 관리 클래스
 */
export class DailyNoteBadgeManager {
	private app: App;
	private buttonContainer: HTMLElement | null = null;

	constructor(app: App) {
		this.app = app;
	}

	/**
	 * 버튼 컨테이너 설정 (배지 업데이트 시 사용)
	 */
	setButtonContainer(container: HTMLElement | null) {
		this.buttonContainer = container;
	}

	/**
	 * Daily Note task 배지를 업데이트합니다.
	 * 우선순위: Journal Daily > Journal All > Calendar (하나만 표시)
	 * @param buttonContainer - 버튼 컨테이너 엘리먼트
	 */
	async updateDailyNoteTaskBadges(buttonContainer: HTMLElement | null) {
		// buttonContainer가 없으면 종료
		if (!buttonContainer) return;

		// Daily Notes가 활성화되어 있지 않으면 배지를 표시하지 않음
		if (!isJournalAvailable()) {
			return;
		}

		// Daily Note task 개수 가져오기
		const taskCount = await getDailyNoteTaskCount(this.app);
		
		// Daily Note가 없거나 task 카운팅 실패 시 배지를 표시하지 않음
		if (!taskCount) {
			return;
		}

		const { incomplete, completed } = taskCount;
		const totalTasks = incomplete + completed;

		// 우선순위에 따라 하나의 버튼만 선택
		let selectedButton: HTMLElement | null = null;
		
		// 1순위: Journal Daily
		selectedButton = buttonContainer.querySelector('.synaptic-action-button[data-file-type="journal"][data-granularity="day"]') as HTMLElement;
		
		// 2순위: Journal All (Daily가 없을 때만)
		if (!selectedButton) {
			selectedButton = buttonContainer.querySelector('.synaptic-action-button[data-file-type="journal"][data-granularity="all"]') as HTMLElement;
		}
		
		// 3순위: Calendar (Journal이 없을 때만)
		if (!selectedButton) {
			selectedButton = buttonContainer.querySelector('.synaptic-action-button[data-file-type="calendar"]') as HTMLElement;
		}

		// 선택된 버튼이 있으면 task 배지 추가
		if (selectedButton) {
			this.addTaskBadge(selectedButton, incomplete, totalTasks);
		}
	}

	/**
	 * 버튼에 task 배지를 추가합니다.
	 * @param button - 배지를 추가할 버튼 엘리먼트
	 * @param incomplete - 미완료 task 개수
	 * @param totalTasks - 전체 task 개수
	 */
	private addTaskBadge(button: HTMLElement, incomplete: number, totalTasks: number) {
		// 기존 task 배지 제거 (중복 방지)
		const existingBadge = button.querySelector('.synaptic-task-badge');
		if (existingBadge) {
			existingBadge.remove();
		}

		// task가 하나도 없으면 배지를 표시하지 않음
		if (totalTasks === 0) {
			return;
		}

		// task 배지 생성
		const badge = button.createDiv({ cls: 'synaptic-task-badge' });

		// 모든 task가 완료되었으면 초록색 점
		if (incomplete === 0) {
			badge.addClass('synaptic-task-badge-completed');
			badge.textContent = '✓';
		} else {
			// 미완료 task가 있으면 빨간색 배지에 개수 표시
			badge.addClass('synaptic-task-badge-incomplete');
			badge.textContent = incomplete.toString();
		}
	}

	/**
	 * Task 배지를 복원합니다 (restoreOriginalIcon에서 사용)
	 * @param button - 버튼 엘리먼트
	 * @returns task 배지 엘리먼트 (없으면 null)
	 */
	static saveTaskBadge(button: HTMLElement): HTMLElement | null {
		const taskBadge = button.querySelector('.synaptic-task-badge') as HTMLElement;
		if (taskBadge) {
			taskBadge.detach();
			return taskBadge;
		}
		return null;
	}

	/**
	 * 저장된 task 배지를 버튼에 다시 추가합니다
	 * @param button - 버튼 엘리먼트
	 * @param taskBadge - 저장된 배지 엘리먼트
	 */
	static restoreTaskBadge(button: HTMLElement, taskBadge: HTMLElement | null) {
		if (taskBadge) {
			button.appendChild(taskBadge);
		}
	}

	/**
	 * 메타데이터 캐시를 사용하여 Daily Note task 배지를 업데이트합니다.
	 * (metadataCache.on('changed') 이벤트에서 호출)
	 * @param file - 변경된 파일
	 */
	async updateBadgeFromCache(file: TFile) {
		// Daily Notes가 활성화되어 있지 않으면 무시
		if (!isJournalAvailable()) {
			return;
		}

		// 오늘 Daily Note인지 확인 (경로 비교 - 매우 가벼움)
		const todayPath = getJournalNotePath('day');
		if (file.path !== todayPath) {
			return; // Daily Note가 아니면 무시
		}

		// 메타데이터 캐시에서 task 정보 가져오기
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) {
			// 캐시가 없으면 기존 방식으로 fallback
			await this.updateDailyNoteTaskBadges(this.buttonContainer);
			return;
		}

		// 메타데이터에서 list items (tasks 포함) 가져오기
		const listItems = cache.listItems || [];
		
		// Task만 필터링
		const tasks = listItems.filter(item => item.task !== undefined);
		
		// 미완료 task (task === ' ')
		const incomplete = tasks.filter(item => item.task === ' ').length;
		
		// 완료된 task (task === 'x' 또는 'X')
		const completed = tasks.filter(item => item.task === 'x' || item.task === 'X').length;
		
		const totalTasks = incomplete + completed;

		// 버튼 컨테이너가 없으면 종료
		if (!this.buttonContainer) return;

		// 우선순위에 따라 하나의 버튼만 선택
		let selectedButton: HTMLElement | null = null;
		
		// 1순위: Journal Daily
		selectedButton = this.buttonContainer.querySelector('.synaptic-action-button[data-file-type="journal"][data-granularity="day"]') as HTMLElement;
		
		// 2순위: Journal All (Daily가 없을 때만)
		if (!selectedButton) {
			selectedButton = this.buttonContainer.querySelector('.synaptic-action-button[data-file-type="journal"][data-granularity="all"]') as HTMLElement;
		}
		
		// 3순위: Calendar (Journal이 없을 때만)
		if (!selectedButton) {
			selectedButton = this.buttonContainer.querySelector('.synaptic-action-button[data-file-type="calendar"]') as HTMLElement;
		}

		// 선택된 버튼이 있으면 task 배지 추가
		if (selectedButton) {
			this.addTaskBadge(selectedButton, incomplete, totalTasks);
		}
	}
}

