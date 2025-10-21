# Synaptic View for Obsidian

**Obsidian의 새 탭을 열 때마다 지금 당장 필요한 노트와 연결해 주는, 살아 있는 대시보드.**

---

## 왜 Synaptic View인가?

커스텀 대시보드나 허브 노트를 여러 개 만들어 놓아도, 실제로 그 노트들을 열기까지는 몇 번의 클릭과 의식적인 전환이 필요합니다. Obsidian의 텅 빈 새 탭은 시작점이 아니라 멈칫하는 공간이 되고, 애써 정리한 관점들은 제대로 활용되지 못합니다.

Synaptic View는 그 공백을 상황을 인지하는 컨트롤 패널로 바꿔 줍니다. 새로운 탭이 열리는 순간, 일기·주간 리뷰·프로젝트 허브·외부 링크 등 원하는 항목으로 즉시 이동하는 큼직한 버튼들이 시야에 들어옵니다. 두 번째 뇌처럼 커져 버린 볼트를 가진 사용자에게, 시냅스가 연결되듯 빠르고 목적 있게 흐름을 되살리는 경험을 제공합니다.

---

## 주요 기능

- **새 탭 대시보드**  
  새 탭이 열릴 때 Obsidian의 기본 빈 화면 대신 Synaptic View를 표시하도록 설정할 수 있습니다.

- **플로팅 퀵 액세스 바**  
  화면 상단의 고정된 액션 바에서 다음과 같은 버튼을 즉시 사용할 수 있습니다.
  - 새 노트 만들기
  - 퀵 스위처 열기
  - 플러그인 설정으로 이동
  - 설정한 Quick Access 항목 열기

- **다양한 타입의 Quick Access 항목**  
  각 버튼이 어떤 방식으로 동작할지 선택할 수 있습니다.
  - `File`: 특정 문서나 캔버스를 바로 열기
  - `Web`: 탭 내에서 웹 페이지 열기
  - `Journal`: Periodic Notes/Daily Notes와 연동하여 일/주/월/분기/연 노트를 열기 (없으면 자동 생성)
  - `Calendar`: 미니 캘린더에서 날짜를 선택해 관련 노트 열기

- **Journal & Calendar 서브메뉴**  
  Journal의 “All” 버튼에 마우스를 올리면 시간 단위를 즉시 선택할 수 있고, 캘린더 서브메뉴로 특정 날짜·주·월 노트에 바로 접근할 수 있습니다.

- **미리보기 전용 UI 스타일**  
  대시보드처럼 보이도록 인라인 타이틀과 임베디드 멘션을 숨길 수 있는 옵션을 제공합니다.

- **친숙한 설정 도구**  
  - 드래그 앤 드롭으로 순서 조정, 켜기/끄기 토글, 기본 뷰 선택
  - 파일 경로 자동완성
  - 최근 사용 기록이 남는 Lucide 아이콘 선택기

- **커맨드 팔레트 지원**  
  “Open Synaptic View tab” 커맨드를 실행해 원하는 순간에 대시보드를 열 수 있습니다.

---

## 앞으로의 로드맵

현재는 한 가지 핵심 경험에 집중하고 있으며, 다음과 같은 확장을 계획하고 있습니다.

1. 시간대별 기본 뷰 (예: 오전엔 작업 보드, 저녁엔 Daily Note)  
2. 상황 기반 트리거 (특정 워크플로에서 프로젝트 대시보드 자동 전환)  
3. 생태계 확장에 맞춘 추가 액션과 통합

Synaptic View가 “두 번째 뇌의 제어 센터”가 되길 원하신다면, 사용 후기나 아이디어를 공유해 주세요. 실제 사용 흐름이 다음 버전을 결정합니다.

---

## 설치 방법

### 소스에서 직접 설치

```bash
git clone https://github.com/your-name/obsidian-synaptic-view.git
cd obsidian-synaptic-view
npm install
npm run build
```

빌드 후 생성된 `main.js`, `manifest.json`, `styles.css`를 다음 경로에 복사합니다.

```
<Vault>/.obsidian/plugins/obsidian-synaptic-view/
```

Obsidian을 다시 로드한 뒤 **Community plugins**를 활성화하고 **Synaptic View**를 켜 주세요.

### 수동 설치

1. 최신 릴리스에서 `main.js`, `manifest.json`, `styles.css`를 다운로드합니다.  
2. `<Vault>/.obsidian/plugins/obsidian-synaptic-view/` 폴더에 파일을 복사합니다.  
3. Obsidian을 다시 로드한 뒤 플러그인을 활성화합니다.

> **호환성**: Obsidian v0.15.0 이상을 요구하며, 현재는 데스크톱 환경에서 동작합니다 (`isDesktopOnly: true`).

---

## 시작 가이드

1. **Settings → Community plugins → Synaptic View** 메뉴를 엽니다.  
2. 필요하면 **Replace New Tab with Synaptic View** 토글을 켜세요.  
3. Quick Access 항목을 추가합니다.
   - 유형(File, Web, Journal, Calendar)을 선택합니다.
   - 파일 경로나 Journal의 granularity를 설정합니다.
   - 아이콘을 선택하거나, Journal이라면 자동 설정에 맡깁니다.
   - 항목을 켜거나 끄고, 순서를 바꾸고, 기본으로 열릴 항목을 지정합니다.
4. 미리보기 모드에서의 스타일 옵션을 원하는 대로 조정합니다.  
5. 새 탭을 열거나 “Open Synaptic View tab” 커맨드를 실행해 결과를 확인합니다.

활용 팁:
- Quick Access 버튼 위에 마우스를 올린 상태에서 <kbd>Cmd</kbd>/<kbd>Ctrl</kbd>을 누르면 “편집 모드”로 전환되어 소스 뷰를 바로 열 수 있습니다.
- Journal과 Calendar 서브메뉴로 대시보드를 떠나지 않고도 시간 축을 자유롭게 이동할 수 있습니다.

---

## 개발 환경

```bash
npm install
npm run dev   # 변경 사항을 감지하며 빌드
npm run build # 배포용 번들 생성
```

이 프로젝트는 TypeScript로 작성하고 esbuild로 번들링합니다. 소스 코드는 `src/`에 위치하며, 릴리스에 포함할 `main.js`는 루트 경로에 출력됩니다.

---

## 지원 및 문의

이 플러그인은 **Yongmini**가 만들었습니다. 업데이트나 의견, 협업 제안을 원하신다면:

- Author: [@Facilitate4U on X](https://x.com/Facilitate4U)
- Plugin ID: `obsidian-synaptic-view`

Synaptic View가 여러분의 작업 흐름에 도움이 되었다면, 사용기를 공유하거나 주변에 알려 주세요. 다른 볼트가 어떻게 빛나는지 듣는 것이 다음 발전의 가장 큰 동력이 됩니다.
