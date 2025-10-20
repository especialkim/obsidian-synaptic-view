import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import SynapticViewPlugin from '../main';
import { QuickAccessFile, JournalGranularity } from './settings';
import { IconPickerModal } from './ui/iconPickerModal';
import { FilePathSuggest } from './ui/filePathSuggest';
import { isJournalAvailable, getAvailableGranularities } from './utils/pluginChecker';

export class SynapticViewSettingTab extends PluginSettingTab {
	plugin: SynapticViewPlugin;

	constructor(app: App, plugin: SynapticViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	/**
	 * Journal Granularity에 맞는 Lucide 아이콘 이름 반환
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

		// New Tab View 변경 섹션
		containerEl.createEl('h2', { text: 'New Tab View 변경' });
		
		// 전체 기능 ON/OFF 토글
		new Setting(containerEl)
			.setName('Quick Access 활성화')
			.setDesc('여러 파일을 등록하고 New Tab 화면에서 버튼으로 빠르게 접근하세요.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableQuickAccess)
				.onChange(async (value) => {
					this.plugin.settings.enableQuickAccess = value;
					await this.plugin.saveSettings();
					this.display();
					this.plugin.customizeEmptyState();
				}));

		// ON일 때만 파일 리스트 표시
		if (this.plugin.settings.enableQuickAccess) {
			// 파일 리스트 렌더링
			this.renderQuickAccessFiles(containerEl);

			// [+ 추가] 버튼
			new Setting(containerEl)
				.addButton(button => button
					.setButtonText('+ 파일 추가')
					.setCta()
					.onClick(async () => {
						this.addQuickAccessFile();
					}));

			// 스타일 설정 섹션
			this.renderViewStyleSettings(containerEl);
		}
	}

	private renderViewStyleSettings(containerEl: HTMLElement) {
		containerEl.createEl('h2', { text: 'View 스타일 설정' });
		
		// 안내 문구
		const noticeEl = containerEl.createDiv({ cls: 'setting-item-description' });
		noticeEl.setText('⚠️ 아래 설정은 미리보기(Preview) 모드에서만 적용됩니다.');
		noticeEl.style.marginBottom = '1rem';
		noticeEl.style.color = 'var(--text-muted)';
		noticeEl.style.fontStyle = 'italic';

		// 인라인 타이틀 숨김 옵션
		new Setting(containerEl)
			.setName('인라인 타이틀 숨김')
			.setDesc('문서 상단의 인라인 타이틀을 숨깁니다. (대시보드 스타일에 적합)')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideInlineTitle)
				.onChange(async (value) => {
					this.plugin.settings.hideInlineTitle = value;
					await this.plugin.saveSettings();
					this.plugin.customizeEmptyState();
				}));

		// Embedded Mentions 숨김 옵션
		new Setting(containerEl)
			.setName('Embedded Mentions 숨김')
			.setDesc('문서 하단의 임베디드 백링크 및 언급을 숨깁니다.')
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
		
		// Calendar 옵션 추가
		dropdown.addOption('calendar', 'Calendar');
		
		dropdown
			.setValue(file.type)
			.onChange(async (value) => {
				
				if (value === 'journal' && !isJournalActive) {
					// Journal 기능이 비활성화되어 있으면 경고
					dropdown.setValue(file.type);
					return;
				}
				
				file.type = value as 'file' | 'web' | 'calendar' | 'journal';
				
			// Journal 타입으로 변경 시 기본값 설정
			if (value === 'journal') {
				const availableGranularities = getAvailableGranularities();
				// Granularity는 초기화 (사용자가 직접 선택하도록)
				file.granularity = undefined;
				file.filePath = ''; // Journal은 filePath 사용 안 함
				// 아이콘은 비워둠 (Granularity 선택 시 자동 설정)
				file.icon = '';
			}
			
			// Calendar 타입으로 변경 시 기본값 설정
			if (value === 'calendar') {
				file.filePath = ''; // Calendar는 filePath 사용 안 함
				file.icon = 'calendar-days'; // Calendar 기본 아이콘 설정
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

		// 위로 버튼 (항상 공간 차지, 첫번째는 비활성화)
		setting.addButton(button => {
			if (index > 0) {
				button
					.setIcon('arrow-up')
					.setTooltip('위로')
					.onClick(async () => {
						const temp = this.plugin.settings.quickAccessFiles[index];
						this.plugin.settings.quickAccessFiles[index] = this.plugin.settings.quickAccessFiles[index - 1];
						this.plugin.settings.quickAccessFiles[index - 1] = temp;
						await this.plugin.saveSettings();
						this.display();
						this.plugin.customizeEmptyState();
					});
			} else {
				// 첫 번째 항목: 버튼은 있지만 투명하게
				button.buttonEl.style.visibility = 'hidden';
			}
		});

		// 아래로 버튼 (항상 공간 차지, 마지막은 비활성화)
		setting.addButton(button => {
			if (index < this.plugin.settings.quickAccessFiles.length - 1) {
				button
					.setIcon('arrow-down')
					.setTooltip('아래로')
					.onClick(async () => {
						const temp = this.plugin.settings.quickAccessFiles[index];
						this.plugin.settings.quickAccessFiles[index] = this.plugin.settings.quickAccessFiles[index + 1];
						this.plugin.settings.quickAccessFiles[index + 1] = temp;
						await this.plugin.saveSettings();
						this.display();
						this.plugin.customizeEmptyState();
					});
			} else {
				// 마지막 항목: 버튼은 있지만 투명하게
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

	// 파일 경로/URL 입력 또는 Granularity 선택 (wrapper로 감싸서 position relative 적용)
	const pathWrapper = createDiv({ cls: 'synaptic-file-path-wrapper' });
	setting.controlEl.appendChild(pathWrapper);
	
	// Journal 타입일 때는 Granularity 드롭다운 표시
	if (file.type === 'journal') {
		const availableGranularities = getAvailableGranularities();
		
	// Granularity 드롭다운을 select 요소로 추가
	const granularitySelect = pathWrapper.createEl('select', {
		cls: 'dropdown synaptic-granularity-dropdown'
	});
	
	// 기본 placeholder 옵션 추가
	const placeholderOption = granularitySelect.createEl('option', {
		value: '',
		text: '선택하세요...'
	});
	placeholderOption.disabled = true;
	placeholderOption.selected = true;
	
	// "All" 옵션 추가 (모든 granularity 사용 가능할 때만)
	if (availableGranularities.length > 1) {
		const allOption = granularitySelect.createEl('option', {
			value: 'all',
			text: 'All'
		});
	}
		
	// Granularity 옵션들 추가
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
		
	// 변경 이벤트 - Granularity 선택 시 디폴트 아이콘 자동 설정
	granularitySelect.addEventListener('change', async () => {
		file.granularity = granularitySelect.value as JournalGranularity;
		file.icon = this.getJournalIcon(file.granularity); // Granularity에 맞는 아이콘 설정
		await this.plugin.saveSettings();
		this.display(); // 아이콘 업데이트를 위해 화면 다시 그리기
		this.plugin.customizeEmptyState();
	});
		
		// filePath는 비워둠 (런타임에 계산됨)
		file.filePath = '';
	} else if (file.type === 'calendar') {
		// Calendar 타입일 때는 비활성화된 입력창 표시
		const textInput = pathWrapper.createEl('input', {
			type: 'text',
			placeholder: 'Calendar 기능 (구현 예정)',
			value: '',
			cls: 'synaptic-file-path-input'
		});
		textInput.disabled = true;
		textInput.style.opacity = '0.5';
		textInput.style.cursor = 'not-allowed';
		
		// filePath는 비워둠 (Calendar는 filePath 사용 안 함)
		file.filePath = '';
	} else {
		// File/Web 타입일 때는 기존 로직
		let placeholder = '파일 경로';
		if (file.type === 'web') {
			placeholder = 'URL 입력 (https://...)';
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
				}
			);
		} else if (file.type === 'web') {
			// Web 타입일 때는 일반 input 이벤트로 처리
			textInput.addEventListener('blur', async () => {
				file.filePath = textInput.value;
				await this.plugin.saveSettings();
			});
		}
	}

		// ON/OFF 토글
		setting.addToggle(toggle => toggle
			.setValue(file.enabled)
			.onChange(async (value) => {
				file.enabled = value;
				await this.plugin.saveSettings();
				this.plugin.customizeEmptyState();
			}));

		// 삭제 버튼
		setting.addButton(button => button
			.setIcon('trash')
			.setWarning()
			.setTooltip('삭제')
			.onClick(async () => {
				this.plugin.settings.quickAccessFiles.splice(index, 1);
				await this.plugin.saveSettings();
				this.display();
				this.plugin.customizeEmptyState();
			}));
	}

	private async addQuickAccessFile() {
		const newFile: QuickAccessFile = {
			id: this.generateId(),
			type: 'file',
			filePath: '',
			icon: 'file-text',
			enabled: false // 기본값 OFF
		};

		this.plugin.settings.quickAccessFiles.push(newFile);
		await this.plugin.saveSettings();
		this.display();
	}

	private generateId(): string {
		return Date.now().toString(36) + Math.random().toString(36).substr(2);
	}
}
