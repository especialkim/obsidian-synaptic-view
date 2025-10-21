import { App, PluginSettingTab, Setting, setIcon, DropdownComponent } from 'obsidian';
import SynapticViewPlugin from '../main';
import { QuickAccessFile, JournalGranularity } from './settings';
import { IconPickerModal } from './ui/iconPickerModal';
import { FilePathSuggest } from './ui/filePathSuggest';
import { isJournalAvailable, getAvailableGranularities, isCalendarFeatureAvailable } from './utils/pluginChecker';

export class SynapticViewSettingTab extends PluginSettingTab {
	plugin: SynapticViewPlugin;

	constructor(app: App, plugin: SynapticViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Journal note type에 맞는 Lucide 아이콘 이름 반환
	 */
	private getJournalIcon(granularity?: JournalGranularity): string {
		const iconMap: Record<JournalGranularity, string> = {
			'all': 'calendar-fold',
			'day': 'calendar-day',
			'week': 'calendar-week',
			'month': 'calendar-month',
			'quarter': 'calendar-quarter',
			'year': 'calendar-year'
		};
		
		return iconMap[granularity || 'day'];
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// === Synaptic View Settings ===
		containerEl.createEl('h2', { text: 'Synaptic View' });
		
		// Replace New Tab toggle
		new Setting(containerEl)
			.setName('Replace New Tab with Synaptic View')
			.setDesc('When enabled, clicking the New Tab button opens Synaptic View instead of the default empty state.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.replaceNewTabWithSynapticView)
				.onChange(async (value) => {
					this.plugin.settings.replaceNewTabWithSynapticView = value;
					await this.plugin.saveSettings();
					this.plugin.customizeEmptyState();
				}));

		// (Default view selection moved below Quick Access items per new structure)

		// === Quick Access Items ===
		containerEl.createEl('h2', { text: 'Quick Access Items' });
		
		// Item list
		this.renderQuickAccessFiles(containerEl);

		// Add button (simple "+")
		new Setting(containerEl)
			.addButton(button => button
				.setButtonText('+')
				.setTooltip('Add new item')
				.setCta()
				.onClick(async () => {
					this.addQuickAccessFile();
				}));

		// Default view selection (moved here)
		const enabledFilesForDefault = this.plugin.settings.quickAccessFiles.filter(f => f.enabled);
		if (enabledFilesForDefault.length > 0) {
			containerEl.createEl('h2', { text: 'Default View' });
			new Setting(containerEl)
				.setName('Default item to open')
				.setDesc('Choose which Quick Access item opens by default in Synaptic View.')
				.addDropdown(dropdown => {
					this.updateDefaultViewDropdown(dropdown, enabledFilesForDefault);
					
					dropdown
						.setValue(this.plugin.settings.defaultViewIndex.toString())
						.onChange(async (value) => {
							this.plugin.settings.defaultViewIndex = parseInt(value);
							await this.plugin.saveSettings();
						});
				});
		}

		// === View Style Settings ===
		this.renderViewStyleSettings(containerEl);
	}
	
	/**
	 * Update Default view dropdown options
	 */
	private updateDefaultViewDropdown(dropdown: DropdownComponent, enabledFiles: QuickAccessFile[]) {
		// Clear existing options
		dropdown.selectEl.empty();
		
		// Add new options
		enabledFiles.forEach((file, index) => {
			const optionIndex = (index + 1).toString();
			let label = this.getFileLabel(file, index + 1);
			
			// Journal "All"과 Calendar는 submenu이므로 선택 불가
			const isSubmenu = (file.type === 'journal' && file.granularity === 'all') || file.type === 'calendar';
			
			if (isSubmenu) {
				label += ' (submenu - not selectable)';
			}
			
			const option = dropdown.addOption(optionIndex, label);
			
			// submenu 항목은 비활성화
			if (isSubmenu) {
				const optionEl = dropdown.selectEl.querySelector(`option[value="${optionIndex}"]`) as HTMLOptionElement;
				if (optionEl) {
					optionEl.disabled = true;
				}
			}
		});
		
		// Ensure current value is valid (submenu가 아닌 항목으로)
		const currentValue = this.plugin.settings.defaultViewIndex.toString();
		const currentFile = enabledFiles[this.plugin.settings.defaultViewIndex - 1];
		const isCurrentSubmenu = currentFile && ((currentFile.type === 'journal' && currentFile.granularity === 'all') || currentFile.type === 'calendar');
		
		if (enabledFiles.length > 0 && currentFile && !isCurrentSubmenu) {
			dropdown.setValue(currentValue);
		} else if (enabledFiles.length > 0) {
			// 유효하지 않거나 submenu이면 첫 번째 selectable 항목으로 설정
			for (let i = 0; i < enabledFiles.length; i++) {
				const file = enabledFiles[i];
				const isSubmenu = (file.type === 'journal' && file.granularity === 'all') || file.type === 'calendar';
				if (!isSubmenu) {
					this.plugin.settings.defaultViewIndex = i + 1;
					dropdown.setValue((i + 1).toString());
					break;
				}
			}
		}
	}

	/**
	 * Get label for Quick Access file
	 */
	private getFileLabel(file: QuickAccessFile, index: number): string {
		if (file.type === 'journal' && file.granularity) {
			const granularityLabels: Record<JournalGranularity, string> = {
				'all': 'Journal (All)',
				'day': 'Journal (Daily)',
				'week': 'Journal (Weekly)',
				'month': 'Journal (Monthly)',
				'quarter': 'Journal (Quarterly)',
				'year': 'Journal (Yearly)'
			};
			return `${index}. ${granularityLabels[file.granularity]}`;
		} else if (file.type === 'calendar') {
			return `${index}. Calendar`;
		} else if (file.type === 'web') {
			const url = 'Web: ' + file.filePath || 'No URL';
			return `${index}. ${url}`;
		} else {
			const fileName = 'File: ' + file.filePath.split('/').pop() || file.filePath;
			return `${index}. ${fileName}`;
		}
	}

	private renderViewStyleSettings(containerEl: HTMLElement) {
		containerEl.createEl('h2', { text: 'View Style' });
		
		// Notice
		const noticeEl = containerEl.createDiv({ cls: 'setting-item-description' });
		noticeEl.setText('⚠️ These settings apply only in Preview mode.');
		noticeEl.style.marginBottom = '1rem';
		noticeEl.style.color = 'var(--text-muted)';
		noticeEl.style.fontStyle = 'italic';

		// Hide inline title option
		new Setting(containerEl)
			.setName('Hide inline title')
			.setDesc('Hide the inline title at the top of the document (suitable for dashboard-style views).')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideInlineTitle)
				.onChange(async (value) => {
					this.plugin.settings.hideInlineTitle = value;
					await this.plugin.saveSettings();
					this.plugin.customizeEmptyState();
				}));

