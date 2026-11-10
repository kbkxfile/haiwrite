/* 하이라이트 — 공통 레이아웃 · 시범 회원 상태 · 작품 카드 렌더링
   회원/구독/좋아요/댓글은 실제 서버가 없어 이 브라우저의 localStorage에만 저장되는 시범 동작입니다. */

const NAV = [
  { key: 'about',   label: '소개',       href: 'about.html' },
  { key: 'works',   label: '작품 감상',   href: 'works.html' },
  { key: 'hall',    label: '명예의 전당', href: 'hall.html' },
  { key: 'academy', label: '아카데미',    href: 'academy.html' },
  { key: 'webzine', label: '웹진',       href: 'webzine.html' },
  { key: 'publish', label: '출판',       href: 'publish.html' }
];

const PLANS = {
  reader: { name: '일반회원', price: 5000 },
  writer: { name: '작가회원', price: 20000 }
};

/* ---------- storage ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('hl_' + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('hl_' + key, JSON.stringify(value)); } catch (e) { /* 저장 불가 환경 */ }
  },
  remove(key) {
    try { localStorage.removeItem('hl_' + key); } catch (e) { /* noop */ }
  }
};

const auth = {
  user() { return store.get('user', null); },
  login(name, email) { store.set('user', { name, email, plan: (auth.user() || {}).plan || null }); },
  logout() { store.remove('user'); },
  subscribe(plan) { const u = auth.user(); if (u) { u.plan = plan; store.set('user', u); } },
  isWriter() { const u = auth.user(); return !!u && u.plan === 'writer'; }
};

/* ---------- helpers ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = n => n.toLocaleString('ko-KR') + '원';
const param = k => new URLSearchParams(location.search).get(k);
const fmtDate = d => d.replace(/-/g, '.');

function allWorks() {
  return [...store.get('myWorks', []), ...WORKS];
}
function findWork(id) {
  return allWorks().find(w => w.id === id);
}
function workStats(w) {
  const liked = store.get('likes', {})[w.id] ? 1 : 0;
  const extra = (store.get('comments', {})[w.id] || []).length;
  return { likes: w.likes + liked, comments: w.comments + extra, liked: !!liked };
}
function popularity(w) {
  const s = workStats(w);
  return s.likes + s.comments;
}

const ICONS = {
  dicasi: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>',
  short:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/></svg>',
  audio:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a7.5 7.5 0 010 11"/></svg>',
  video:  '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9l5 3-5 3z"/></svg>',
  heart:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>',
  chat:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg>',
  arrow:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M14 7l5 5-5 5"/></svg>'
};

function artHTML(w, extraClass = '') {
  const label = w.genre === 'dicasi' ? `<span class="art-poem">${esc(w.body[0])}</span>` : '';
  const time = w.duration ? `<span class="art-time">${w.duration}</span>` : '';
  return `<div class="art art-${w.palette % 8} ${extraClass}" role="img" aria-label="${esc(w.title)} 대표 이미지">
    <span class="art-wave"></span>${label}<span class="art-icon">${ICONS[w.genre]}</span>${time}</div>`;
}

function workCard(w) {
  const s = workStats(w);
  const g = GENRES[w.genre];
  return `<article class="work-card">
    <a href="work.html?id=${w.id}" class="work-link">
      ${artHTML(w)}
      <div class="work-meta">
        <span class="tag">${g.name}${w.hai ? ' · HAI Essay' : ''}</span>
        <h3>${esc(w.title)}</h3>
        <p class="excerpt">${esc(w.excerpt)}</p>
        <div class="work-foot">
          <span class="author">${esc(w.author)}</span>
          <span class="react"><span>${ICONS.heart}${s.likes}</span><span>${ICONS.chat}${s.comments}</span></span>
        </div>
      </div>
    </a>
  </article>`;
}

function courseCard(c) {
  const open = c.status === '모집 중';
  return `<article class="course-card reveal">
    <span class="badge ${open ? 'badge-open' : ''}">${c.status}</span>
    <h3>${esc(c.title)}</h3>
    <dl>
      <div><dt>대상</dt><dd>${esc(c.target)}</dd></div>
      <div><dt>목표</dt><dd>${esc(c.goal)}</dd></div>
      <div><dt>일시</dt><dd>${esc(c.schedule)}</dd></div>
      <div><dt>장소</dt><dd>${esc(c.place)}</dd></div>
      <div><dt>수강료</dt><dd>${esc(c.fee)}</dd></div>
    </dl>
    ${open
      ? `<a href="${c.form}" class="btn btn-deep" data-form-link>신청하기 (Google Forms) ${ICONS.arrow}</a>`
      : `<span class="btn btn-line is-disabled" aria-disabled="true">모집 예정</span>`}
  </article>`;
}

function planCards() {
  const u = auth.user();
  const rows = {
    reader: ['모든 작품 감상', '좋아요 · 댓글 참여', '결제 및 구독 관리'],
    writer: ['모든 작품 감상', '좋아요 · 댓글 참여', '작품 등록 (디카시·숏폼에세이·오디오·영상)', '본인 작품 수정 · 삭제', '명예의 전당 · 웹진 선정 대상']
  };
  return Object.entries(PLANS).map(([key, p]) => {
    const current = u && u.plan === key;
    return `<article class="plan-card ${key === 'writer' ? 'plan-featured' : ''} reveal">
      ${key === 'writer' ? '<span class="plan-flag">창작자를 위한</span>' : ''}
      <h3>${p.name}</h3>
      <p class="plan-price"><strong>${p.price.toLocaleString('ko-KR')}</strong>원 <span>/ 월</span></p>
      <ul>${rows[key].map(r => `<li>${r}</li>`).join('')}</ul>
      <a href="subscribe.html?plan=${key}" class="btn ${key === 'writer' ? 'btn-gold' : 'btn-ivory'}">${current ? '이용 중인 요금제' : p.name + '으로 구독하기'}</a>
    </article>`;
  }).join('');
}

/* 아카데미 신청 폼 주소가 아직 없을 때의 안내 */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-form-link]');
  if (a && a.getAttribute('href') === '#') {
    e.preventDefault();
    toast('Google Forms 신청 주소는 운영 확정 후 연결됩니다.');
  }
});

