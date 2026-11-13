/* 메인 페이지 */

(function hallFeature() {
  const pick = HALL[0];
  const w = findWork(pick.workId);
  const s = workStats(w);
  $('#hall-feature').innerHTML = `
    <div class="hall-visual reveal">
      ${artHTML(w, 'art-tall')}
      <svg class="ring-text" viewBox="0 0 200 200" aria-hidden="true">
        <defs><path id="ring" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0"/></defs>
        <text><textPath href="#ring">HALL OF FAME · 이달의 작품 · HALL OF FAME · 이달의 작품 ·</textPath></text>
      </svg>
    </div>
    <div class="hall-text reveal d1">
      <span class="eyebrow">Hall of Fame · ${pick.month}</span>
      <h2 class="sec-title" id="hall-title">이달의 문장을 만나다</h2>
      <p class="hall-quote">“${esc(pick.quote)}”</p>
      <h3 class="hall-work">${esc(w.title)}</h3>
      <p class="hall-by">${esc(w.author)} · ${GENRES[w.genre].name}${w.hai ? ' · HAI Essay' : ''}</p>
      <p class="hall-excerpt">${esc(w.excerpt)}</p>
      <p class="hall-react"><span>${ICONS.heart} 좋아요 ${s.likes}</span><span>${ICONS.chat} 댓글 ${s.comments}</span></p>
      <div class="btn-row">
        <a href="work.html?id=${w.id}" class="btn btn-ivory">작품 보기 ${ICONS.arrow}</a>
        <a href="hall.html" class="btn btn-line">명예의 전당</a>
      </div>
    </div>`;
})();

(function popular() {
  const tabs = [['all', '전체'], ...Object.entries(GENRES).map(([k, g]) => [k, g.name])];
  const tabBox = $('#popular-tabs');
  const grid = $('#popular-grid');
  tabBox.innerHTML = tabs.map(([k, n], i) =>
    `<button type="button" class="tab" role="tab" data-genre="${k}" aria-selected="${i === 0}">${n}</button>`).join('');
  const show = genre => {
    const list = allWorks()
      .filter(w => genre === 'all' || w.genre === genre)
      .sort((a, b) => popularity(b) - popularity(a))
      .slice(0, 4);
    grid.innerHTML = list.map(workCard).join('');
  };
  tabBox.addEventListener('click', e => {
    const t = e.target.closest('.tab');
    if (!t) return;
    $$('.tab', tabBox).forEach(b => b.setAttribute('aria-selected', b === t));
    show(t.dataset.genre);
  });
  show('all');
})();

(function ways() {
  const order = ['short', 'smart', 'dicasi', 'video', 'audio'];
  $('#ways-grid').innerHTML = order.map((k, i) => {
    const g = GENRES[k];
    return `<a href="works.html?genre=${k}" class="way-card ${i === 0 ? 'is-active' : ''} reveal ${i ? 'd' + Math.min(i, 3) : ''}">
      <span class="way-mode">${g.mode}</span>
      <h3>${g.name}<small>${g.en}</small></h3>
      <p>${g.desc}</p>
      <span class="way-icon">${ICONS[k]}</span>
    </a>`;
  }).join('');
  const cards = $$('.way-card');
  const dots = $$('.ways-line span');
  const activate = i => {
    cards.forEach((c, j) => c.classList.toggle('is-active', i === j));
    dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
  };
  cards.forEach((c, i) => {
    c.addEventListener('mouseenter', () => activate(i));
    c.addEventListener('focus', () => activate(i));
  });
  activate(0);
})();

(function webzine() {
  const z = WEBZINE.find(i => i.latest);
  $('#webzine-feature').innerHTML = `
    <div class="zine-cover-wrap reveal">
      <div class="zine-cover art-${z.palette}">
        <span class="zine-no">Vol.${String(z.no).padStart(2, '0')}</span>
        <span class="zine-mast">HIGHLIGHT<br>WEBZINE</span>
        <strong class="zine-title">${esc(z.title)}</strong>
        <span class="zine-season">${esc(z.season)}</span>
      </div>
    </div>
    <div class="reveal d1">
      <span class="eyebrow">Webzine · 최신호</span>
      <h2 class="sec-title" id="webzine-title">좋은 작품을<br>한 권의 기억으로</h2>
      <p class="sec-desc">연 2회, 선정 작가와 작품을 소개하는 하이라이트 웹진. ${esc(z.date)}</p>
      <ol class="zine-toc">${z.toc.slice(0, 5).map((t, i) => `<li><span>${String(i + 1).padStart(2, '0')}</span>${esc(t)}</li>`).join('')}</ol>
      <div class="btn-row"><a href="webzine.html" class="btn btn-ivory">웹진 보기 ${ICONS.arrow}</a></div>
    </div>`;
})();

$('#course-grid').innerHTML = COURSES.map(courseCard).join('');
$('#plan-grid').innerHTML = planCards();
