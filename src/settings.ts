export type QuickAccessType = 'file' | 'web' | 'calendar' | 'journal';

export type JournalGranularity = 'all' | 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface QuickAccessFile {
	id: string;
	type: QuickAccessType;
	filePath: string;
	icon: string;
	enabled: boolean;
	// journal 타입일 때만 사용
	granularity?: JournalGranularity;
}

export interface SynapticViewSettings {
	enableQuickAccess: boolean;
	quickAccessFiles: QuickAccessFile[];
	recentIcons: string[];
	// View Style Options (Preview mode only)
	hideInlineTitle: boolean;
	hideEmbeddedMentions: boolean;
}

export const DEFAULT_SETTINGS: SynapticViewSettings = {
	enableQuickAccess: false,
	quickAccessFiles: [],
	recentIcons: [],
	hideInlineTitle: true,
	hideEmbeddedMentions: true
}

