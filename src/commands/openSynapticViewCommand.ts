import { App } from 'obsidian';
import { SynapticView } from '../views/synapticView';
import { SynapticViewSettings } from '../settings';

/**
 * Synaptic View 탭을 여는 커맨드
 * 새로운 탭을 생성하고 Synaptic View UI를 표시합니다.
 */
export async function openSynapticViewTab(app: App, settings: SynapticViewSettings): Promise<void> {
	// 새로운 빈 탭 생성
	const newLeaf = app.workspace.getLeaf('tab');
	
	// 빈 상태로 설정 (empty view)
	await newLeaf.setViewState({
		type: 'empty',
		active: true
	});
	
	// 포커스를 새 탭으로 이동
	app.workspace.setActiveLeaf(newLeaf, { focus: true });
	
	// Synaptic View 초기화
	const synapticView = new SynapticView(app, settings);
	await synapticView.initializeSynapticView(newLeaf);
}

