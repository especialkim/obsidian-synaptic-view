import { App, moment, TFile } from 'obsidian';
import { 
	createDailyNote, 
	createWeeklyNote,
	createMonthlyNote,
	createQuarterlyNote,
	createYearlyNote,
	getAllDailyNotes, 
	getAllWeeklyNotes,
	getAllMonthlyNotes,
	getAllQuarterlyNotes,
	getAllYearlyNotes,
	getDailyNote,
	getWeeklyNote,
	getMonthlyNote,
	getQuarterlyNote,
	getYearlyNote,
	appHasDailyNotesPluginLoaded,
	appHasWeeklyNotesPluginLoaded,
	appHasMonthlyNotesPluginLoaded,
	appHasQuarterlyNotesPluginLoaded,
	appHasYearlyNotesPluginLoaded,
	getDailyNoteSettings,
	getWeeklyNoteSettings,
	getMonthlyNoteSettings,
	getQuarterlyNoteSettings,
	getYearlyNoteSettings
} from 'obsidian-daily-notes-interface';
import { JournalGranularity } from '../settings';
import { PeriodicNoteSettings } from '../obsidian-ex';

/**
 * 특정 플러그인이 설치되고 활성화되어 있는지 확인
 * @param app - Obsidian App 인스턴스
 * @param pluginId - 확인할 플러그인 ID
 * @returns 플러그인이 설치되고 활성화되어 있으면 true
 */
export function isPluginEnabled(app: App, pluginId: string): boolean {
	const plugins = app.plugins;
	
	if (!plugins) {
		return false;
	}
	
	// enabledPlugins는 Set 또는 배열일 수 있음
	if (plugins.enabledPlugins) {
		if (plugins.enabledPlugins instanceof Set) {
			return plugins.enabledPlugins.has(pluginId);
		} else if (Array.isArray(plugins.enabledPlugins)) {
			return plugins.enabledPlugins.includes(pluginId);
		}
	}
	
	// plugins 객체에서 직접 확인
	return !!plugins.plugins?.[pluginId];
}

/**
 * Journal 기능이 사용 가능한지 확인
 * Core Daily Notes 또는 Periodic Notes 플러그인이 활성화되어 있으면 true
 * @returns Journal 기능 사용 가능 여부
 */
export function isJournalAvailable(): boolean {
	return appHasDailyNotesPluginLoaded();
}

/**
 * 특정 granularity가 활성화되어 있는지 확인
 * @param granularity - 확인할 granularity
 * @returns 활성화 여부
 */
export function isGranularityAvailable(granularity: JournalGranularity): boolean {
	switch (granularity) {
		case 'day':
			return appHasDailyNotesPluginLoaded();
		case 'week':
			return appHasWeeklyNotesPluginLoaded();
		case 'month':
			return appHasMonthlyNotesPluginLoaded();
		case 'quarter':
			return appHasQuarterlyNotesPluginLoaded();
		case 'year':
			return appHasYearlyNotesPluginLoaded();
		default:
			return false;
	}
}

/**
 * 사용 가능한 granularity 목록 가져오기
 * 사용자의 Periodic Notes 설정에 따라 동적으로 반환
 * @returns 사용 가능한 granularity 배열
 */
export function getAvailableGranularities(): JournalGranularity[] {
	const available: JournalGranularity[] = [];
	
	const granularities: JournalGranularity[] = ['day', 'week', 'month', 'quarter', 'year'];
	
	for (const granularity of granularities) {
		if (isGranularityAvailable(granularity)) {
			available.push(granularity);
		}
	}
	
	return available;
}

/**
 * Calendar 기능이 의미 있게 사용 가능한지 확인
 * - 주/월/분기/연간 중 하나라도 사용 가능하거나, 커뮤니티 Calendar 플러그인이 활성화된 경우
 */
export function isCalendarFeatureAvailable(app?: App): boolean {
    const granularitiesAvailable = (
        isGranularityAvailable('day') ||
        isGranularityAvailable('week') ||
        isGranularityAvailable('month') ||
        isGranularityAvailable('quarter') ||
        isGranularityAvailable('year')
    );
    const communityCalendar = app ? isPluginEnabled(app, 'calendar') : false;
    return granularitiesAvailable || communityCalendar;
}

/**
 * Daily Note format 정보 가져오기
 * obsidian-daily-notes-interface를 통해 설정 가져오기
 * @returns format 패턴 문자열 (예: "YYYY-MM-DD(ddd)") 또는 기본값
 */
