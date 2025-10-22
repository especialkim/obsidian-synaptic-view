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
	replaceNewTabWithSynapticView: boolean; // Replace New Tab with Synaptic View
	defaultViewIndex: number; // Default view to show when Synaptic View opens (1-based index)
	quickAccessFiles: QuickAccessFile[];
	recentIcons: string[];
	// View Style Options (Preview mode only)
	hideInlineTitle: boolean;
	hideEmbeddedMentions: boolean;
	// Misc Options
	showDailyNoteBadge: boolean; // Show Daily Note task badge on Journal/Calendar buttons
}

export const DEFAULT_SETTINGS: SynapticViewSettings = {
	replaceNewTabWithSynapticView: false, // Default: off
	defaultViewIndex: 1, // Default: first item
	quickAccessFiles: [],
	recentIcons: [],
	hideInlineTitle: true,
	hideEmbeddedMentions: true,
	showDailyNoteBadge: false // Default: off
}

