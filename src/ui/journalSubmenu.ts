import { App } from 'obsidian';
import { SynapticViewSettings, QuickAccessFile, JournalGranularity } from '../settings';
import { getAvailableGranularities, getJournalNotePath } from '../utils/pluginChecker';

export class JournalSubmenu {
	private app: App;
	private settings: SynapticViewSettings;
	private onFileSelect: (quickAccessFile: QuickAccessFile) => void;
	private onUpdateActiveButton: (filePath: string, activeButtonId?: string) => void;
	private openedSubmenu: HTMLElement | null = null;

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

	addJournalSubmenu(button: HTMLElement, file: QuickAccessFile) {
		// 기존 서브메뉴가 있으면 제거 (중복 방지)
		const existingSubmenu = button.querySelector('.synaptic-journal-submenu');
		if (existingSubmenu) {
			existingSubmenu.remove();
		}
		
		const submenu = button.createDiv({ cls: 'synaptic-journal-submenu' });

		const availableGranularities = getAvailableGranularities();

 		const granularityLabels: Record<JournalGranularity, string> = {
 			'all': 'All',
 			'day': 'Daily',
 			'week': 'Weekly',
 			'month': 'Monthly',
 			'quarter': 'Quarterly',
 			'year': 'Yearly'
 		};

 		const badgeLabels: Record<JournalGranularity, string> = {
 			'all': 'J',
 			'day': 'D',
 			'week': 'W',
 			'month': 'M',
 			'quarter': 'Q',
 			'year': 'Y'
 		};

 		availableGranularities.forEach(granularity => {
 			const item = submenu.createDiv({ cls: 'synaptic-journal-submenu-item' });

 			const badgeEl = item.createDiv({ cls: 'synaptic-journal-submenu-badge' });
 			badgeEl.textContent = badgeLabels[granularity];

 			const labelEl = item.createDiv({ cls: 'synaptic-journal-submenu-label' });
 			labelEl.textContent = granularityLabels[granularity];

 			item.addEventListener('click', (e) => {
 				e.stopPropagation();
 				const tempFile: QuickAccessFile = {
 					...file,
 					granularity: granularity
 				};
 				const filePath = getJournalNotePath(granularity);
 				this.onUpdateActiveButton(filePath, file.id);
 				this.onFileSelect(tempFile);
 				this.closeSubmenu();
 			});
 		});
 	}

 	openSubmenu(button: HTMLElement) {
 		const submenu = button.querySelector('.synaptic-journal-submenu') as HTMLElement;
 		if (!submenu) return;
 		if (this.openedSubmenu && this.openedSubmenu !== submenu) {
 			this.openedSubmenu.removeClass('synaptic-submenu-opened');
 		}
 		submenu.addClass('synaptic-submenu-opened');
 		this.openedSubmenu = submenu;
 	}

 	closeSubmenu() {
 		if (this.openedSubmenu) {
 			this.openedSubmenu.removeClass('synaptic-submenu-opened');
 			this.openedSubmenu = null;
 		}
 	}
}