/* ---------- layout ---------- */
function renderHeader() {
  const page = document.body.dataset.page;
  const u = auth.user();
  const util = u
    ? `<a href="mypage.html" class="util-link">마이페이지</a>
       <button type="button" class="util-link" data-logout>로그아웃</button>
       <a href="subscribe.html" class="btn-sub">${u.plan ? '구독 관리' : '구독하기'}</a>`
    : `<a href="login.html" class="util-link">로그인</a>
       <a href="subscribe.html" class="btn-sub">구독하기</a>`;
  const links = NAV.map(n => `<a href="${n.href}"${n.key === page ? ' aria-current="page"' : ''}>${n.label}</a>`).join('');

  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <div class="header-inner">
      <a href="highlights.html" class="brand" aria-label="하이라이트 홈">
        <img src="images/logo-wide-white.png" alt="HAIWRITE" width="204" height="34">
      </a>
      <nav class="gnb" aria-label="주 메뉴">${links}</nav>
      <div class="util">${util}</div>
      <button type="button" class="menu-toggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="mobile-nav">
        <span></span><span></span><span></span>
      </button>
    </div>
    <nav class="mobile-nav" id="mobile-nav" aria-label="모바일 메뉴" hidden>
      <div class="mobile-util">${util}</div>
      ${links}
    </nav>`;
  const skip = $('.skip-link');
  skip ? skip.after(header) : document.body.prepend(header);

  const toggle = $('.menu-toggle', header);
  const drawer = $('.mobile-nav', header);
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    drawer.hidden = !open;
    document.body.classList.toggle('nav-open', open);
  });
  $$('[data-logout]', header).forEach(b => b.addEventListener('click', () => {
    auth.logout();
    location.href = 'highlights.html';
  }));

  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

function renderFooter() {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container">
      <div class="footer-links">
        <a href="#">이용약관</a><a href="#">개인정보처리방침</a><a href="#">콘텐츠 운영정책</a><a href="#">저작권 안내</a>
      </div>
      <div class="footer-body">
        <img src="images/logo-white.png" alt="HAIWRITE — Human Thinks, AI Expands, We Write." class="footer-logo">
        <div class="footer-info">
          <p class="footer-name">하이라이트 HIGHLIGHT</p>
          <p>운영 · 한국디지털문인협회 <span class="muted">(운영 주체·사업자 정보는 확정 후 표기)</span></p>
          <p>문의 · <a href="mailto:contact@haiwrite.kr">contact@haiwrite.kr</a> <span class="muted">(예시 주소)</span></p>
        </div>
        <p class="copyright">© 2026 HAIWRITE. All rights reserved.<br>작품의 저작권은 각 창작자에게 있습니다.</p>
      </div>
    </div>`;
  document.body.append(footer);
}

function initReveal() {
  const items = $$('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  items.forEach(el => io.observe(el));
}

function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.append(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2400);
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  initReveal();
});