		// Hide embedded mentions option
		new Setting(containerEl)
			.setName('Hide embedded mentions')
			.setDesc('Hide embedded backlinks and mentions at the bottom of the document.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideEmbeddedMentions)
				.onChange(async (value) => {
					this.plugin.settings.hideEmbeddedMentions = value;
					await this.plugin.saveSettings();
					this.plugin.customizeEmptyState();
				}));
	}

	private renderQuickAccessFiles(containerEl: HTMLElement) {
		const filesContainer = containerEl.createDiv({ cls: 'synaptic-quick-access-files' });

		this.plugin.settings.quickAccessFiles.forEach((file, index) => {
			this.renderFileItemInline(filesContainer, file, index);
		});
	}

	private renderFileItemInline(container: HTMLElement, file: QuickAccessFile, index: number) {
		const setting = new Setting(container);
		setting.settingEl.addClass('synaptic-file-item-inline');
		
		// 순번 표시
		setting.setName(`${index + 1}`);

	// Type 드롭다운
	setting.addDropdown(dropdown => {
		// 기본 옵션 추가
		dropdown
			.addOption('file', 'File')
			.addOption('web', 'Web');
		
		// Journal 기능이 사용 가능하면 Journal 옵션 추가
		// (Core Daily Notes 또는 Periodic Notes 플러그인 중 하나라도 활성화)
		const isJournalActive = isJournalAvailable();
		if (isJournalActive) {
			dropdown.addOption('journal', 'Journal');
		}
		
        // Calendar 옵션은 관련 기능이 하나라도 가능할 때만 추가
        const isCalendarActive = isCalendarFeatureAvailable(this.app);
        if (isCalendarActive) {
            dropdown.addOption('calendar', 'Calendar');
        }
		
		dropdown
			.setValue(file.type)
			.onChange(async (value) => {
				
                if (value === 'journal' && !isJournalActive) {
					// Journal 기능이 비활성화되어 있으면 경고
					dropdown.setValue(file.type);
					return;
				}
                if (value === 'calendar' && !isCalendarActive) {
                    // Calendar 기능이 비활성화되어 있으면 선택 불가
                    dropdown.setValue(file.type);
                    return;
                }
				
				file.type = value as 'file' | 'web' | 'calendar' | 'journal';
				
			// Journal 타입으로 변경 시 기본값 설정
			if (value === 'journal') {
				const availableGranularities = getAvailableGranularities();
				// Note type은 초기화 (사용자가 직접 선택하도록)
				file.granularity = undefined;
				file.filePath = ''; // Journal은 filePath 사용 안 함
				// 아이콘은 비워둠 (Note type 선택 시 자동 설정)
				file.icon = '';
			}
			
			// Calendar 타입으로 변경 시 기본값 설정
			if (value === 'calendar') {
				file.filePath = ''; // Calendar는 filePath 사용 안 함
				file.icon = 'calendar-days'; // Calendar 기본 아이콘 설정
			}
			
			// Web 타입으로 변경 시 기본값 설정
			if (value === 'web') {
				file.icon = 'globe'; // Web 기본 아이콘 설정
			}
				
				await this.plugin.saveSettings();
				// 타입 변경시 화면 다시 그리기
				this.display();
			});
		
		dropdown.selectEl.addClass('synaptic-type-dropdown');
		
		// Journal 타입인데 기능이 비활성화되어 있으면 경고 표시
		if (file.type === 'journal' && !isJournalActive) {
			dropdown.selectEl.addClass('synaptic-type-warning');
			dropdown.selectEl.title = '⚠️ Daily Notes 또는 Periodic Notes 플러그인을 활성화하세요';
		}
	});

		// Move up button (always takes space, disabled for first item)
		setting.addButton(button => {
			if (index > 0) {
				button
					.setIcon('arrow-up')
					.setTooltip('Move up')
					.onClick(async () => {
						const temp = this.plugin.settings.quickAccessFiles[index];
						this.plugin.settings.quickAccessFiles[index] = this.plugin.settings.quickAccessFiles[index - 1];
						this.plugin.settings.quickAccessFiles[index - 1] = temp;
						
						// Adjust defaultViewIndex if needed
						if (this.plugin.settings.defaultViewIndex === index + 1) {
							this.plugin.settings.defaultViewIndex = index;
						} else if (this.plugin.settings.defaultViewIndex === index) {
							this.plugin.settings.defaultViewIndex = index + 1;
						}
						
						await this.plugin.saveSettings();
						this.display(); // Refresh the entire settings UI
						this.plugin.customizeEmptyState();
					});
			} else {
				// First item: button exists but invisible
				button.buttonEl.style.visibility = 'hidden';
			}
		});

		// Move down button (always takes space, disabled for last item)
		setting.addButton(button => {
			if (index < this.plugin.settings.quickAccessFiles.length - 1) {
				button
					.setIcon('arrow-down')
					.setTooltip('Move down')
					.onClick(async () => {
						const temp = this.plugin.settings.quickAccessFiles[index];
						this.plugin.settings.quickAccessFiles[index] = this.plugin.settings.quickAccessFiles[index + 1];
						this.plugin.settings.quickAccessFiles[index + 1] = temp;
						
						// Adjust defaultViewIndex if needed
						if (this.plugin.settings.defaultViewIndex === index + 1) {
							this.plugin.settings.defaultViewIndex = index + 2;
						} else if (this.plugin.settings.defaultViewIndex === index + 2) {
							this.plugin.settings.defaultViewIndex = index + 1;
						}
						
						await this.plugin.saveSettings();
						this.display(); // Refresh the entire settings UI
						this.plugin.customizeEmptyState();
					});
			} else {
				// Last item: button exists but invisible
				button.buttonEl.style.visibility = 'hidden';
			}
		});

	// 아이콘 버튼 (Journal 타입이고 아이콘이 없으면 버튼 자체를 숨김)
	const shouldShowIconButton = !(file.type === 'journal' && !file.icon);
	
	if (shouldShowIconButton) {
		setting.addButton(button => {
			button.buttonEl.addClass('synaptic-icon-button');
			
			// 아이콘이 있으면 표시
			if (file.icon) {
				setIcon(button.buttonEl, file.icon);
			}
			
			button.onClick(() => {
				new IconPickerModal(
					this.app,
					this.plugin.settings,
					() => this.plugin.saveSettings(),
					async (selectedIcon) => {
						file.icon = selectedIcon;
						await this.plugin.saveSettings();
						this.display();
						this.plugin.customizeEmptyState();
					}
				).open();
			});
		});
	} else {
		// Journal 타입이고 아이콘 없을 때: 빈 공간 유지 (레이아웃 정렬용)
		setting.addButton(button => {
			button.buttonEl.style.visibility = 'hidden';
		});
	}

	// 파일 경로/URL 입력 또는 Note type 선택 (wrapper로 감싸서 position relative 적용)
	const pathWrapper = createDiv({ cls: 'synaptic-file-path-wrapper' });
	setting.controlEl.appendChild(pathWrapper);
	
	// Journal 타입일 때는 Note type 드롭다운 표시
	if (file.type === 'journal') {
		const availableGranularities = getAvailableGranularities();
		
	// Note type 드롭다운을 select 요소로 추가
	const granularitySelect = pathWrapper.createEl('select', {
		cls: 'dropdown synaptic-granularity-dropdown'
	});
	
	// Default placeholder option
	const placeholderOption = granularitySelect.createEl('option', {
		value: '',
		text: 'Select note type...'
	});
	placeholderOption.disabled = true;
	placeholderOption.selected = true;
	
	// "All" 옵션 추가 (모든 note type 사용 가능할 때만)
	if (availableGranularities.length > 1) {
		const allOption = granularitySelect.createEl('option', {
			value: 'all',
			text: 'All'
		});
	}
	
	// Note type 옵션들 추가
	const granularityLabels: Record<JournalGranularity, string> = {
		'all': 'All',
		'day': 'Daily',
		'week': 'Weekly',
		'month': 'Monthly',
		'quarter': 'Quarterly',
		'year': 'Yearly'
	};
	
	availableGranularities.forEach(granularity => {
		const option = granularitySelect.createEl('option', {
			value: granularity,
			text: granularityLabels[granularity]
		});
	});
	
	// 현재 값 설정 (기존에 저장된 값이 있으면 설정, 없으면 placeholder 유지)
	if (file.granularity && (file.granularity === 'all' || availableGranularities.includes(file.granularity))) {
		granularitySelect.value = file.granularity;
	} else {
		// 새로운 항목이거나 유효하지 않은 값이면 placeholder 유지
		granularitySelect.value = '';
		file.granularity = undefined; // 초기화
	}
		
	// 변경 이벤트 - Note type 선택 시 디폴트 아이콘 자동 설정
	granularitySelect.addEventListener('change', async () => {
		file.granularity = granularitySelect.value as JournalGranularity;
		file.icon = this.getJournalIcon(file.granularity); // Note type에 맞는 아이콘 설정
		await this.plugin.saveSettings();
		this.display(); // 아이콘 업데이트를 위해 화면 다시 그리기
		this.plugin.customizeEmptyState();
	});
		
		// filePath는 비워둠 (런타임에 계산됨)
		file.filePath = '';
	} else if (file.type === 'calendar') {
		// Calendar type: no path input needed (calendar button displays a calendar submenu)
		const textInput = pathWrapper.createEl('input', {
			type: 'text',
			placeholder: 'No configuration needed',
			value: '',
			cls: 'synaptic-file-path-input'
		});
		textInput.disabled = true;
		textInput.style.opacity = '0.5';
		textInput.style.cursor = 'not-allowed';
		
		// filePath는 비워둠 (Calendar는 filePath 사용 안 함)
		file.filePath = '';
	} else {
		// File/Web type
		let placeholder = 'File path';
		if (file.type === 'web') {
			placeholder = 'Enter URL (https://...)';
		}
		
		const textInput = pathWrapper.createEl('input', {
			type: 'text',
			placeholder: placeholder,
			value: file.filePath,
			cls: 'synaptic-file-path-input'
		});

		// File 타입일 때 자동완성 드롭다운 제공
		if (file.type === 'file') {
			const suggestionsEl = pathWrapper.createDiv({ cls: 'synaptic-file-suggestions' });
			suggestionsEl.style.display = 'none';

			// FilePathSuggest 모듈 사용
			new FilePathSuggest(
				this.app,
				textInput,
				suggestionsEl,
				async (filePath) => {
					file.filePath = filePath;
					await this.plugin.saveSettings();
					this.display(); // Refresh the entire settings UI
				}
			);
		} else if (file.type === 'web') {
			// Web 타입일 때는 일반 input 이벤트로 처리
			textInput.addEventListener('blur', async () => {
				file.filePath = textInput.value;
				await this.plugin.saveSettings();
				this.display(); // Refresh the entire settings UI
			});
		}
	}

		// ON/OFF 토글
		setting.addToggle(toggle => toggle
			.setValue(file.enabled)
			.onChange(async (value) => {
				file.enabled = value;
				await this.plugin.saveSettings();
				
				// Adjust defaultViewIndex if needed
				const enabledFiles = this.plugin.settings.quickAccessFiles.filter(f => f.enabled);
				if (enabledFiles.length === 0) {
					this.plugin.settings.defaultViewIndex = 1;
				} else if (this.plugin.settings.defaultViewIndex > enabledFiles.length) {
					this.plugin.settings.defaultViewIndex = enabledFiles.length;
				}
				
				// Only refresh if defaultViewIndex changed
				if (enabledFiles.length > 0) {
					this.display(); // Refresh the entire settings UI
				}
				this.plugin.customizeEmptyState();
			}));

		// Delete button
		setting.addButton(button => button
			.setIcon('trash')
			.setWarning()
			.setTooltip('Delete')
			.onClick(async () => {
				this.plugin.settings.quickAccessFiles.splice(index, 1);
				
				// Adjust defaultViewIndex if needed
				if (this.plugin.settings.defaultViewIndex > this.plugin.settings.quickAccessFiles.filter(f => f.enabled).length) {
					this.plugin.settings.defaultViewIndex = Math.max(1, this.plugin.settings.quickAccessFiles.filter(f => f.enabled).length);
				}
				
				await this.plugin.saveSettings();
				this.display(); // Refresh the entire settings UI
				this.plugin.customizeEmptyState();
			}));
	}

	private async addQuickAccessFile() {
		const newFile: QuickAccessFile = {
			id: this.generateId(),
			type: 'file',
			filePath: '',
			icon: 'file-text',
			enabled: false // Default OFF
		};

		this.plugin.settings.quickAccessFiles.push(newFile);
		await this.plugin.saveSettings();
		this.display(); // Refresh the entire settings UI
		this.plugin.customizeEmptyState();
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}
}
