import { moment } from 'obsidian';

/**
 * Translation dictionary structure
 */
interface Translations {
	// Settings Tab
	settings: {
		title: string;
		replaceNewTab: {
			name: string;
			desc: string;
		};
		quickAccessItems: string;
		addNewItem: string;
		defaultView: {
			title: string;
			name: string;
			desc: string;
		};
		viewStyle: {
			title: string;
			notice: string;
			hideInlineTitle: {
				name: string;
				desc: string;
			};
			hideEmbeddedMentions: {
				name: string;
				desc: string;
			};
		};
		fileType: {
			file: string;
			web: string;
			journal: string;
			calendar: string;
		};
		granularity: {
			all: string;
			day: string;
			week: string;
			month: string;
			quarter: string;
			year: string;
		};
		journal: {
			all: string;
			daily: string;
			weekly: string;
			monthly: string;
			quarterly: string;
			yearly: string;
		};
		badges: {
			journal: string;
			day: string;
			week: string;
			month: string;
			quarter: string;
			year: string;
			web: string;
			calendar: string;
		};
		placeholder: {
			selectNoteType: string;
			filePath: string;
			webUrl: string;
			noConfig: string;
			noFile: string;
			noUrl: string;
		};
		submenu: string;
		notSelectable: string;
		moveUp: string;
		moveDown: string;
		delete: string;
		notices: {
			selectNoteType: string;
			enterFilePath: string;
			enterUrl: string;
		};
	};
	
	// Floating Buttons
	buttons: {
		createNewFile: string;
		searchFiles: string;
		settings: string;
		edit: string;
	};
}

/**
 * Korean translations
 */
const ko: Translations = {
	settings: {
		title: 'Synaptic View',
		replaceNewTab: {
			name: '새 탭을 Synaptic View로 대체',
			desc: '활성화하면 새 탭 버튼 클릭 시 기본 빈 상태 대신 Synaptic View가 열립니다.'
		},
		quickAccessItems: '빠른 접근 항목',
		addNewItem: 'Add new item',
		defaultView: {
			title: '기본 보기',
			name: '기본으로 열 항목',
			desc: 'Synaptic View에서 기본으로 열릴 빠른 접근 항목을 선택하세요.'
		},
		viewStyle: {
			title: '보기 스타일',
			notice: '⚠️ 이 설정은 미리보기 모드에서만 적용됩니다.',
			hideInlineTitle: {
				name: '인라인 제목 숨기기',
				desc: '문서 상단의 인라인 제목을 숨깁니다 (대시보드 스타일 보기에 적합).'
			},
			hideEmbeddedMentions: {
				name: '임베디드 멘션 숨기기',
				desc: '문서 하단의 임베디드 백링크와 멘션을 숨깁니다.'
			}
		},
		fileType: {
			file: '파일',
			web: '웹',
			journal: '저널',
			calendar: '캘린더'
		},
		granularity: {
			all: '전체',
			day: '일간',
			week: '주간',
			month: '월간',
			quarter: '분기',
			year: '연간'
		},
		journal: {
			all: '저널 (전체)',
			daily: '저널 (일간)',
			weekly: '저널 (주간)',
			monthly: '저널 (월간)',
			quarterly: '저널 (분기)',
			yearly: '저널 (연간)'
		},
		badges: {
			journal: 'J',
			day: '일',
			week: '주',
			month: '월',
			quarter: '분기',
			year: '년',
			web: '웹',
			calendar: '캘'
		},
		placeholder: {
			selectNoteType: '노트 타입 선택...',
			filePath: '파일 경로',
			webUrl: 'URL 입력 (https://...)',
			noConfig: '설정 불필요',
			noFile: '파일 없음',
			noUrl: 'URL 없음'
		},
		submenu: '서브메뉴',
		notSelectable: '선택 불가',
		moveUp: '위로 이동',
		moveDown: '아래로 이동',
		delete: '삭제',
		notices: {
			selectNoteType: '먼저 노트 타입 (일간, 주간 등)을 선택하세요.',
			enterFilePath: '파일 경로를 입력하세요.',
			enterUrl: 'URL을 입력하세요.'
		}
	},
	buttons: {
		createNewFile: '새 파일 만들기',
		searchFiles: '파일 검색',
		settings: '설정',
		edit: '편집'
	}
};

/**
 * English translations (default)
 */
const en: Translations = {
	settings: {
		title: 'Synaptic View',
		replaceNewTab: {
			name: 'Replace New Tab with Synaptic View',
			desc: 'When enabled, clicking the New Tab button opens Synaptic View instead of the default empty state.'
		},
		quickAccessItems: 'Quick Access Items',
		addNewItem: 'Add new item',
		defaultView: {
			title: 'Default View',
			name: 'Default item to open',
			desc: 'Choose which Quick Access item opens by default in Synaptic View.'
		},
		viewStyle: {
			title: 'View Style',
			notice: '⚠️ These settings apply only in Preview mode.',
			hideInlineTitle: {
				name: 'Hide inline title',
				desc: 'Hide the inline title at the top of the document (suitable for dashboard-style views).'
			},
			hideEmbeddedMentions: {
				name: 'Hide embedded mentions',
				desc: 'Hide embedded backlinks and mentions at the bottom of the document.'
			}
		},
		fileType: {
			file: 'File',
			web: 'Web',
			journal: 'Journal',
			calendar: 'Calendar'
		},
		granularity: {
			all: 'All',
			day: 'Daily',
			week: 'Weekly',
			month: 'Monthly',
			quarter: 'Quarterly',
			year: 'Yearly'
		},
		journal: {
			all: 'Journal (All)',
			daily: 'Journal (Daily)',
			weekly: 'Journal (Weekly)',
			monthly: 'Journal (Monthly)',
			quarterly: 'Journal (Quarterly)',
			yearly: 'Journal (Yearly)'
		},
		badges: {
			journal: 'J',
			day: 'D',
			week: 'W',
			month: 'M',
			quarter: 'Q',
			year: 'Y',
			web: 'Web',
			calendar: 'Cal'
		},
		placeholder: {
			selectNoteType: 'Select note type...',
			filePath: 'File path',
			webUrl: 'Enter URL (https://...)',
			noConfig: 'No configuration needed',
			noFile: 'No file',
			noUrl: 'No URL'
		},
		submenu: 'submenu',
		notSelectable: 'not selectable',
		moveUp: 'Move up',
		moveDown: 'Move down',
		delete: 'Delete',
		notices: {
			selectNoteType: 'Please select a note type (Daily, Weekly, etc.) first.',
			enterFilePath: 'Please enter a file path.',
			enterUrl: 'Please enter a URL.'
		}
	},
	buttons: {
		createNewFile: 'Create new file',
		searchFiles: 'Search files',
		settings: 'Settings',
		edit: 'Edit'
	}
};

/**
 * All available translations
 */
const translations: Record<string, Translations> = {
	ko,
	en
};

/**
 * Get current locale from Obsidian (via moment)
 * Returns 'ko' for Korean, 'en' for all others
 */
export function getCurrentLocale(): string {
	const locale = moment.locale();
	return locale === 'ko' ? 'ko' : 'en';
}

/**
 * Get translations for current locale
 */
export function getTranslations(): Translations {
	const locale = getCurrentLocale();
	return translations[locale] || translations.en;
}

/**
 * Shorthand: Get current translations
 */
export function t(): Translations {
	return getTranslations();
}

