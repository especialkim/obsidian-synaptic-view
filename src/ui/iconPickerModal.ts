import { App, Modal, setIcon, setTooltip, getIconIds } from 'obsidian';
import { SynapticViewSettings } from '../settings';

export class IconPickerModal extends Modal {
	private onSelect: (icon: string) => void;
	private searchInput: HTMLInputElement;
	private settings: SynapticViewSettings;
	private saveSettings: () => Promise<void>;
	private allIcons: string[]; // 아이콘 목록 캐싱
	private searchDebounceTimer: number = 0; // Debounce 타이머

	constructor(
		app: App, 
		settings: SynapticViewSettings,
		saveSettings: () => Promise<void>,
		onSelect: (icon: string) => void
	) {
		super(app);
		this.settings = settings;
		this.saveSettings = saveSettings;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		
		contentEl.empty();
		contentEl.addClass('synaptic-icon-picker-modal');

		// 아이콘 목록 캐싱 (한 번만 호출)
		this.allIcons = getIconIds();

		// 제목
		contentEl.createEl('h2', { text: 'Select icon' });

		// 검색 입력
		const searchContainer = contentEl.createDiv({ cls: 'synaptic-icon-search' });
		this.searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Search icon name... (e.g., star, heart, book)',
			cls: 'synaptic-icon-search-input'
		});

		// 최근 사용 아이콘 섹션 (최대 20개)
		if (this.settings.recentIcons.length > 0) {
			contentEl.createEl('h3', { text: 'Recent', cls: 'synaptic-icon-section-title' });
			const recentGrid = contentEl.createDiv({ cls: 'synaptic-icons-grid synaptic-recent-icons' });
			this.renderIcons(recentGrid, this.settings.recentIcons);
		}

		// 모든 아이콘 그리드
		contentEl.createEl('h3', { text: 'All icons', cls: 'synaptic-icon-section-title' });
		const allIconsGrid = contentEl.createDiv({ cls: 'synaptic-icons-grid synaptic-all-icons' });
		this.renderIcons(allIconsGrid, this.allIcons);


		// 검색 이벤트 (Debouncing 적용)
		this.searchInput.addEventListener('input', () => {
			// 이전 타이머 취소
			if (this.searchDebounceTimer) {
				window.clearTimeout(this.searchDebounceTimer);
			}
			
			// 새 타이머 설정 (150ms 후 실행)
			this.searchDebounceTimer = window.setTimeout(() => {
				const query = this.searchInput.value.toLowerCase().trim();
				
				if (query.length === 0) {
					// 검색어 없을 때 기본 화면
					if (this.settings.recentIcons.length > 0) {
						contentEl.querySelector('.synaptic-recent-icons')?.removeClass('synaptic-hidden');
						contentEl.querySelectorAll('.synaptic-icon-section-title')[0]?.removeClass('synaptic-hidden');
					}
					allIconsGrid.removeClass('synaptic-hidden');
					contentEl.querySelectorAll('.synaptic-icon-section-title')[1]?.removeClass('synaptic-hidden');
					contentEl.querySelectorAll('.synaptic-icon-section-title')[1]?.setText('All icons');
				} else {
					// 검색 중
					if (this.settings.recentIcons.length > 0) {
						contentEl.querySelector('.synaptic-recent-icons')?.addClass('synaptic-hidden');
						contentEl.querySelectorAll('.synaptic-icon-section-title')[0]?.addClass('synaptic-hidden');
					}
					contentEl.querySelectorAll('.synaptic-icon-section-title')[1]?.setText('Search results');
					
					// 캐싱된 목록에서 필터링
					const filtered = this.allIcons.filter(icon => 
						icon.toLowerCase().includes(query)
					);
					
					this.renderIcons(allIconsGrid, filtered, query);
				}
			}, 150); // 150ms 딜레이
		});

		// Enter 키로 커스텀 아이콘 사용
		this.searchInput.addEventListener('keydown', async (e) => {
			if (e.key === 'Enter') {
				const iconName = this.searchInput.value.trim();
				if (iconName) {
					await this.addToRecentIcons(iconName);
					this.onSelect(iconName);
					this.close();
				}
			}
		});

		// 포커스
		this.searchInput.focus();
	}

	private renderIcons(container: HTMLElement, icons: string[], query?: string) {
		container.empty();

		if (icons.length === 0) {
			const noResults = container.createDiv({ cls: 'synaptic-no-results' });
			noResults.createEl('p', { text: 'No search results found.' });
			if (query) {
				noResults.createEl('p', { 
					text: `No icons matching "${query}" found.`,
					cls: 'synaptic-no-results-query'
				});
			}
			return;
		}

		icons.forEach(iconName => {
			this.createIconButton(container, iconName);
		});
	}

	private createIconButton(container: HTMLElement, iconName: string) {
		const iconButton = container.createDiv({ cls: 'synaptic-icon-item' });
		
		const iconEl = iconButton.createDiv({ cls: 'synaptic-icon-preview' });
		setIcon(iconEl, iconName);
		
		// Obsidian의 setTooltip API 사용
		setTooltip(iconButton, iconName, {
			delay: 100 // 100ms 딜레이로 빠르게 표시
		});
		
		iconButton.addEventListener('click', async () => {
			// 최근 사용 아이콘에 추가
			await this.addToRecentIcons(iconName);
			this.onSelect(iconName);
			this.close();
		});
	}

	private async addToRecentIcons(iconName: string) {
		// 이미 있으면 제거
		const filtered = this.settings.recentIcons.filter(i => i !== iconName);
		// 맨 앞에 추가
		this.settings.recentIcons = [iconName, ...filtered].slice(0, 20); // 최대 20개
		await this.saveSettings();
	}

	onClose() {
		const { contentEl } = this;
		
		// 타이머 정리
		if (this.searchDebounceTimer) {
			window.clearTimeout(this.searchDebounceTimer);
		}
		
		contentEl.empty();
	}
}
