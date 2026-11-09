/* 서브 페이지 — body[data-page] 값에 따라 해당 화면만 그립니다. */

const SAMPLE_COMMENTS = [
  { name: '봄날의서재', text: '마지막 문단에서 한참 머물렀어요. 오래 기억하고 싶은 문장입니다.' },
  { name: '파도소리', text: '짧은데 여운이 길어요. 다음 작품도 기다리겠습니다.' },
  { name: '연필깎는밤', text: '장면이 눈앞에 그려지는 글이네요. 잘 읽었습니다.' }
];
const PLAY_ICON = '<svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg>';
const PAUSE_ICON = '<svg viewBox="0 0 24 24"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
const today = () => new Date().toISOString().slice(0, 10);
const loginUrl = () => 'login.html?next=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);

const PAGES = {

  /* ---------- 소개: 목차 스크롤 강조 ---------- */
  about() {
    const links = $$('.about-nav a');
    const targets = links.map(a => $(a.getAttribute('href')));
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        links.forEach(a => a.classList.toggle('is-current', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    targets.forEach(t => t && io.observe(t));
  },

  /* ---------- 작품 감상 목록 ---------- */
  works() {
    const tabs = [['all', '전체'], ...Object.entries(GENRES).map(([k, g]) => [k, g.name]), ['hai', 'HAI Essay']];
    let genre = param('hai') ? 'hai' : (GENRES[param('genre')] ? param('genre') : 'all');
    const tabBox = $('#genre-tabs');
    const sort = $('#sort');

    tabBox.innerHTML = tabs.map(([k, n]) =>
      `<button type="button" class="tab" role="tab" data-genre="${k}" aria-selected="${k === genre}">${n}</button>`).join('');

    const render = () => {
      let list = allWorks().filter(w => genre === 'all' || (genre === 'hai' ? w.hai : w.genre === genre));
      list.sort(sort.value === 'popular'
        ? (a, b) => popularity(b) - popularity(a)
        : (a, b) => b.date.localeCompare(a.date));
      $('#works-grid').innerHTML = list.length ? list.map(workCard).join('') : '<p class="empty">아직 등록된 작품이 없습니다.</p>';
      const g = GENRES[genre];
      $('#genre-intro').innerHTML = g
        ? `<p class="genre-intro"><strong>${g.name}</strong>${g.desc}</p>`
        : genre === 'hai'
          ? '<p class="genre-intro"><strong>HAI Essay</strong>인간의 의도, AI의 실행, 저자의 감동적 터치로 완성한 신수필 작품입니다. <a href="about.html#hai-essay" class="text-link">하이 에세이란?</a></p>'
          : '';
    };

    tabBox.addEventListener('click', e => {
      const t = e.target.closest('.tab');
      if (!t) return;
      genre = t.dataset.genre;
      $$('.tab', tabBox).forEach(b => b.setAttribute('aria-selected', b === t));
      const url = new URL(location);
      url.search = genre === 'all' ? '' : genre === 'hai' ? '?hai=1' : '?genre=' + genre;
      history.replaceState(null, '', url);
      render();
    });
    sort.addEventListener('change', render);
    render();
  },

  /* ---------- 작품 상세 (아이보리 읽기 화면) ---------- */
  work() {
    const root = $('#reader');
    const w = findWork(param('id'));
    if (!w) {
      root.innerHTML = '<div class="empty"><p>작품을 찾을 수 없습니다.</p><p style="margin-top:20px"><a href="works.html" class="btn btn-deep">작품 목록으로</a></p></div>';
      return;
    }
    document.title = `${w.title} — 하이라이트`;
    const g = GENRES[w.genre];
    const u = auth.user();
    const canReact = !!(u && u.plan);
    const isOwner = !!(u && w.mine && w.email === u.email);

    let media = '';
    if (w.genre === 'dicasi') {
      media = `<figure class="reader-media">${artHTML(w)}${w.caption ? `<figcaption>${esc(w.caption)}</figcaption>` : ''}</figure>`;
    } else if (w.genre === 'audio' || w.genre === 'video') {
      media = `<figure class="reader-media">
        ${w.genre === 'video' ? artHTML(w) : ''}
        <div class="player" data-duration="${w.duration || '00:30'}">
          <button type="button" aria-label="재생">${PLAY_ICON}</button>
          <div class="player-bar"><span></span></div>
          <span class="player-time">00:00 / ${w.duration || '00:30'}</span>
        </div>
        <figcaption>시범 플레이어입니다. 실제 ${w.genre === 'audio' ? '오디오' : '영상'} 파일은 작가 업로드 후 재생됩니다.${w.genre === 'video' ? ' 자막 제공을 함께 검토합니다.' : ''}</figcaption>
      </figure>`;
    }

    const paragraphs = w.body.map(p => `<p>${esc(p)}</p>`).join('');
    const nav = (() => {
      const same = allWorks().filter(x => x.genre === w.genre).sort((a, b) => b.date.localeCompare(a.date));
      const i = same.findIndex(x => x.id === w.id);
      const prev = same[i + 1], next = same[i - 1];
      return `<nav class="reader-nav" aria-label="같은 장르의 다른 작품">
        ${prev ? `<a href="work.html?id=${prev.id}"><small>이전 작품</small><strong>${esc(prev.title)}</strong></a>` : '<span></span>'}
        ${next ? `<a href="work.html?id=${next.id}"><small>다음 작품</small><strong>${esc(next.title)}</strong></a>` : '<span></span>'}
      </nav>`;
    })();

    root.innerHTML = `
      <p class="breadcrumb"><a href="highlights.html">홈</a> / <a href="works.html">작품 감상</a> / <a href="works.html?genre=${w.genre}">${g.name}</a></p>
      <header class="reader-head">
        <span class="tag">${g.name}${w.hai ? ' · HAI Essay' : ''}</span>
        <h1 class="reader-title">${esc(w.title)}</h1>
        <p class="reader-meta"><strong>${esc(w.author)}</strong> · ${fmtDate(w.date)} 공개${w.aiNote ? ' · AI 협업 표시' : ''}</p>
      </header>
      ${isOwner ? `<div class="owner-tools">
        <a href="write.html?edit=${w.id}" class="btn btn-line">수정</a>
        <button type="button" class="btn btn-line" id="delete-work">삭제</button></div>` : ''}
      ${media}
      ${w.genre !== 'dicasi' ? `<button type="button" class="tts-btn" aria-pressed="false" id="tts">${ICONS.audio}<span>AI 낭독 듣기</span></button>` : ''}
      <div class="reader-body ${w.genre === 'dicasi' ? 'poem' : ''}">${paragraphs}</div>
      <div class="reader-actions">
        <button type="button" class="like-btn" id="like" aria-pressed="false">${ICONS.heart}<span>좋아요</span> <b id="like-count"></b></button>
      </div>
      <section class="comments" aria-labelledby="c-title">
        <h2 id="c-title">댓글 <span id="c-count"></span></h2>
        ${canReact
          ? `<form class="comment-form" id="c-form"><label class="sr-only" for="c-input">댓글 입력</label>
               <input class="input" id="c-input" maxlength="300" placeholder="작품에 마음을 남겨 주세요" required>
               <button class="btn btn-deep" type="submit">등록</button></form>`
          : `<div class="comment-gate"><span>${u ? '좋아요와 댓글은 구독 회원만 남길 수 있습니다.' : '로그인 후 좋아요와 댓글을 남길 수 있습니다.'}</span>
               <a href="${u ? 'subscribe.html' : loginUrl()}" class="btn btn-deep">${u ? '구독하기' : '로그인'}</a></div>`}
        <ul class="comment-list" id="c-list"></ul>
      </section>
      ${nav}`;

    const sync = () => {
      const s = workStats(w);
      $('#like').setAttribute('aria-pressed', s.liked);
      $('#like-count').textContent = s.likes;
      $('#c-count').textContent = s.comments;
      const mine = (store.get('comments', {})[w.id] || []).slice().reverse();
      const samples = w.mine ? [] : SAMPLE_COMMENTS.slice(0, Math.min(3, w.comments));
      $('#c-list').innerHTML = [...mine, ...samples].map(c =>
        `<li><div class="c-head"><strong>${esc(c.name)}</strong><span>${c.date ? fmtDate(c.date) : ''}</span></div><p>${esc(c.text)}</p></li>`).join('')
        + (w.comments > samples.length ? `<li class="muted" style="font-size:17px">외 ${w.comments - samples.length}개의 댓글</li>` : '');
    };
    sync();

    $('#like').addEventListener('click', () => {
      if (!canReact) { toast(u ? '좋아요는 구독 회원만 누를 수 있습니다.' : '로그인이 필요합니다.'); return; }
      const likes = store.get('likes', {});
      likes[w.id] ? delete likes[w.id] : (likes[w.id] = true);
      store.set('likes', likes);
      sync();
    });

    const form = $('#c-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      const input = $('#c-input');
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const all = store.get('comments', {});
      (all[w.id] = all[w.id] || []).push({ name: u.name, text, date: today() });
      store.set('comments', all);
      input.value = '';
      sync();
      toast('댓글이 등록되었습니다.');
    });

    const del = $('#delete-work');
    if (del) del.addEventListener('click', () => {
      if (!confirm('이 작품을 삭제할까요? 삭제한 작품은 되돌릴 수 없습니다.')) return;
      store.set('myWorks', store.get('myWorks', []).filter(x => x.id !== w.id));
      location.href = 'mypage.html';
    });

    // 시범 플레이어: 실제 파일 없이 진행 막대만 움직입니다.
    $$('.player').forEach(p => {
      const [m, s] = p.dataset.duration.split(':').map(Number);
      const total = m * 60 + s;
      const btn = $('button', p), bar = $('.player-bar span', p), time = $('.player-time', p);
      let t = 0, timer = null;
      const fmt = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
      btn.addEventListener('click', () => {
        if (timer) { clearInterval(timer); timer = null; btn.innerHTML = PLAY_ICON; btn.setAttribute('aria-label', '재생'); return; }
        btn.innerHTML = PAUSE_ICON; btn.setAttribute('aria-label', '일시정지');
        timer = setInterval(() => {
          t = Math.min(total, t + 1);
          bar.style.width = (t / total * 100) + '%';
          time.textContent = `${fmt(t)} / ${p.dataset.duration}`;
          if (t >= total) { clearInterval(timer); timer = null; t = 0; btn.innerHTML = PLAY_ICON; }
        }, 1000);
      });
    });

    // AI 낭독: 브라우저 내장 음성 합성으로 시연합니다. 실제 음성 기술은 개발 단계에서 확정합니다.
    const tts = $('#tts');
    if (tts) {
      if (!('speechSynthesis' in window)) { tts.hidden = true; return; }
      tts.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
          speechSynthesis.cancel();
          tts.setAttribute('aria-pressed', 'false'); $('span', tts).textContent = 'AI 낭독 듣기';
          return;
        }
        const utter = new SpeechSynthesisUtterance(w.title + '. ' + w.body.join(' '));
        utter.lang = 'ko-KR';
        utter.rate = 0.95;
        utter.onend = () => { tts.setAttribute('aria-pressed', 'false'); $('span', tts).textContent = 'AI 낭독 듣기'; };
        speechSynthesis.speak(utter);
        tts.setAttribute('aria-pressed', 'true'); $('span', tts).textContent = '낭독 멈추기';
      });
      window.addEventListener('pagehide', () => speechSynthesis.cancel());
    }
  },

  /* ---------- 명예의 전당 ---------- */
  hall() {
    const cur = HALL[0];
    const w = findWork(cur.workId);
    $('#hall-current').innerHTML = `
      <div class="bg-deep promise reveal" style="margin:0">
        <div class="two-col">
          ${artHTML(w, 'art-tall')}
          <div>
            <span class="eyebrow">이달의 작품 · ${cur.month}</span>
            <q>${esc(cur.quote)}</q>
            <h2 class="hall-work" style="margin-top:28px">${esc(w.title)}</h2>
            <p class="hall-by">${esc(w.author)} · ${GENRES[w.genre].name}${w.hai ? ' · HAI Essay' : ''}</p>
            <p class="hall-excerpt">${esc(w.excerpt)}</p>
            <p class="hall-react"><span>${cur.note}</span></p>
            <div class="btn-row"><a href="work.html?id=${w.id}" class="btn btn-ivory">작품 읽기 ${ICONS.arrow}</a></div>
          </div>
        </div>
      </div>`;
    $('#hall-archive').innerHTML = HALL.slice(1).map(h => {
      const x = findWork(h.workId);
      return `<a href="work.html?id=${x.id}" class="hall-item reveal">
        <span class="month">${h.month}</span>
        <h3>${esc(x.title)}</h3>
        <p class="muted" style="font-size:17px">${esc(x.author)} · ${GENRES[x.genre].name}</p>
        <q>${esc(h.quote)}</q>
        <p class="note">${h.note}</p>
      </a>`;
    }).join('');
  },

  academy() {
    $('#course-grid').innerHTML = COURSES.map(courseCard).join('');
  },

  /* ---------- 웹진 ---------- */
  webzine() {
    const cover = z => `<div class="zine-cover art-${z.palette}">
      <span class="zine-no">Vol.${String(z.no).padStart(2, '0')}</span>
      <span class="zine-mast">HIGHLIGHT<br>WEBZINE</span>
      <strong class="zine-title">${esc(z.title)}</strong>
      <span class="zine-season">${esc(z.season)}</span></div>`;
    const z = WEBZINE[0];
    $('#zine-latest').innerHTML = `<div class="webzine-grid">
      <div class="zine-cover-wrap reveal">${cover(z)}</div>
      <div class="reveal d1">
        <span class="block-num">LATEST ISSUE · ${esc(z.date)}</span>
        <h2 class="block-title">Vol.${String(z.no).padStart(2, '0')} 「${esc(z.title)}」</h2>
        <ol class="zine-toc">${z.toc.map((t, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(t)}</li>`).join('')}</ol>
        <div class="btn-row"><button type="button" class="btn btn-deep" data-zine>온라인 열람 ${ICONS.arrow}</button></div>
      </div></div>`;
    $('#zine-archive').innerHTML = WEBZINE.map(i => `<article class="issue reveal">
      ${cover(i)}
      <div>
        <span class="tag">${esc(i.season)} · ${esc(i.date)}</span>
        <h3>Vol.${String(i.no).padStart(2, '0')} 「${esc(i.title)}」</h3>
        <ol>${i.toc.slice(0, 4).map(t => `<li>· ${esc(t)}</li>`).join('')}</ol>
        <button type="button" class="text-link" style="background:none;border-width:0 0 1px;margin-top:14px" data-zine>목차 · 열람 ${ICONS.arrow}</button>
      </div></article>`).join('');
    document.addEventListener('click', e => {
      if (e.target.closest('[data-zine]')) toast('웹진 열람 파일은 발간 후 등록됩니다.');
    });
  },

  /* ---------- 출판 상담 ---------- */
  publish() {
    const form = $('#consult-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.elements.name.value.trim(), contact = form.contact.value.trim();
      if (!name || !contact) {
        toast('이름과 연락처를 입력해 주세요.');
        (name ? form.contact : form.elements.name).focus();
        return;
      }
      form.reset();
      toast('시범 화면: 상담 신청이 접수된 것으로 표시됩니다. (실제 전송 없음)');
    });
  },

  /* ---------- 구독: 요금제 선택 → 가입/로그인 → 결제 → 활성화 ---------- */
  subscribe() {
    const root = $('#sub-main');
    const steps = $$('#flow-steps li');
    const setStep = n => steps.forEach((li, i) => {
      li.classList.toggle('is-done', i < n);
      li.classList.toggle('is-now', i === n);
    });
    const u = auth.user();
    const plan = PLANS[param('plan')] ? param('plan') : null;

    if (!plan) {
      setStep(u && u.plan ? 4 : 0);
      root.innerHTML = (u && u.plan
        ? `<div class="notice" style="margin-bottom:32px"><strong>현재 ${PLANS[u.plan].name}</strong>으로 구독 중입니다. 요금제를 변경하거나 <button type="button" class="text-link" style="background:none;border-width:0 0 1px" id="cancel-sub">구독을 해지</button>할 수 있습니다.</div>`
        : '') + `<div class="plan-grid">${planCards()}</div>`;
      const cancel = $('#cancel-sub');
      if (cancel) cancel.addEventListener('click', () => {
        if (!confirm('구독을 해지할까요? (시범 동작)')) return;
        auth.subscribe(null);
        location.reload();
      });
      return;
    }

    const p = PLANS[plan];
    if (!u) {
      setStep(1);
      root.innerHTML = `<div class="form-card reveal" style="margin:0 auto;text-align:center">
        <span class="block-num">STEP 02</span>
        <h2 class="block-title">${p.name} 구독을 위해 로그인해 주세요</h2>
        <p class="muted" style="margin-bottom:28px">회원이 아니라면 가입 후 바로 결제로 이어집니다.</p>
        <div class="btn-row" style="justify-content:center">
          <a href="${loginUrl()}" class="btn btn-deep">로그인 / 회원가입 ${ICONS.arrow}</a>
          <a href="subscribe.html" class="btn btn-line">요금제 다시 고르기</a>
        </div></div>`;
      return;
    }

    if (u.plan === plan) {
      setStep(4);
      root.innerHTML = `<div class="form-card" style="margin:0 auto;text-align:center">
        <span class="block-num">ACTIVE</span>
        <h2 class="block-title">이미 ${p.name}으로 구독 중입니다</h2>
        <div class="btn-row" style="justify-content:center">
          ${plan === 'writer' ? `<a href="write.html" class="btn btn-gold">작품 등록하기 ${ICONS.arrow}</a>` : ''}
          <a href="works.html" class="btn btn-deep">작품 감상하기</a>
          <a href="mypage.html" class="btn btn-line">마이페이지</a>
        </div></div>`;
      return;
    }

    setStep(2);
    root.innerHTML = `<div class="checkout">
      <div class="form-card">
        <span class="block-num">STEP 03 · 결제</span>
        <h2 class="block-title">결제 수단</h2>
        <div class="notice">결제대행사(PG) 연동 전 시범 화면입니다. 카드 정보를 입력받지 않으며, 아래 버튼을 누르면 구독이 활성화된 것으로 표시됩니다.</div>
        <p class="hint" style="margin-top:16px">자동 갱신 · 청구일 · 해지 · 환불 규정은 결제 서비스 약관 확정 후 이 자리에 안내됩니다.</p>
      </div>
      <aside class="summary">
        <span class="eyebrow">Order</span>
        <h3 style="font-family:var(--serif);font-size:26.5px">${p.name} 구독</h3>
        <dl>
          <div><dt>회원</dt><dd>${esc(u.name)}</dd></div>
          <div><dt>결제 주기</dt><dd>매월</dd></div>
          <div class="total"><dt>월 결제 금액</dt><dd>${won(p.price)}</dd></div>
        </dl>
        <button type="button" class="btn btn-gold" id="pay">${won(p.price)} 결제하기 ${ICONS.arrow}</button>
      </aside></div>`;
    $('#pay').addEventListener('click', () => {
      auth.subscribe(plan);
      setStep(4);
      root.innerHTML = `<div class="form-card" style="margin:0 auto;text-align:center">
        <span class="block-num">STEP 04 · 완료</span>
        <h2 class="block-title">${p.name} 구독이 시작되었습니다</h2>
        <p class="muted" style="margin-bottom:28px">이제 작품에 좋아요와 댓글을 남길 수 있습니다.${plan === 'writer' ? ' 첫 작품을 등록해 보세요.' : ''}</p>
        <div class="btn-row" style="justify-content:center">
          ${plan === 'writer' ? `<a href="write.html" class="btn btn-gold">작품 등록하기 ${ICONS.arrow}</a>` : ''}
          <a href="works.html" class="btn btn-deep">작품 감상하기</a>
        </div></div>`;
      $('.site-header').remove();
      renderHeader();
    });
  },

  /* ---------- 로그인 / 회원가입 (시범) ---------- */
  login() {
    const form = $('#auth-form');
    const submit = $('#auth-submit');
    let mode = 'login';
    $$('.auth-main .tab').forEach(t => t.addEventListener('click', () => {
      mode = t.dataset.mode;
      $$('.auth-main .tab').forEach(b => b.setAttribute('aria-selected', b === t));
      $$('.join-only', form).forEach(el => { el.hidden = mode !== 'join'; });
      form.password.autocomplete = mode === 'join' ? 'new-password' : 'current-password';
      submit.textContent = mode === 'join' ? '회원가입' : '로그인';
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      const email = form.email.value.trim();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { toast('이메일 주소를 확인해 주세요.'); form.email.focus(); return; }
      if (!form.password.value) { toast('비밀번호를 입력해 주세요.'); form.password.focus(); return; }
      const name = (mode === 'join' && form.elements.name.value.trim()) || email.split('@')[0];
      auth.login(name, email);
      const next = param('next');
      location.href = next && /^[\w.-]+\.html(\?.*)?$/.test(next) ? next : 'highlights.html';
    });
  },

  /* ---------- 마이페이지 ---------- */
  mypage() {
    const u = auth.user();
    if (!u) { location.replace(loginUrl()); return; }
    const liked = store.get('likes', {});
    const likedWorks = allWorks().filter(w => liked[w.id]);
    const mine = store.get('myWorks', []).filter(w => w.email === u.email);
    const commentCount = Object.values(store.get('comments', {})).flat().filter(c => c.name === u.name).length;

    $('#mypage').innerHTML = `
      <aside class="my-card">
        <div class="avatar" aria-hidden="true">${esc(u.name.slice(0, 1))}</div>
        <h2>${esc(u.name)}</h2>
        <p style="font-size:17px;opacity:.7">${esc(u.email)}</p>
        <span class="plan-tag">${u.plan ? PLANS[u.plan].name + ' · ' + won(PLANS[u.plan].price) + '/월' : '구독 전'}</span>
        <p style="font-size:17px;opacity:.75">남긴 댓글 ${commentCount}개 · 좋아요 ${likedWorks.length}개</p>
        <a href="subscribe.html" class="btn btn-ivory">${u.plan ? '구독 관리' : '구독하기'}</a>
        ${u.plan === 'writer' ? `<a href="write.html" class="btn btn-gold">작품 등록</a>` : ''}
      </aside>
      <div>
        ${u.plan === 'writer' ? `<section class="my-section">
          <h3>내 작품 <a href="write.html" class="text-link" style="font-family:var(--sans);font-size:18px">새 작품 등록 ${ICONS.arrow}</a></h3>
          ${mine.length ? `<div class="work-grid">${mine.map(workCard).join('')}</div>` : '<p class="genre-intro">아직 등록한 작품이 없습니다.</p>'}
        </section>` : ''}
        <section class="my-section">
          <h3>좋아요한 작품</h3>
          ${likedWorks.length ? `<div class="work-grid">${likedWorks.map(workCard).join('')}</div>` : '<p class="genre-intro">마음에 드는 작품에 좋아요를 눌러 보세요. <a href="works.html" class="text-link">작품 감상</a></p>'}
        </section>
      </div>`;
  },

  /* ---------- 작품 등록 (작가회원 전용) ---------- */
  write() {
    const root = $('#write-root');
    const u = auth.user();
    if (!auth.isWriter()) {
      root.innerHTML = `<div class="form-card" style="margin:0 auto;text-align:center">
        <span class="block-num">WRITER ONLY</span>
        <h1 class="block-title">작품 등록은 작가회원만 가능합니다</h1>
        <p class="muted" style="margin-bottom:28px">작가회원(월 20,000원)으로 구독하면 디카시·숏폼에세이·오디오·영상문학 작품을 발표하고 관리할 수 있습니다.</p>
        <div class="btn-row" style="justify-content:center">
          <a href="${u ? 'subscribe.html?plan=writer' : 'login.html?next=' + encodeURIComponent('subscribe.html?plan=writer')}" class="btn btn-gold">작가회원으로 구독하기 ${ICONS.arrow}</a>
          <a href="about.html#hai-model" class="btn btn-line">H-A-I 창작 모델 보기</a>
        </div></div>`;
      return;
    }

    const editing = store.get('myWorks', []).find(w => w.id === param('edit') && w.email === u.email);
    const v = editing || { genre: 'short', title: '', body: [], caption: '' };
    root.innerHTML = `
      <span class="block-num">${editing ? 'EDIT' : 'NEW WORK'}</span>
      <h1 class="block-title">${editing ? '작품 수정' : '작품 등록'}</h1>
      <form class="form-card" id="write-form" novalidate style="max-width:820px">
        <label class="field"><span>장르</span>
          <select class="select" name="genre">${Object.entries(GENRES).map(([k, g]) => `<option value="${k}"${v.genre === k ? ' selected' : ''}>${g.name}</option>`).join('')}</select>
        </label>
        <label class="field"><span>제목</span><input class="input" name="title" maxlength="60" required value="${esc(v.title)}"></label>
        <label class="field"><span>작품 본문</span>
          <textarea class="textarea" name="body" required placeholder="디카시는 행 단위로, 산문은 문단 사이를 한 줄 띄워 적어 주세요.">${esc(v.body.join('\n'))}</textarea>
          <p class="hint">줄바꿈 한 번이 한 줄(문단)로 표시됩니다.</p>
        </label>
        <label class="field" id="file-field"><span>대표 이미지 · 오디오 · 영상 파일</span>
          <input class="input" type="file" name="file" accept="image/*,audio/*,video/*">
          <p class="hint">시범 화면에서는 파일이 업로드되지 않습니다. 실제 서비스에서는 업로드 진행률과 실패 안내가 표시됩니다.</p>
        </label>
        <label class="field"><span>사진 설명 / 캡션 (선택)</span><input class="input" name="caption" value="${esc(v.caption || '')}"></label>
        <label class="field" style="display:flex;gap:10px;align-items:flex-start;font-size:18px">
          <input type="checkbox" name="hai" ${v.hai ? 'checked' : ''} style="margin-top:6px;accent-color:var(--deep)">
          <span style="font-weight:400;margin:0">HAI Essay(신수필) 작품으로 표시합니다 — AI와의 협업 범위를 독자에게 알립니다.</span>
        </label>
        <label class="field" style="display:flex;gap:10px;align-items:flex-start;font-size:18px">
          <input type="checkbox" name="rights" required style="margin-top:6px;accent-color:var(--deep)">
          <span style="font-weight:400;margin:0">업로드하는 글·이미지·음성·영상에 대한 권리를 보유하고 있음을 확인합니다. (필수)</span>
        </label>
        <div class="btn-row">
          <button type="submit" class="btn btn-deep">${editing ? '수정 완료' : '작품 발표하기'} ${ICONS.arrow}</button>
          <a href="${editing ? 'work.html?id=' + editing.id : 'mypage.html'}" class="btn btn-line">취소</a>
        </div>
      </form>`;

    const form = $('#write-form');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = form.elements.title.value.trim();
      const lines = form.body.value.split('\n').map(s => s.trim());
      while (lines.length && !lines[lines.length - 1]) lines.pop();
      if (!title) { toast('제목을 입력해 주세요.'); form.elements.title.focus(); return; }
      if (!lines.some(Boolean)) { toast('작품 본문을 입력해 주세요.'); form.body.focus(); return; }
      if (!form.rights.checked) { toast('권리 보유 확인에 동의해 주세요.'); form.rights.focus(); return; }
      const genre = form.genre.value;
      const text = lines.filter(Boolean);
      const work = Object.assign(editing || {
        id: 'my' + Date.now(), author: u.name, email: u.email, date: today(),
        likes: 0, comments: 0, palette: Math.floor(Math.random() * 8), mine: true
      }, {
        genre, title, hai: form.hai.checked, aiNote: form.hai.checked,
        body: genre === 'dicasi' ? lines : text,
        excerpt: genre === 'dicasi' ? text.slice(0, 2).join(' / ') : text[0].slice(0, 80),
        caption: form.caption.value.trim(),
        duration: (genre === 'audio' || genre === 'video') ? (editing && editing.duration) || '00:30' : undefined
      });
      const list = store.get('myWorks', []).filter(w => w.id !== work.id);
      store.set('myWorks', [work, ...list]);
      location.href = 'work.html?id=' + work.id;
    });
  }
};

const run = PAGES[document.body.dataset.page];
if (run) run();
