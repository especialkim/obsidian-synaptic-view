import { App, Plugin } from 'obsidian';
import { SynapticView } from '../views/synapticView';
import { SynapticViewSettings, SynapticContainer } from '../settings';
import { DailyNoteBadgeManager } from '../ui/dailyNoteBadge';

/**
 * Synaptic View 탭을 여는 커맨드
 * 새로운 탭을 생성하고 Synaptic View UI를 표시합니다.
 */
export async function openSynapticViewTab(app: App, settings: SynapticViewSettings, dailyNoteBadgeManager: DailyNoteBadgeManager, plugin: Plugin): Promise<void> {
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
	const synapticView = new SynapticView(app, settings, dailyNoteBadgeManager);
	plugin.register(() => synapticView.destroy());
	// 컨테이너에 cleanup 함수 저장 (탭 단위 정리용)
	const container = newLeaf.view.containerEl;
	if (container) {
		(container as SynapticContainer)._synapticDestroy = () => synapticView.destroy();
	}
	await synapticView.initializeSynapticView(newLeaf);
}

