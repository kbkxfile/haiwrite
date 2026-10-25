(function () {
  // 헤더: 스크롤 시 배경 적용
  var header = document.getElementById('header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 모바일 메뉴
  var menuBtn = document.getElementById('menuBtn');
  menuBtn.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  });
  document.querySelectorAll('#gnb a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
      menuBtn.setAttribute('aria-expanded', false);
    });
  });

  // H-A-I 카드: 마우스 오버 / 포커스 시 활성화
  var cards = document.querySelectorAll('.pcard');
  var dots = document.querySelectorAll('.timeline__dots i');
  cards.forEach(function (card, i) {
    function activate() {
      cards.forEach(function (c) { c.classList.toggle('is-active', c === card); });
      dots.forEach(function (d, j) { d.classList.toggle('on', j === i); });
    }
    card.addEventListener('mouseenter', activate);
    card.addEventListener('focus', activate);
    card.addEventListener('click', activate);
  });

  // 장르 목록
  var genreName = document.getElementById('genreName');
  var genreDesc = document.getElementById('genreDesc');
  var genres = document.querySelectorAll('.genre');
  genres.forEach(function (g) {
    function activate() {
      genres.forEach(function (x) { x.classList.toggle('is-active', x === g); });
      genreName.textContent = g.querySelector('.genre__ko').textContent;
      genreDesc.textContent = g.dataset.desc;
      document.getElementById('genreLink').href = 'works.html?genre=' + g.dataset.id;
    }
    g.addEventListener('mouseenter', activate);
    g.addEventListener('click', activate);
  });

  // 스크롤 등장 효과
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
