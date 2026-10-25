# HAIWRITE 홈페이지

> Human Thinks, AI Expands, We Write.

인간과 AI가 함께 창작하는 구독형 디지털 문학 플랫폼 HAIWRITE의 홈페이지입니다.

## 페이지

| 파일 | 내용 |
|---|---|
| `index.html` | 메인 — 소개, H-A-I 창작법, 장르, 구독 안내, 문의 |
| `works.html` | 작품 목록 — 장르별 탭, 최신순 카드 목록 |
| `read.html` | 작품 읽기 — 본문, 글자 크기 조절, 창작 과정(H-A-I), 좋아요·저장·공유 |
| `hall.html` | 명예의 전당 — 장르별 이번 주 선정작과 선정 기준 |

## 구조

```
css/style.css   공통 스타일
css/sub.css     서브 페이지 스타일
js/main.js      메뉴, 스크롤 효과
js/data.js      작품 데이터 (현재 예시 작품)
js/pages.js     목록·읽기·명예의 전당 화면 구성
images/         로고, 메인 이미지
```

## 로컬에서 보기

```bash
python -m http.server 5173
```

브라우저에서 http://localhost:5173 을 엽니다.

## 참고

- `js/data.js`의 작품은 화면 구성을 위한 예시입니다.
- 하단의 문의 이메일과 운영 주체는 확정 후 교체해야 합니다.
