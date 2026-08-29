const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');

const closeMenu = () => {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  document.body.style.overflow = '';
};

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(willOpen));
    navigation.classList.toggle('is-open', willOpen);
    document.body.style.overflow = willOpen ? 'hidden' : '';
  });
  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let revealObserver;

if (reduceMotion || !('IntersectionObserver' in window)) {
  document.querySelectorAll('.reveal').forEach((item) => item.classList.add('is-visible'));
} else {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll('#year').forEach((year) => {
  year.textContent = new Date().getFullYear();
});

const observeNewReveal = (item) => {
  if (reduceMotion || !revealObserver) item.classList.add('is-visible');
  else revealObserver.observe(item);
};

const priceFormatter = new Intl.NumberFormat('ko-KR');

const createProductCard = (product, index) => {
  const card = document.createElement('article');
  card.className = 'product-card reveal';

  const hasPurchaseUrl = typeof product.url === 'string' && product.url.trim() !== '';
  const destination = hasPurchaseUrl ? product.url : 'index.html#contact';
  const imageLink = document.createElement('a');
  imageLink.className = 'product-image';
  imageLink.href = destination;
  imageLink.setAttribute('aria-label', product.name + (hasPurchaseUrl ? ' 구매 페이지 열기' : ' 문의하기'));
  if (hasPurchaseUrl) {
    imageLink.target = '_blank';
    imageLink.rel = 'noopener noreferrer';
  }

  const image = document.createElement('img');
  image.src = product.image;
  image.alt = product.name;
  image.loading = index < 3 ? 'eager' : 'lazy';
  image.decoding = 'async';
  imageLink.append(image);

  const info = document.createElement('div');
  info.className = 'product-info';
  const copy = document.createElement('div');
  copy.className = 'product-copy';
  const name = document.createElement('h3');
  name.textContent = product.name;
  const price = document.createElement('p');
  price.className = 'product-price';
  price.textContent = typeof product.price === 'number'
    ? priceFormatter.format(product.price) + '원'
    : '가격 준비 중';

  const actionLink = document.createElement('a');
  actionLink.className = 'buy-button';
  actionLink.href = destination;
  actionLink.setAttribute('aria-label', product.name + (hasPurchaseUrl ? ' 구매하기' : ' 문의하기'));
  if (hasPurchaseUrl) {
    actionLink.target = '_blank';
    actionLink.rel = 'noopener noreferrer';
  }
  actionLink.innerHTML = (hasPurchaseUrl ? '구매하기' : '제품 문의') + ' <span aria-hidden="true">↗</span>';

  copy.append(name, price);
  info.append(copy, actionLink);
  card.append(imageLink, info);
  return card;
};

const renderProducts = async (grid) => {
  try {
    const response = await fetch('products.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('제품 데이터를 불러오지 못했습니다: ' + response.status);
    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('제품 데이터 형식이 올바르지 않습니다.');

    const limit = Number.parseInt(grid.dataset.limit || '', 10);
    const products = Number.isFinite(limit) ? data.products.slice(0, limit) : data.products;
    grid.replaceChildren();
    products.forEach((product, index) => {
      const card = createProductCard(product, index);
      grid.append(card);
      observeNewReveal(card);
    });

    if (!products.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'products-status';
      emptyMessage.textContent = '현재 준비된 제품이 없습니다.';
      grid.append(emptyMessage);
    }
  } catch (error) {
    const status = document.createElement('p');
    status.className = 'products-status';
    status.textContent = '제품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    grid.replaceChildren(status);
    console.error(error);
  }
};

const formatStoryDate = (value) => {
  const date = new Date(String(value || '') + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return value || '';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
};

const storyHref = (post) => {
  if (post.url) return /^https?:\/\//.test(post.url) ? post.url : 'story/' + post.url;
  return 'story/post.html?id=' + encodeURIComponent(post.id || '');
};

const renderHomeStories = async (grid) => {
  try {
    const response = await fetch('story/posts.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('글 목록을 불러오지 못했습니다: ' + response.status);
    const posts = await response.json();
    if (!Array.isArray(posts)) throw new Error('글 목록 형식이 올바르지 않습니다.');

    const latest = posts.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).slice(0, 3);
    grid.replaceChildren();
    latest.forEach((post, index) => {
      const article = document.createElement('article');
      article.className = 'journal-card reveal';
      const link = document.createElement('a');
      link.href = storyHref(post);
      if (/^https?:\/\//.test(link.href) && !link.href.startsWith(location.origin)) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      const number = document.createElement('span');
      number.className = 'journal-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const time = document.createElement('time');
      time.dateTime = post.date || '';
      time.textContent = formatStoryDate(post.date);
      const title = document.createElement('h3');
      title.textContent = post.title || '(제목 없음)';
      const summary = document.createElement('p');
      summary.textContent = post.summary || '';
      const arrow = document.createElement('b');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      link.append(number, time, title, summary, arrow);
      article.append(link);
      grid.append(article);
      observeNewReveal(article);
    });
  } catch (error) {
    const status = document.createElement('p');
    status.className = 'stories-status';
    status.textContent = '이야기를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    grid.replaceChildren(status);
    console.error(error);
  }
};

document.querySelectorAll('[data-product-grid]').forEach(renderProducts);
document.querySelectorAll('[data-story-grid]').forEach(renderHomeStories);