export function getDailyNoteFormat(): { format: string; folder: string } {
	if (!isJournalAvailable()) {
		return {
			format: 'YYYY-MM-DD',
			folder: ''
		};
	}
	
	try {
		const settings = getDailyNoteSettings();
		return {
			format: settings.format || 'YYYY-MM-DD',
			folder: settings.folder || ''
		};
	} catch (error) {
		console.error('[Synaptic View] Daily Note 설정 가져오기 실패:', error);
		return {
			format: 'YYYY-MM-DD',
			folder: ''
		};
	}
}

/**
 * 오늘의 Daily Note 파일 경로 생성 (동적)
 * @returns 오늘의 Daily Note 파일 경로
 */
export function getTodayDailyNotePath(): string {
	const formatInfo = getDailyNoteFormat();
	
	try {
		// moment를 사용해 오늘 날짜를 포맷팅 (매번 실행 시점의 오늘)
		const today = moment().format(formatInfo.format);
		
		// 폴더가 있으면 경로 조합, 없으면 파일명만
		const filePath = formatInfo.folder 
			? `${formatInfo.folder}/${today}.md`
			: `${today}.md`;
		
		return filePath;
	} catch (error) {
		console.error('[Synaptic View] Daily Note 경로 생성 실패:', error);
		return 'YYYY-MM-DD.md';
	}
}

/**
 * Granularity별 Journal Note 경로 가져오기
 * @param granularity - 노트 타입 (day, week, month, quarter, year)
 * @returns Journal Note 파일 경로
 */
export function getJournalNotePath(granularity: JournalGranularity): string {
	const today = moment();
	let settings: PeriodicNoteSettings;
	let formatPattern: string;
	
	try {
		switch (granularity) {
			case 'day':
				settings = getDailyNoteSettings();
				formatPattern = settings.format || 'YYYY-MM-DD';
				break;
			case 'week':
				settings = getWeeklyNoteSettings();
				formatPattern = settings.format || 'gggg-[W]ww';
				break;
			case 'month':
				settings = getMonthlyNoteSettings();
				formatPattern = settings.format || 'YYYY-MM';
				break;
			case 'quarter':
				settings = getQuarterlyNoteSettings();
				formatPattern = settings.format || 'YYYY-[Q]Q';
				break;
			case 'year':
				settings = getYearlyNoteSettings();
				formatPattern = settings.format || 'YYYY';
				break;
			default:
				return 'YYYY-MM-DD.md';
		}
		
		const filename = today.format(formatPattern);
		const folder = settings.folder || '';
		
		return folder ? `${folder}/${filename}.md` : `${filename}.md`;
		
	} catch (error) {
		console.error('[Synaptic View] Journal Note 경로 생성 실패:', error);
		return 'YYYY-MM-DD.md';
	}
}

/**
 * Granularity별 Journal Note 생성
 * @param granularity - 노트 타입 (day, week, month, quarter, year)
 * @returns 생성된 TFile 또는 null
 */
export async function createJournalNote(granularity: JournalGranularity): Promise<TFile | null> {
		try {
			const today = moment();
		let existingFile: TFile | null = null;
		let createFunc: (date: moment.Moment) => Promise<TFile>;
		
		// Granularity별로 존재 여부 확인 및 생성 함수 선택
		switch (granularity) {
			case 'day':
				const allDailyNotes = getAllDailyNotes();
				existingFile = getDailyNote(today, allDailyNotes);
				createFunc = createDailyNote;
				break;
			case 'week':
				const allWeeklyNotes = getAllWeeklyNotes();
				existingFile = getWeeklyNote(today, allWeeklyNotes);
				createFunc = createWeeklyNote;
				break;
			case 'month':
				const allMonthlyNotes = getAllMonthlyNotes();
				existingFile = getMonthlyNote(today, allMonthlyNotes);
				createFunc = createMonthlyNote;
				break;
			case 'quarter':
				const allQuarterlyNotes = getAllQuarterlyNotes();
				existingFile = getQuarterlyNote(today, allQuarterlyNotes);
				createFunc = createQuarterlyNote;
				break;
			case 'year':
				const allYearlyNotes = getAllYearlyNotes();
				existingFile = getYearlyNote(today, allYearlyNotes);
				createFunc = createYearlyNote;
				break;
			default:
				return null;
		}
		
			// 이미 존재하면 반환
			if (existingFile) {
				return existingFile;
			}
		
			// 파일 생성
			const file = await createFunc(today);
		
			if (file) {
				return file;
			}
			
			return null;
		
		} catch (error) {
			return null;
		}
}

/**
 * 오늘의 Daily Note 생성 (레거시 호환용)
 * @deprecated createJournalNote('day')를 사용하세요
 */
export async function createTodayDailyNote(): Promise<TFile | null> {
	return createJournalNote('day');
}


