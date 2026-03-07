import { App, PluginSettingTab, Setting, setIcon, DropdownComponent, Notice, normalizePath } from 'obsidian';
import SynapticViewPlugin from '../main';
import { QuickAccessFile, JournalGranularity } from './settings';
import { IconPickerModal } from './ui/iconPickerModal';
import { FilePathSuggest } from './ui/filePathSuggest';
import { isJournalAvailable, getAvailableGranularities, isCalendarFeatureAvailable } from './utils/pluginChecker';
import { t } from './utils/i18n';

export class SynapticViewSettingTab extends PluginSettingTab {
	plugin: SynapticViewPlugin;
	private quickAccessSectionEl: HTMLElement | null = null;
	private defaultViewSectionEl: HTMLElement | null = null;

	constructor(app: App, plugin: SynapticViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Returns Lucide icon name for Journal note type
	 */
	private getJournalIcon(granularity?: JournalGranularity): string {
		const iconMap: Record<JournalGranularity, string> = {
			'all': 'lucide-calendar-fold',
			'day': 'calendar-day',
			'week': 'calendar-week',
			'month': 'calendar-month',
			'quarter': 'calendar-quarter',
			'year': 'calendar-year'
		};

		return iconMap[granularity || 'day'];
	}

	private isSubmenuItem(file: QuickAccessFile): boolean {
		return (file.type === 'journal' && file.granularity === 'all') || file.type === 'calendar';
	}

	private getEnabledFiles(): QuickAccessFile[] {
		return this.plugin.settings.quickAccessFiles.filter(file => file.enabled);
	}

	private normalizeDefaultViewIndex() {
		const enabledFiles = this.getEnabledFiles();

		if (enabledFiles.length === 0) {
			this.plugin.settings.defaultViewIndex = 1;
			return;
		}

		const currentFile = enabledFiles[this.plugin.settings.defaultViewIndex - 1];
		if (currentFile && !this.isSubmenuItem(currentFile)) {
			return;
		}

		const firstSelectableIndex = enabledFiles.findIndex(file => !this.isSubmenuItem(file));
		this.plugin.settings.defaultViewIndex = firstSelectableIndex >= 0 ? firstSelectableIndex + 1 : 1;
	}

	private getCurrentDefaultFileId(): string | null {
		const enabledFiles = this.getEnabledFiles();
		return enabledFiles[this.plugin.settings.defaultViewIndex - 1]?.id || null;
	}

	private restoreDefaultViewIndex(preferredDefaultFileId: string | null) {
		if (preferredDefaultFileId) {
			const enabledFiles = this.getEnabledFiles();
			const preferredIndex = enabledFiles.findIndex(file => file.id === preferredDefaultFileId && !this.isSubmenuItem(file));
			if (preferredIndex >= 0) {
				this.plugin.settings.defaultViewIndex = preferredIndex + 1;
				return;
			}
		}

		this.normalizeDefaultViewIndex();
	}

	private async persistQuickAccessChanges(
		refreshOpenViews: boolean = true,
		preferredDefaultFileId: string | null = null
	) {
		this.restoreDefaultViewIndex(preferredDefaultFileId);
		await this.plugin.saveSettings();
		this.rerenderQuickAccessSections();

		if (refreshOpenViews) {
			this.plugin.refreshOpenSynapticViews();
		}
	}

	private rerenderQuickAccessSections() {
		this.renderQuickAccessSection();
		this.renderDefaultViewSection();
	}

	display(): void {
		const { containerEl } = this;
		const translations = t();

		containerEl.empty();
		containerEl.addClass('synaptic-view-settings');

		// Replace New Tab toggle
		new Setting(containerEl)
			.setName(translations.settings.replaceNewTab.name)
			.setDesc(translations.settings.replaceNewTab.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.replaceNewTabWithSynapticView)
				.onChange(async (value) => {
					this.plugin.settings.replaceNewTabWithSynapticView = value;
					await this.plugin.saveSettings();
					await this.plugin.customizeEmptyState();
				}));

		this.quickAccessSectionEl = containerEl.createDiv({ cls: 'synaptic-quick-access-section' });
		this.defaultViewSectionEl = containerEl.createDiv({ cls: 'synaptic-default-view-section' });

		this.renderQuickAccessSection();
		this.renderDefaultViewSection();

		// === View Style Settings ===
		this.renderViewStyleSettings(containerEl);
	}

