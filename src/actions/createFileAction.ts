import { App } from 'obsidian';

/**
 * 현재 탭에 새 파일을 생성합니다.
 */
export async function createNewFile(app: App): Promise<void> {
	const activeLeaf = app.workspace.activeLeaf;
	if (!activeLeaf) return;
	
	// Obsidian의 내부 메서드를 사용하여 새 파일 생성
	const file = await (app as any).fileManager.createNewMarkdownFile(
		app.fileManager.getNewFileParent(''),
		''
	);
	
	// 현재 탭에서 파일 열기
	await activeLeaf.openFile(file, { state: { mode: 'source' } });
}

