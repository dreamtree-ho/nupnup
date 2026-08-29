const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.site-nav');

const closeMenu = () => {
  menuButton.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
  document.body.style.overflow = '';
};

menuButton.addEventListener('click', () => {
  const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(willOpen));
  navigation.classList.toggle('is-open', willOpen);
  document.body.style.overflow = willOpen ? 'hidden' : '';
});

navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('resize', () => { if (window.innerWidth > 900) closeMenu(); });

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

document.getElementById('year').textContent = new Date().getFullYear();

const priceFormatter = new Intl.NumberFormat('ko-KR');

const createProductCard = (product, index) => {
  const card = document.createElement('article');
  card.className = 'product-card reveal';

  const imageLink = document.createElement('a');
  imageLink.className = 'product-image';
  imageLink.href = product.url;
  imageLink.target = '_blank';
  imageLink.rel = 'noopener noreferrer';
  imageLink.setAttribute('aria-label', `${product.name} 구매 페이지 열기`);

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
  price.textContent = `${priceFormatter.format(product.price)}원`;

  const buyLink = document.createElement('a');
  buyLink.className = 'buy-button';
  buyLink.href = product.url;
  buyLink.target = '_blank';
  buyLink.rel = 'noopener noreferrer';
  buyLink.setAttribute('aria-label', `${product.name} 구매하기`);
  buyLink.innerHTML = '구매하기 <span aria-hidden="true">↗</span>';

  copy.append(name, price);
  info.append(copy, buyLink);
  card.append(imageLink, info);
  return card;
};

const renderProducts = async (grid) => {
  try {
    const response = await fetch('products.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error(`제품 데이터를 불러오지 못했습니다: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.products)) throw new Error('제품 데이터 형식이 올바르지 않습니다.');

    const limit = Number.parseInt(grid.dataset.limit || '', 10);
    const products = Number.isFinite(limit) ? data.products.slice(0, limit) : data.products;
    grid.replaceChildren();

    products.forEach((product, index) => {
      const card = createProductCard(product, index);
      grid.append(card);
      if (reduceMotion || !revealObserver) card.classList.add('is-visible');
      else revealObserver.observe(card);
    });

    if (!products.length) {
      const emptyMessage = document.createElement('p');
      emptyMessage.className = 'products-status';
      emptyMessage.textContent = '현재 준비된 제품이 없습니다.';
      grid.append(emptyMessage);
    }
  } catch (error) {
    const status = grid.querySelector('.products-status') || document.createElement('p');
    status.className = 'products-status';
    status.textContent = '제품을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    grid.replaceChildren(status);
    console.error(error);
  }
};

document.querySelectorAll('[data-product-grid]').forEach(renderProducts);
