import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import SynapticViewPlugin from '../main';
import { QuickAccessFile } from './settings';
import { IconPickerModal } from './ui/iconPickerModal';
import { FilePathSuggest } from './ui/filePathSuggest';

export class SynapticViewSettingTab extends PluginSettingTab {
	plugin: SynapticViewPlugin;

	constructor(app: App, plugin: SynapticViewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
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
			dropdown
				.addOption('file', 'File')
				.addOption('web', 'Web')
				.addOption('calendar', 'Calendar (TBD)')
				.setValue(file.type)
				.onChange(async (value) => {
					if (value === 'calendar') {
						// 아직 구현되지 않은 기능
						dropdown.setValue(file.type);
						return;
					}
					file.type = value as 'file' | 'web' | 'calendar';
					await this.plugin.saveSettings();
					// 타입 변경시 화면 다시 그리기 (자동완성 드롭다운 표시/숨김 처리)
					this.display();
				});
			
			dropdown.selectEl.addClass('synaptic-type-dropdown');
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

		// 아이콘 버튼
		setting.addButton(button => {
			button.buttonEl.addClass('synaptic-icon-button');
			setIcon(button.buttonEl, file.icon);
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

		// 파일 경로/URL 입력 (wrapper로 감싸서 position relative 적용)
		const pathWrapper = createDiv({ cls: 'synaptic-file-path-wrapper' });
		setting.controlEl.appendChild(pathWrapper);
		
		// Type에 따라 placeholder 변경
		const placeholder = file.type === 'web' ? 'URL 입력 (https://...)' : '파일 경로';
		
		const textInput = pathWrapper.createEl('input', {
			type: 'text',
			placeholder: placeholder,
			value: file.filePath,
			cls: 'synaptic-file-path-input'
		});

		// File 타입일 때만 자동완성 드롭다운 제공
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
