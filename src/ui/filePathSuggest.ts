import { App, TFile, AbstractInputSuggest } from 'obsidian';

export class FilePathSuggest extends AbstractInputSuggest<TFile> {
	private onSelectCallback: (filePath: string) => void;
	private textInputEl: HTMLInputElement;

	constructor(
		app: App,
		inputEl: HTMLInputElement,
		onSelectCallback: (filePath: string) => void
	) {
		super(app, inputEl);
		this.textInputEl = inputEl;
		this.onSelectCallback = onSelectCallback;
	}

	getSuggestions(query: string): TFile[] {
		if (query.length === 0) {
			return [];
		}

		const lowerQuery = query.toLowerCase();

		// 마크다운과 canvas 파일 모두 포함
		const allFiles = this.app.vault.getFiles();
		const files = allFiles.filter(f =>
			f.extension === 'md' || f.extension === 'canvas'
		);

		return files.filter(f =>
			f.path.toLowerCase().includes(lowerQuery) ||
			f.basename.toLowerCase().includes(lowerQuery)
		).slice(0, 10);
	}

	renderSuggestion(file: TFile, el: HTMLElement): void {
		el.setText(file.path);
	}

	selectSuggestion(file: TFile): void {
		this.textInputEl.value = file.path;
		this.onSelectCallback(file.path);
		this.close();
	}
}
