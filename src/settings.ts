export type QuickAccessType = 'file' | 'web' | 'calendar';

export interface QuickAccessFile {
	id: string;
	type: QuickAccessType;
	filePath: string;
	icon: string;
	enabled: boolean;
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

