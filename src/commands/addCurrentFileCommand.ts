import { App, Notice, TFile, SuggestModal } from 'obsidian';
import SynapticViewPlugin from '../../main';
import { QuickAccessFile } from '../settings';

/**
 * Quick Access 삽입 위치를 선택하는 모달
 */
class QuickAccessPositionModal extends SuggestModal<{ index: number; label: string }> {
	private plugin: SynapticViewPlugin;
	private newFile: QuickAccessFile;
	private positions: { index: number; label: string }[] = [];

	constructor(plugin: SynapticViewPlugin, newFile: QuickAccessFile) {
		super(plugin.app);
		this.plugin = plugin;
		this.newFile = newFile;
		this.preparePositions();
		
		// 모달 제목 설정
		this.setPlaceholder('Select position to insert the file...');
	}

	private preparePositions() {
		const files = this.plugin.settings.quickAccessFiles;
		
		// 맨 위에 삽입
		this.positions.push({
			index: 0,
			label: '▲ Insert at top'
		});

		// 각 항목 뒤에 삽입
		files.forEach((file, index) => {
			const typeLabel = this.getTypeLabel(file);
			const nameLabel = this.getNameLabel(file);
			const statusLabel = file.enabled ? '✓' : '✗';
			
			this.positions.push({
				index: index + 1,
				label: `${index + 1}. [${statusLabel}] ${typeLabel}: ${nameLabel}`
			});
		});
	}

	private getTypeLabel(file: QuickAccessFile): string {
		if (file.type === 'file') return 'File';
		if (file.type === 'web') return 'Web';
		if (file.type === 'journal') {
			if (file.granularity === 'day') return 'Journal Daily';
			if (file.granularity === 'week') return 'Journal Weekly';
			if (file.granularity === 'month') return 'Journal Monthly';
			if (file.granularity === 'quarter') return 'Journal Quarterly';
			if (file.granularity === 'year') return 'Journal Yearly';
			if (file.granularity === 'all') return 'Journal All';
			return 'Journal';
		}
		if (file.type === 'calendar') return 'Calendar';
		return file.type;
	}

	private getNameLabel(file: QuickAccessFile): string {
		if (file.type === 'file') {
			return file.filePath.split('/').pop() || file.filePath;
		}
		if (file.type === 'web') {
			return file.filePath || 'Web';
		}
		if (file.type === 'journal') {
			return this.getTypeLabel(file);
		}
		if (file.type === 'calendar') {
			return 'Calendar';
		}
		return file.filePath || file.type;
	}

	getSuggestions(query: string): { index: number; label: string }[] {
		const lowerQuery = query.toLowerCase();
		return this.positions.filter(pos => 
			pos.label.toLowerCase().includes(lowerQuery)
		);
	}

	renderSuggestion(item: { index: number; label: string }, el: HTMLElement) {
		el.createEl('div', { text: item.label });
	}

	async onChooseSuggestion(item: { index: number; label: string }, evt: MouseEvent | KeyboardEvent) {
		const insertIndex = item.index;
		
		// 선택한 위치에 파일 삽입
		this.plugin.settings.quickAccessFiles.splice(insertIndex, 0, this.newFile);
		await this.plugin.saveSettings();

		// Empty State 갱신 (새 탭에 반영)
		await this.plugin.customizeEmptyState();

		const fileName = this.newFile.filePath.split('/').pop() || this.newFile.filePath;
		const positionText = insertIndex === 0 ? 'at top' : `at position ${insertIndex + 1}`;
		new Notice(`✅ Added "${fileName}" to Quick Access ${positionText}!`);
	}
}

/**
 * 현재 열려있는 파일을 Quick Access에 추가하는 커맨드
 */
export async function addCurrentFileToQuickAccess(plugin: SynapticViewPlugin): Promise<void> {
	const activeFile = plugin.app.workspace.getActiveFile();
	
	if (!activeFile) {
		new Notice('📄 No active file to add.');
		return;
	}

	// 이미 Quick Access에 있는지 확인
	const existingFile = plugin.settings.quickAccessFiles.find(
		f => f.type === 'file' && f.filePath === activeFile.path
	);

	if (existingFile) {
		new Notice(`📌 "${activeFile.basename}" is already in Quick Access.`);
		return;
	}

	// 새로운 Quick Access 파일 생성
	const newQuickAccessFile: QuickAccessFile = {
		id: `file-${Date.now()}`, // 유니크한 ID 생성
		type: 'file',
		filePath: activeFile.path,
		icon: 'file-text', // 기본 아이콘
		enabled: true
	};

	// 위치 선택 모달 열기
	const modal = new QuickAccessPositionModal(plugin, newQuickAccessFile);
	modal.open();
}

