(function () {
  var list = document.getElementById('story-list');
  var main = document.getElementById('story-post');

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function fmtDate(value) {
    var date = new Date(String(value || '') + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value || '';
    return date.getFullYear() + '. ' + (date.getMonth() + 1) + '. ' + date.getDate() + '.';
  }

  function hrefOf(post) {
    return post.url ? String(post.url) : 'post.html?id=' + encodeURIComponent(post.id || '');
  }

  function renderList(posts) {
    if (!list) return;
    posts = Array.isArray(posts) ? posts.slice() : [];
    posts.sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
    list.replaceChildren();

    if (!posts.length) {
      list.appendChild(el('p', 'story-empty', '아직 올라온 글이 없습니다.'));
      return;
    }

    posts.forEach(function (post, index) {
      var item = el('li', 'story-list-card reveal');
      var link = el('a');
      link.href = hrefOf(post);
      var number = el('span', 'story-list-number', String(index + 1).padStart(2, '0'));
      var time = el('time', null, fmtDate(post.date));
      time.setAttribute('datetime', String(post.date || ''));
      var title = el('h2', null, String(post.title || '(제목 없음)'));
      var summary = el('p', 'story-list-summary', String(post.summary || ''));
      var arrow = el('b', null, '↗');
      arrow.setAttribute('aria-hidden', 'true');
      link.append(number, time, title, summary, arrow);
      item.appendChild(link);
      list.appendChild(item);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) item.classList.add('is-visible');
      else requestAnimationFrame(function () { item.classList.add('is-visible'); });
    });
  }

  function renderBody(source) {
    var box = el('div', 'post-body');
    String(source || '').replace(/\r\n/g, '\n').split(/\n\s*\n/).forEach(function (block) {
      block = block.trim();
      if (!block) return;
      var lines = block.split('\n');
      if (lines.every(function (line) { return /^- /.test(line.trim()); })) {
        var ul = el('ul');
        lines.forEach(function (line) { ul.appendChild(el('li', null, line.trim().slice(2))); });
        box.appendChild(ul);
      } else if (/^## /.test(block)) {
        box.appendChild(el('h2', null, block.slice(3).trim()));
      } else {
        box.appendChild(el('p', null, block));
      }
    });
    return box;
  }

  function setMeta(post) {
    var title = String(post.title || '이야기');
    var description = String(post.description || post.summary || '').slice(0, 160);
    var url = location.href;
    document.title = title + ' — noop noop';
    var pairs = [
      ['meta[name="description"]', 'content', description],
      ['meta[name="author"]', 'content', String(post.author || '')],
      ['link[rel="canonical"]', 'href', url],
      ['meta[property="og:title"]', 'content', title + ' — noop noop'],
      ['meta[property="og:description"]', 'content', description],
      ['meta[property="og:url"]', 'content', url]
    ];
    pairs.forEach(function (pair) {
      var node = document.querySelector(pair[0]);
      if (node) node.setAttribute(pair[1], pair[2]);
    });
  }

  function renderNotFound() {
    if (!main) return;
    var box = el('div', 'post-notfound');
    box.appendChild(el('h1', null, '글을 찾을 수 없습니다'));
    box.appendChild(el('p', null, '주소가 잘못되었거나 삭제된 글일 수 있어요.'));
    var back = el('a', 'action-link', '이야기 목록으로');
    back.href = 'index.html';
    box.appendChild(back);
    main.replaceChildren(box);
  }

  function renderFaq(items) {
    var section = el('section', 'post-faq');
    section.appendChild(el('h2', null, '자주 묻는 질문'));
    items.forEach(function (item) {
      var details = el('details');
      details.appendChild(el('summary', null, String(item.q)));
      details.appendChild(el('p', null, String(item.a)));
      section.appendChild(details);
    });
    return section;
  }

  function renderPost(posts) {
    if (!main) return;
    posts = Array.isArray(posts) ? posts.slice() : [];
    posts.sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
    var query = new URLSearchParams(location.search);
    var id = query.get('id') || query.get('slug');
    var index = posts.findIndex(function (post) {
      return String(post.id) === id || (post.url && String(post.url).replace(/\.html$/, '') === id);
    });
    if (index < 0) {
      renderNotFound();
      return;
    }

    var post = posts[index];
    setMeta(post);
    var article = el('article', 'story-article');
    var head = el('header', 'post-head');
    var time = el('time', null, fmtDate(post.date));
    time.setAttribute('datetime', String(post.date || ''));
    head.appendChild(time);
    head.appendChild(el('h1', null, String(post.title || '(제목 없음)')));
    if (post.author) head.appendChild(el('p', 'post-author', String(post.author)));
    if (Array.isArray(post.tags) && post.tags.length) {
      var tags = el('div', 'post-tags');
      post.tags.forEach(function (tag) { tags.appendChild(el('span', null, String(tag))); });
      head.appendChild(tags);
    }
    article.appendChild(head);
    article.appendChild(renderBody(post.body));

    var faq = Array.isArray(post.faq)
      ? post.faq.filter(function (item) { return item && item.q && item.a; })
      : [];
    if (faq.length) article.appendChild(renderFaq(faq));

    var previous = posts[index + 1];
    var next = posts[index - 1];
    if (previous || next) {
      var nav = el('nav', 'post-navigation');
      function addLink(target, label) {
        if (!target) {
          nav.appendChild(el('span'));
          return;
        }
        var link = el('a');
        link.href = hrefOf(target);
        link.appendChild(el('small', null, label));
        link.appendChild(el('strong', null, String(target.title || '')));
        nav.appendChild(link);
      }
      addLink(previous, '이전 글');
      addLink(next, '다음 글');
      article.appendChild(nav);
    }
    main.replaceChildren(article);
  }

  fetch('posts.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(function (posts) {
      renderList(posts);
      renderPost(posts);
    })
    .catch(function () {
      if (list) list.replaceChildren(el('p', 'story-error', '글 목록을 불러오지 못했습니다.'));
      if (main) renderNotFound();
    });
})();
