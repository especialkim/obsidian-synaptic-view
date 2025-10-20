import { App, Notice } from 'obsidian';

/**
 * 현재 탭에 새 파일을 생성합니다.
 */
export async function createNewFile(app: App): Promise<void> {
	try {
		// 활성화된 leaf 가져오기
		const activeLeaf = app.workspace.activeLeaf;
		if (!activeLeaf) {
			new Notice('활성화된 탭을 찾을 수 없습니다.');
			return;
		}
		
		// 새 파일 생성
		const fileName = `Untitled ${Date.now()}.md`;
		const file = await app.vault.create(fileName, '');
		
		// 현재 leaf에서 파일 열기 (편집 모드)
		await activeLeaf.openFile(file, { state: { mode: 'source' } });
		
		console.log('[createNewFile] 새 파일 생성 완료:', file.path);
	} catch (error) {
		console.error('[createNewFile] 파일 생성 실패:', error);
		new Notice('파일 생성에 실패했습니다.');
	}
}

