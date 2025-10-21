/**
 * Extended type definitions for Obsidian APIs that are not officially typed
 * These APIs are part of Obsidian's public API but lack TypeScript definitions
 */

import { App, TFile, TFolder } from 'obsidian';

declare module 'obsidian' {
	interface App {
		// Commands API - publicly available for executing commands
		commands: {
			executeCommandById(commandId: string): boolean;
			listCommands(): Array<{ id: string; name: string }>;
		};
		
		// Settings API - publicly available for opening settings
		setting: {
			open(): Promise<void>;
			openTabById(tabId: string): void;
			close(): void;
		};
		
		// Plugins API - for checking enabled plugins
		plugins: {
			enabledPlugins: Set<string> | string[];
			plugins: Record<string, any>;
		};
	}
	
	interface FileManager {
		/**
		 * Create a new markdown file with an auto-generated name
		 * @param folder - Parent folder for the new file
		 * @param basename - Base name for the file (empty string for auto-generated "Untitled")
		 * @returns Promise resolving to the created TFile
		 */
		createNewMarkdownFile(folder: TFolder, basename: string): Promise<TFile>;
	}
}

/**
 * Type definitions for obsidian-daily-notes-interface settings
 */
export interface PeriodicNoteSettings {
	format?: string;
	folder?: string;
	template?: string;
}

