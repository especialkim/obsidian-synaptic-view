import { App, TFile } from 'obsidian';

export class FilePathSuggest {
	private app: App;
	private inputEl: HTMLInputElement;
	private suggestionsEl: HTMLElement;
	private selectedIndex: number = 0;
	private matchedFiles: TFile[] = [];
	private onSelect: (filePath: string) => void;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		suggestionsEl: HTMLElement,
		onSelect: (filePath: string) => void
	) {
		this.app = app;
		this.inputEl = inputEl;
		this.suggestionsEl = suggestionsEl;
		this.onSelect = onSelect;

		this.setupEventListeners();
	}

	private setupEventListeners() {
		// 입력 이벤트
		this.inputEl.addEventListener('input', () => {
			this.updateSuggestions();
		});

		// 키보드 이벤트
		this.inputEl.addEventListener('keydown', (e) => {
			this.handleKeyDown(e);
		});

		// 포커스 아웃 (지연 후 닫기)
		this.inputEl.addEventListener('blur', () => {
			setTimeout(() => this.hideSuggestions(), 200);
		});
	}

	private updateSuggestions() {
		const query = this.inputEl.value.toLowerCase();

		if (query.length === 0) {
			this.hideSuggestions();
			return;
		}

		// 마크다운과 canvas 파일 모두 포함
		const allFiles = this.app.vault.getFiles();
		const files = allFiles.filter(f => 
			f.extension === 'md' || f.extension === 'canvas'
		);
		
		this.matchedFiles = files.filter(f =>
			f.path.toLowerCase().includes(query) ||
			f.basename.toLowerCase().includes(query)
		).slice(0, 10);

		if (this.matchedFiles.length > 0) {
			this.selectedIndex = 0; // 첫 번째 항목 선택
			this.renderSuggestions();
			this.showSuggestions();
		} else {
			this.hideSuggestions();
		}
	}

	private renderSuggestions() {
		this.suggestionsEl.empty();

		this.matchedFiles.forEach((file, index) => {
			const item = this.suggestionsEl.createDiv({ cls: 'suggestion-item' });
			item.setText(file.path);

			// 선택된 항목 표시
			if (index === this.selectedIndex) {
				item.addClass('is-selected');
			}

			// 클릭 이벤트
			item.addEventListener('click', () => {
				this.selectFile(file.path);
			});
		});
	}

	private handleKeyDown(e: KeyboardEvent) {
		const isVisible = this.suggestionsEl.classList.contains('is-visible');

		if (!isVisible) {
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				this.selectedIndex = Math.min(
					this.selectedIndex + 1,
					this.matchedFiles.length - 1
				);
				this.renderSuggestions();
				break;

			case 'ArrowUp':
				e.preventDefault();
				this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
				this.renderSuggestions();
				break;

			case 'Tab':
				e.preventDefault();
				if (this.matchedFiles.length > 0) {
					this.selectFile(this.matchedFiles[this.selectedIndex].path);
				}
				break;

			case 'Enter':
				e.preventDefault();
				if (this.matchedFiles.length > 0) {
					this.selectFile(this.matchedFiles[this.selectedIndex].path);
				}
				break;

			case 'Escape':
				e.preventDefault();
				this.hideSuggestions();
				break;
		}
	}

	private selectFile(filePath: string) {
		this.inputEl.value = filePath;
		this.onSelect(filePath);
		this.hideSuggestions();
	}

	private showSuggestions() {
		this.suggestionsEl.classList.add('is-visible');
	}

	private hideSuggestions() {
		this.suggestionsEl.classList.remove('is-visible');
		this.selectedIndex = 0;
	}
}

