import { getLanguage } from 'obsidian';

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
		misc: {
			title: string;
			showDailyNoteBadge: {
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
			fileNotFound: string;
			checkSettings: string;
		};
		setup: {
			title: string;
			noItems: string;
			addItems: string;
			openSettings: string;
		};
		emptyState: {
			noItems: string;
			addFirstItem: string;
		};
	};
	
	// Floating Buttons
	buttons: {
		createNewFile: string;
		searchFiles: string;
		settings: string;
		edit: string;
		dismiss: string;
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
		quickAccessItems: '빠른 접근 도구',
		addNewItem: '항목 추가',
		defaultView: {
			title: '시작 화면 설정',
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
		misc: {
			title: '기타',
			showDailyNoteBadge: {
				name: 'Daily Note 태스크 배지 표시',
				desc: 'Journal/Calendar 버튼에 오늘 Daily Note의 미완료 태스크 개수를 배지로 표시합니다.'
			}
		},
		fileType: {
			file: '파일',
			web: '웹페이지',
			journal: '주기 노트',
			calendar: '캘린더 뷰'
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
			all: '주기 노트 (전체)',
			daily: '주기 노트 (일간)',
			weekly: '주기 노트 (주간)',
			monthly: '주기 노트 (월간)',
			quarterly: '주기 노트 (분기)',
			yearly: '주기 노트 (연간)'
		},
		badges: {
			journal: '주기',
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
			enterUrl: 'URL을 입력하세요.',
			fileNotFound: '파일이 존재하지 않습니다.',
			checkSettings: 'Quick Access 설정을 확인해보세요.'
		},
		setup: {
			title: '🎯 Synaptic View',
			noItems: 'Quick Access 항목이 설정되지 않았습니다.',
			addItems: '설정에서 항목을 추가하여 시작하세요.',
			openSettings: '⚙️ 설정 열기'
		},
		emptyState: {
			noItems: '아직 항목이 없습니다.',
			addFirstItem: '+ 버튼을 눌러 첫 번째 Quick Access 항목을 추가하세요.'
		}
	},
	buttons: {
		createNewFile: '새 파일 만들기',
		searchFiles: '파일 검색',
		settings: '설정',
		edit: '편집',
		dismiss: '해제'
	}
};

/**
 * English translations (default)
 */
const en: Translations = {
	settings: {
		title: 'Synaptic View',
		replaceNewTab: {
			name: 'Replace new tab with Synaptic View',
			desc: 'When enabled, clicking the new tab button opens Synaptic View instead of the default empty state.'
		},
		quickAccessItems: 'Quick access tools',
		addNewItem: 'Add item',
		defaultView: {
			title: 'Startup screen',
			name: 'Default item to open',
			desc: 'Choose which quick access item opens by default in Synaptic View.'
		},
		viewStyle: {
			title: 'View style',
			notice: '⚠️ These settings apply only in preview mode.',
			hideInlineTitle: {
				name: 'Hide inline title',
				desc: 'Hide the inline title at the top of the document (suitable for dashboard-style views).'
			},
			hideEmbeddedMentions: {
				name: 'Hide embedded mentions',
				desc: 'Hide embedded backlinks and mentions at the bottom of the document.'
			}
		},
		misc: {
			title: 'Miscellaneous',
			showDailyNoteBadge: {
				name: 'Show daily note task badge',
				desc: 'Show a badge on journal/calendar buttons indicating incomplete tasks in today\'s daily note.'
			}
		},
		fileType: {
			file: 'File',
			web: 'Web page',
			journal: 'Journal',
			calendar: 'Calendar view'
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
			enterUrl: 'Please enter a URL.',
			fileNotFound: 'File does not exist.',
			checkSettings: 'Please check Quick Access settings.'
		},
		setup: {
			title: '🎯 Synaptic View',
			noItems: 'No Quick Access items configured.',
			addItems: 'Add items in settings to get started.',
			openSettings: '⚙️ Open Settings'
		},
		emptyState: {
			noItems: 'No items yet.',
			addFirstItem: 'Click + button to add your first Quick Access item.'
		}
	},
	buttons: {
		createNewFile: 'Create new file',
		searchFiles: 'Search files',
		settings: 'Settings',
		edit: 'Edit',
		dismiss: 'Dismiss'
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
 * Get current locale from Obsidian settings
 * Returns 'ko' for Korean, 'en' for all others
 */
export function getCurrentLocale(): string {
	const locale = getLanguage();
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