	private renderQuickAccessSection() {
		if (!this.quickAccessSectionEl) {
			return;
		}

		const translations = t();
		this.quickAccessSectionEl.empty();

		new Setting(this.quickAccessSectionEl).setName(translations.settings.quickAccessItems).setHeading();

		const itemsContainer = this.quickAccessSectionEl.createDiv({ cls: 'synaptic-items-container' });
		this.renderQuickAccessFiles(itemsContainer);

		new Setting(this.quickAccessSectionEl)
			.addButton(button => button
				.setButtonText('+')
				.setTooltip(translations.settings.addNewItem)
				.setCta()
				.onClick(async () => {
					await this.addQuickAccessFile();
				}));
	}

	private renderDefaultViewSection() {
		if (!this.defaultViewSectionEl) {
			return;
		}

		const translations = t();
		const enabledFilesForDefault = this.getEnabledFiles();

		this.defaultViewSectionEl.empty();

		if (!enabledFilesForDefault.some(file => !this.isSubmenuItem(file))) {
			return;
		}

		this.normalizeDefaultViewIndex();

		new Setting(this.defaultViewSectionEl).setName(translations.settings.defaultView.title).setHeading();
		new Setting(this.defaultViewSectionEl)
			.setName(translations.settings.defaultView.name)
			.setDesc(translations.settings.defaultView.desc)
			.addDropdown(dropdown => {
				this.updateDefaultViewDropdown(dropdown, enabledFilesForDefault);

				dropdown
					.setValue(this.plugin.settings.defaultViewIndex.toString())
					.onChange(async (value) => {
						this.plugin.settings.defaultViewIndex = parseInt(value);
						this.normalizeDefaultViewIndex();
						await this.plugin.saveSettings();
					});
			});
	}

	/**
	 * Update Default view dropdown options
	 */
	private updateDefaultViewDropdown(dropdown: DropdownComponent, enabledFiles: QuickAccessFile[]) {
		const translations = t();

		dropdown.selectEl.empty();

		enabledFiles.forEach((file, index) => {
			const optionIndex = (index + 1).toString();
			let label = this.getFileLabel(file, index + 1);

			if (this.isSubmenuItem(file)) {
				label += ` (${translations.settings.submenu} - ${translations.settings.notSelectable})`;
			}

			dropdown.addOption(optionIndex, label);

			if (this.isSubmenuItem(file)) {
				const optionEl = dropdown.selectEl.querySelector(`option[value="${optionIndex}"]`) as HTMLOptionElement;
				if (optionEl) {
					optionEl.disabled = true;
				}
			}
		});

		this.normalizeDefaultViewIndex();
		dropdown.setValue(this.plugin.settings.defaultViewIndex.toString());
	}

	/**
	 * Check if Quick Access file is basically configured (simple validation)
	 */
	private isBasicSetupComplete(file: QuickAccessFile): boolean {
		if (file.type === 'journal') {
			return !!file.granularity;
		}

		if (file.type === 'file' || file.type === 'web') {
			return !!file.filePath && file.filePath.trim() !== '';
		}

		if (file.type === 'calendar') {
			return true;
		}

		return false;
	}

	private getFileLabel(file: QuickAccessFile, index: number): string {
		const translations = t();

		if (file.type === 'journal' && file.granularity) {
			const granularityLabels: Record<JournalGranularity, string> = {
				'all': translations.settings.journal.all,
				'day': translations.settings.journal.daily,
				'week': translations.settings.journal.weekly,
				'month': translations.settings.journal.monthly,
				'quarter': translations.settings.journal.quarterly,
				'year': translations.settings.journal.yearly
			};
			return `${index}. ${granularityLabels[file.granularity]}`;
		}

		if (file.type === 'calendar') {
			return `${index}. ${translations.settings.fileType.calendar}`;
		}

		if (file.type === 'web') {
			const url = `${translations.settings.fileType.web}: ` + file.filePath || translations.settings.placeholder.noUrl;
			return `${index}. ${url}`;
		}

		const fileName = `${translations.settings.fileType.file}: ` + file.filePath.split('/').pop() || file.filePath;
		return `${index}. ${fileName}`;
	}

