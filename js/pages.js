(function () {
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function paras(arr) { return arr.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join(''); }

  function cardHTML(w) {
    var g = genreOf(w.genre);
    var icon = w.media ? '<span class="cover__media" aria-hidden="true">' + (w.media === 'audio' ? '♪' : '▶') + '</span>' : '';
    return '<article class="card">' +
      '<a href="read.html?id=' + w.id + '" class="cover cover--' + w.genre + '" aria-hidden="true" tabindex="-1">' +
        '<span class="cover__genre">' + esc(g.en) + '</span>' + icon +
        '<span class="cover__title">' + esc(w.title) + '</span></a>' +
      '<div class="card__body">' +
        '<p class="card__genre">' + esc(g.ko) + '</p>' +
        '<h3 class="card__title"><a href="read.html?id=' + w.id + '">' + esc(w.title) + '</a></h3>' +
        '<p class="card__excerpt">' + esc(excerpt(w, 90)) + '</p>' +
        '<p class="card__meta"><span>' + esc(w.author) + '</span><span class="date">' + w.date + '</span>' +
        '<span class="stat">♡ ' + w.likes + ' · 💬 ' + w.comments + '</span></p>' +
      '</div></article>';
  }

  var page = document.body.dataset.page;

  // ===== 작품 목록 =====
  if (page === 'works') {
    var tabs = document.getElementById('tabs');
    var grid = document.getElementById('grid');
    var count = document.getElementById('count');
    var params = new URLSearchParams(location.search);
    var current = params.get('genre') || 'all';

    tabs.innerHTML = '<button class="tab" data-genre="all">전체</button>' +
      GENRES.map(function (g) { return '<button class="tab" data-genre="' + g.id + '">' + g.ko + '</button>'; }).join('');

    function render() {
      var list = WORKS.filter(function (w) { return current === 'all' || w.genre === current; })
        .sort(function (a, b) { return b.date.localeCompare(a.date); }); // 최신순
      grid.innerHTML = list.map(cardHTML).join('');
      count.textContent = list.length;
      tabs.querySelectorAll('.tab').forEach(function (t) {
        var on = t.dataset.genre === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on);
      });
    }
    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.tab');
      if (!t) return;
      current = t.dataset.genre;
      // 읽던 장르를 주소에 남겨, 돌아왔을 때 위치 유지
      history.replaceState(null, '', current === 'all' ? 'works.html' : 'works.html?genre=' + current);
      render();
    });
    render();
  }

  // ===== 명예의 전당 =====
  if (page === 'hall') {
    var hall = document.getElementById('hall');
    hall.innerHTML = GENRES.map(function (g, i) {
      var w = WORKS.filter(function (x) { return x.genre === g.id && x.fame; })[0];
      var head = '<div class="fame__genre"><span class="no">0' + (i + 1) + '</span><h2>' + g.ko + '</h2><p>' + esc(g.en) + '</p>';
      if (!w) {
        return '<article class="fame fame--empty">' + head + '</div><div><p class="fame__peek">이번 주 선정작이 없습니다.</p></div><div></div></article>';
      }
      var score = w.likes + Math.round(w.comments * 0.8);
      return '<article class="fame">' + head + '<span class="fame__badge">독자 선정</span></div>' +
        '<div>' +
          '<h3 class="fame__title"><a href="read.html?id=' + w.id + '">' + esc(w.title) + '</a></h3>' +
          '<p class="fame__by">' + esc(w.author) + ' · ' + w.date + '</p>' +
          '<div class="fame__peek">' + paras(w.body.slice(0, 2)) + '</div>' +
          '<a href="read.html?id=' + w.id + '" class="fame__go">이어 읽기 <i class="arrow"></i></a>' +
        '</div>' +
        '<aside class="fame__score" aria-label="선정 점수"><dl>' +
          '<div><dt>유효 좋아요</dt><dd>' + w.likes + '</dd></div>' +
          '<div><dt>댓글 작성자</dt><dd>' + Math.round(w.comments * 0.8) + '</dd></div>' +
          '<div class="total"><dt>선정 점수</dt><dd>' + score + '</dd></div>' +
        '</dl></aside></article>';
    }).join('');
  }

  // ===== 작품 읽기 =====
  if (page === 'read') {
    var id = Number(new URLSearchParams(location.search).get('id')) || WORKS[0].id;
    var w = WORKS.filter(function (x) { return x.id === id; })[0] || WORKS[0];
    var g = genreOf(w.genre);
    document.title = w.title + ' — HAIWRITE';

    var crumbGenre = document.getElementById('crumbGenre');
    crumbGenre.textContent = g.ko;
    crumbGenre.href = 'works.html?genre=' + g.id;
    document.getElementById('rGenre').textContent = g.ko;
    document.getElementById('rTitle').textContent = w.title;
    var sub = document.getElementById('rSub');
    if (w.sub) sub.textContent = w.sub; else sub.remove();
    document.getElementById('rAuthor').textContent = w.author;
    document.getElementById('rDate').textContent = w.date;
    document.getElementById('aName').textContent = w.author;

    // 본문 앞 미디어 (자동 재생하지 않음)
    var media = '';
    if (w.media === 'audio') media = '<div class="media"><button class="media__play" aria-label="재생">▶</button><div class="media__bar"></div><span class="media__time">00:00 / ' + w.duration + '</span></div>';
    if (w.media === 'video') media = '<div class="media media--video"><button class="media__play" aria-label="재생">▶</button><small>영상 ' + w.duration + ' · 자동 재생되지 않습니다</small></div>';
    if (w.genre === 'dica' || w.genre === 'photo') media = '<div class="photo-ph">작품 사진 영역</div>';
    document.getElementById('rMedia').innerHTML = media;

    var body = document.getElementById('rBody');
    body.innerHTML = paras(w.body);
    if (w.genre === 'dica') body.classList.add('read__body--poem');

    // 글자 크기 조절
    var size = 18;
    document.querySelectorAll('[data-fs]').forEach(function (b) {
      b.addEventListener('click', function () {
        size = Math.min(24, Math.max(15, size + Number(b.dataset.fs)));
        body.style.setProperty('--fs', size + 'px');
      });
    });

    document.getElementById('haiH').textContent = w.hai.h;
    document.getElementById('haiA').textContent = w.hai.a;
    document.getElementById('haiI').textContent = w.hai.i;

    var likeBtn = document.getElementById('likeBtn');
    var likeNum = document.getElementById('likeNum');
    likeNum.textContent = w.likes;
    likeBtn.addEventListener('click', function () {
      var on = likeBtn.classList.toggle('is-on');
      likeNum.textContent = w.likes + (on ? 1 : 0);
      likeBtn.setAttribute('aria-pressed', on);
    });
    document.getElementById('saveBtn').addEventListener('click', function () {
      this.setAttribute('aria-pressed', this.classList.toggle('is-on'));
    });
    document.getElementById('shareBtn').addEventListener('click', function () {
      var btn = this;
      if (navigator.share) { navigator.share({ title: w.title, url: location.href }).catch(function () {}); return; }
      (navigator.clipboard ? navigator.clipboard.writeText(location.href) : Promise.reject()).then(function () {
        btn.lastChild.textContent = ' 링크 복사됨';
      }, function () {});
    });
    document.getElementById('cNum').textContent = w.comments;

    var others = WORKS.filter(function (x) { return x.genre === w.genre && x.id !== w.id; });
    if (others.length < 4) others = others.concat(WORKS.filter(function (x) { return x.genre !== w.genre; }).slice(0, 4 - others.length));
    document.getElementById('others').innerHTML = others.slice(0, 4).map(cardHTML).join('');
  }
})();