	private renderViewStyleSettings(containerEl: HTMLElement) {
		const translations = t();

		new Setting(containerEl).setName(translations.settings.viewStyle.title).setHeading();

		const noticeEl = containerEl.createDiv({ cls: 'setting-item-description synaptic-settings-notice' });
		noticeEl.setText(translations.settings.viewStyle.notice);

		new Setting(containerEl)
			.setName(translations.settings.viewStyle.hideInlineTitle.name)
			.setDesc(translations.settings.viewStyle.hideInlineTitle.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideInlineTitle)
				.onChange(async (value) => {
					this.plugin.settings.hideInlineTitle = value;
					await this.plugin.saveSettings();
					this.plugin.refreshOpenSynapticViews();
				}));

		new Setting(containerEl)
			.setName(translations.settings.viewStyle.hideEmbeddedMentions.name)
			.setDesc(translations.settings.viewStyle.hideEmbeddedMentions.desc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideEmbeddedMentions)
				.onChange(async (value) => {
					this.plugin.settings.hideEmbeddedMentions = value;
					await this.plugin.saveSettings();
					this.plugin.refreshOpenSynapticViews();
				}));

		new Setting(containerEl).setName(translations.settings.misc?.title || 'Misc').setHeading();

		new Setting(containerEl)
			.setName(translations.settings.misc?.showDailyNoteBadge?.name || 'Show Daily Note task badge')
			.setDesc(translations.settings.misc?.showDailyNoteBadge?.desc || 'Show a badge on Journal/Calendar buttons indicating incomplete tasks in today\'s Daily Note.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showDailyNoteBadge)
				.onChange(async (value) => {
					this.plugin.settings.showDailyNoteBadge = value;
					await this.plugin.saveSettings();
					this.plugin.refreshOpenSynapticViews();
				}));
	}

	private renderQuickAccessFiles(containerEl: HTMLElement) {
		const translations = t();
		const filesContainer = containerEl.createDiv({ cls: 'synaptic-quick-access-files' });

		if (this.plugin.settings.quickAccessFiles.length === 0) {
			const emptyState = filesContainer.createDiv({ cls: 'synaptic-empty-items' });
			emptyState.createDiv({
				cls: 'synaptic-empty-items-title',
				text: translations.settings.emptyState.noItems
			});
			emptyState.createDiv({
				cls: 'synaptic-empty-items-desc',
				text: translations.settings.emptyState.addFirstItem
			});
			return;
		}

		this.plugin.settings.quickAccessFiles.forEach((file, index) => {
			this.renderFileItemInline(filesContainer, file, index);
		});
	}

	private renderFileItemInline(container: HTMLElement, file: QuickAccessFile, index: number) {
		const translations = t();
		const setting = new Setting(container);
		setting.settingEl.addClass('synaptic-file-item-inline');
		setting.setName(`${index + 1}`);

		setting.addDropdown(dropdown => {
			dropdown
				.addOption('file', translations.settings.fileType.file)
				.addOption('web', translations.settings.fileType.web);

			const isJournalActive = isJournalAvailable();
			if (isJournalActive) {
				dropdown.addOption('journal', translations.settings.fileType.journal);
			}

			const isCalendarActive = isCalendarFeatureAvailable(this.app);
			if (isCalendarActive) {
				dropdown.addOption('calendar', translations.settings.fileType.calendar);
			}

			dropdown
				.setValue(file.type)
				.onChange(async (value) => {
					const preferredDefaultFileId = this.getCurrentDefaultFileId();

					if (value === 'journal' && !isJournalActive) {
						dropdown.setValue(file.type);
						return;
					}

					if (value === 'calendar' && !isCalendarActive) {
						dropdown.setValue(file.type);
						return;
					}

					file.type = value as 'file' | 'web' | 'calendar' | 'journal';

					if (value === 'journal') {
						file.granularity = undefined;
						file.filePath = '';
						file.icon = '';
					}

					if (value === 'calendar') {
						file.filePath = '';
						file.icon = 'calendar-days';
					}

					if (value === 'web') {
						file.icon = 'globe';
					}

					file.enabled = false;
					await this.persistQuickAccessChanges(true, preferredDefaultFileId);
				});

			dropdown.selectEl.addClass('synaptic-type-dropdown');

			if (file.type === 'journal' && !isJournalActive) {
				dropdown.selectEl.addClass('synaptic-type-warning');
				dropdown.selectEl.title = '⚠️ Daily Notes 또는 Periodic Notes 플러그인을 활성화하세요';
			}
		});

		setting.addButton(button => {
			if (index > 0) {
				button
					.setIcon('arrow-up')
					.setTooltip(translations.settings.moveUp)
					.onClick(async () => {
						const preferredDefaultFileId = this.getCurrentDefaultFileId();
						const temp = this.plugin.settings.quickAccessFiles[index];
						this.plugin.settings.quickAccessFiles[index] = this.plugin.settings.quickAccessFiles[index - 1];
						this.plugin.settings.quickAccessFiles[index - 1] = temp;
						await this.persistQuickAccessChanges(true, preferredDefaultFileId);
					});
			} else {
				button.buttonEl.addClass('synaptic-button--hidden');
			}
		});

		setting.addButton(button => {
			if (index < this.plugin.settings.quickAccessFiles.length - 1) {
				button
					.setIcon('arrow-down')
					.setTooltip(translations.settings.moveDown)
					.onClick(async () => {
						const preferredDefaultFileId = this.getCurrentDefaultFileId();
						const temp = this.plugin.settings.quickAccessFiles[index];
						this.plugin.settings.quickAccessFiles[index] = this.plugin.settings.quickAccessFiles[index + 1];
						this.plugin.settings.quickAccessFiles[index + 1] = temp;
						await this.persistQuickAccessChanges(true, preferredDefaultFileId);
					});
			} else {
				button.buttonEl.addClass('synaptic-button--hidden');
			}
		});

		const shouldShowIconButton = !(file.type === 'journal' && !file.icon);
		if (shouldShowIconButton) {
			setting.addButton(button => {
				button.buttonEl.addClass('synaptic-icon-button');

				if (file.icon) {
					setIcon(button.buttonEl, file.icon);
				}

				button.onClick(() => {
					new IconPickerModal(
						this.app,
						this.plugin.settings,
						() => this.plugin.saveSettings(),
						async (selectedIcon) => {
							const preferredDefaultFileId = this.getCurrentDefaultFileId();
							file.icon = selectedIcon;
							await this.persistQuickAccessChanges(true, preferredDefaultFileId);
						}
					).open();
				});
			});
		} else {
			setting.addButton(button => {
				button.buttonEl.addClass('synaptic-button--hidden');
			});
		}

		const pathWrapper = createDiv({ cls: 'synaptic-file-path-wrapper' });
		setting.controlEl.appendChild(pathWrapper);

		if (file.type === 'journal') {
			const availableGranularities = getAvailableGranularities();
			const granularitySelect = pathWrapper.createEl('select', {
				cls: 'dropdown synaptic-granularity-dropdown'
			});

			const placeholderOption = granularitySelect.createEl('option', {
				value: '',
				text: translations.settings.placeholder.selectNoteType
			});
			placeholderOption.disabled = true;
			placeholderOption.selected = true;

			if (availableGranularities.length > 1) {
				granularitySelect.createEl('option', {
					value: 'all',
					text: translations.settings.granularity.all
				});
			}

			const granularityLabels: Record<JournalGranularity, string> = {
				'all': translations.settings.granularity.all,
				'day': translations.settings.granularity.day,
				'week': translations.settings.granularity.week,
				'month': translations.settings.granularity.month,
				'quarter': translations.settings.granularity.quarter,
				'year': translations.settings.granularity.year
			};

			availableGranularities.forEach(granularity => {
				granularitySelect.createEl('option', {
					value: granularity,
					text: granularityLabels[granularity]
				});
			});

			if (file.granularity && (file.granularity === 'all' || availableGranularities.includes(file.granularity))) {
				granularitySelect.value = file.granularity;
			} else {
				granularitySelect.value = '';
				file.granularity = undefined;
			}

			granularitySelect.addEventListener('change', async () => {
				const preferredDefaultFileId = this.getCurrentDefaultFileId();
				file.granularity = granularitySelect.value as JournalGranularity;
				file.icon = this.getJournalIcon(file.granularity);
				file.enabled = false;
				await this.persistQuickAccessChanges(true, preferredDefaultFileId);
			});

			file.filePath = '';
		} else if (file.type === 'calendar') {
			const textInput = pathWrapper.createEl('input', {
				type: 'text',
				placeholder: translations.settings.placeholder.noConfig,
				value: '',
				cls: 'synaptic-file-path-input'
			});
			textInput.disabled = true;
			textInput.addClass('synaptic-input--disabled');
			file.filePath = '';
		} else {
			let placeholder = translations.settings.placeholder.filePath;
			if (file.type === 'web') {
				placeholder = translations.settings.placeholder.webUrl;
			}

			const textInput = pathWrapper.createEl('input', {
				type: 'text',
				placeholder: placeholder,
				value: file.filePath,
				cls: 'synaptic-file-path-input'
			});

			if (file.type === 'file') {
				new FilePathSuggest(
					this.app,
					textInput,
					async (filePath) => {
						const preferredDefaultFileId = this.getCurrentDefaultFileId();
						file.filePath = normalizePath(filePath);
						file.enabled = false;
						await this.persistQuickAccessChanges(true, preferredDefaultFileId);
					}
				);
			} else if (file.type === 'web') {
				textInput.addEventListener('blur', async () => {
					const newValue = textInput.value;
					if (newValue === file.filePath) {
						return;
					}

					const preferredDefaultFileId = this.getCurrentDefaultFileId();
					file.filePath = newValue;
					file.enabled = false;
					await this.persistQuickAccessChanges(true, preferredDefaultFileId);
				});
			}
		}

		setting.addToggle(toggle => {
			toggle
				.setValue(file.enabled)
				.onChange(async (value) => {
					const preferredDefaultFileId = this.getCurrentDefaultFileId();

					if (value && !this.isBasicSetupComplete(file)) {
						let message = '';
						if (file.type === 'journal') {
							message = translations.settings.notices.selectNoteType;
						} else if (file.type === 'file') {
							message = translations.settings.notices.enterFilePath;
						} else if (file.type === 'web') {
							message = translations.settings.notices.enterUrl;
						}

						if (message) {
							new Notice(message);
							toggle.setValue(false);
							return;
						}
					}

					file.enabled = value;
					await this.persistQuickAccessChanges(true, preferredDefaultFileId);
				});
		});

		setting.addButton(button => button
			.setIcon('trash')
			.setWarning()
			.setTooltip(translations.settings.delete)
			.onClick(async () => {
				const preferredDefaultFileId = this.getCurrentDefaultFileId();
				this.plugin.settings.quickAccessFiles.splice(index, 1);
				await this.persistQuickAccessChanges(true, preferredDefaultFileId);
			}));
	}

	private async addQuickAccessFile() {
		const preferredDefaultFileId = this.getCurrentDefaultFileId();
		const newFile: QuickAccessFile = {
			id: this.generateId(),
			type: 'file',
			filePath: '',
			icon: 'file-text',
			enabled: false
		};

		this.plugin.settings.quickAccessFiles.push(newFile);
		await this.persistQuickAccessChanges(true, preferredDefaultFileId);
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}
}
