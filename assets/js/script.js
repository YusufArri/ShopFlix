'use strict';

const statusMessage = document.querySelector('[data-store-status]');
const feedback = document.querySelector('[data-store-feedback]');
const searchInput = document.querySelector('[data-product-search]');
const searchButton = document.querySelector('[data-search-submit]');
const searchResults = document.querySelector('[data-search-results]');
const searchEmpty = document.querySelector('[data-search-empty]');
const productCards = Array.from(document.querySelectorAll('.product-grid .showcase'));
const accountDialog = document.querySelector('[data-account-dialog]');
const quickViewDialog = document.querySelector('[data-quick-view-dialog]');
const quickViewImage = document.querySelector('[data-quick-view-image]');
const quickViewTitle = document.querySelector('[data-quick-view-title]');
const quickViewCategory = document.querySelector('[data-quick-view-category]');
const quickViewPrice = document.querySelector('[data-quick-view-price]');
const quickViewAddButton = document.querySelector('[data-quick-view-add]');

const cart = new Map();
const wishlist = new Set();
const comparison = new Set();
let activeQuickViewCard = null;
let feedbackTimeout;

const announce = function (message) {
  statusMessage.textContent = message;
  feedback.textContent = message;
  feedback.hidden = false;

  window.clearTimeout(feedbackTimeout);
  feedbackTimeout = window.setTimeout(function () {
    feedback.hidden = true;
  }, 3500);
};

const getProductDetails = function (card) {
  const titleElement = card.querySelector('.showcase-title');
  const imageElement = card.querySelector('.product-img.default, .showcase-img');
  const categoryElement = card.querySelector('.showcase-category');
  const priceElement = card.querySelector('.price');

  return {
    title: titleElement ? titleElement.textContent.trim() : 'ShopFlix selection',
    image: imageElement ? imageElement.currentSrc || imageElement.src : '',
    imageAlt: imageElement ? imageElement.alt : '',
    category: categoryElement ? categoryElement.textContent.trim() : 'ShopFlix edit',
    price: priceElement ? priceElement.textContent.trim() : ''
  };
};

const updateCountBadges = function () {
  const cartCount = Array.from(cart.values()).reduce(function (total, item) {
    return total + item.quantity;
  }, 0);

  document.querySelectorAll('[data-cart-count]').forEach(function (badge) {
    badge.textContent = cartCount;
  });

  document.querySelectorAll('[data-wishlist-count]').forEach(function (badge) {
    badge.textContent = wishlist.size;
  });
};

const addToCart = function (card) {
  const product = getProductDetails(card);
  const existingItem = cart.get(product.title);

  cart.set(product.title, {
    product: product,
    quantity: existingItem ? existingItem.quantity + 1 : 1
  });

  updateCountBadges();
  announce(product.title + ' added to your demo bag.');
};

const toggleWishlist = function (card, button) {
  const product = getProductDetails(card);
  const isSaved = wishlist.has(product.title);

  if (isSaved) {
    wishlist.delete(product.title);
  } else {
    wishlist.add(product.title);
  }

  button.setAttribute('aria-pressed', String(!isSaved));
  updateCountBadges();
  announce(isSaved ? product.title + ' removed from your wishlist.' : product.title + ' saved to your wishlist.');
};

const openQuickView = function (card) {
  if (!quickViewDialog || typeof quickViewDialog.showModal !== 'function') return;

  const product = getProductDetails(card);
  activeQuickViewCard = card;
  quickViewImage.src = product.image;
  quickViewImage.alt = product.imageAlt;
  quickViewTitle.textContent = product.title;
  quickViewCategory.textContent = product.category;
  quickViewPrice.textContent = product.price;
  quickViewDialog.showModal();
};

const updateProductSearch = function (query) {
  const normalizedQuery = query.trim().toLowerCase();
  const searchAliases = {
    'beauty': ['cosmetic', 'perfume', 'shampoo'],
    'jewelry': ['jewel', 'jewellery', 'earring', 'necklace', 'ring'],
    'jewellery': ['jewel', 'jewellery', 'earring', 'necklace', 'ring'],
    'footwear': ['shoe', 'sports', 'boot'],
    'dress & frock': ['dress', 'skirt', 'clothes'],
    'winter wear': ['winter', 'jacket', 'coat'],
    'glasses & lens': ['glasses', 'sunglasses'],
    'shorts & jeans': ['shorts', 'jeans'],
    't-shirts': ['t-shirt', 'shirt'],
    'jacket': ['jacket', 'coat'],
    'watch': ['watch'],
    'hat & caps': ['hat', 'cap']
  };
  const terms = searchAliases[normalizedQuery] || [normalizedQuery];
  let visibleCount = 0;

  productCards.forEach(function (card) {
    const cardText = card.textContent.toLowerCase();
    const matches = !normalizedQuery || terms.some(function (term) {
      return cardText.includes(term);
    });
    card.classList.toggle('is-filtered-out', !matches);
    if (matches) visibleCount += 1;
  });

  searchEmpty.hidden = visibleCount > 0;
  searchResults.hidden = !normalizedQuery || visibleCount === 0;
  searchResults.textContent = 'Showing ' + visibleCount + ' ' + (visibleCount === 1 ? 'style' : 'styles') + ' for "' + query.trim() + '".';

  if (normalizedQuery) {
    announce(visibleCount + ' ' + (visibleCount === 1 ? 'style matches' : 'styles match') + ' your search.');
  }
};

const applyCategoryFilter = function (category) {
  if (!searchInput) return;
  searchInput.value = category;
  updateProductSearch(category);
  document.querySelector('#collection').scrollIntoView({ behavior: 'smooth' });
};

if (searchInput) {
  searchInput.addEventListener('input', function () {
    updateProductSearch(searchInput.value);
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      updateProductSearch(searchInput.value);
    }
  });
}

if (searchButton) {
  searchButton.addEventListener('click', function () {
    updateProductSearch(searchInput.value);
  });
}

document.querySelectorAll('.product-grid .showcase').forEach(function (card) {
  const product = getProductDetails(card);

  card.querySelectorAll('.btn-action').forEach(function (button) {
    const icon = button.querySelector('ion-icon');
    const iconName = icon ? icon.getAttribute('name') : '';

    if (iconName === 'heart-outline') {
      button.setAttribute('aria-label', 'Add ' + product.title + ' to wishlist');
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () {
        toggleWishlist(card, button);
      });
    } else if (iconName === 'bag-add-outline') {
      button.setAttribute('aria-label', 'Add ' + product.title + ' to bag');
      button.addEventListener('click', function () {
        addToCart(card);
      });
    } else if (iconName === 'eye-outline') {
      button.setAttribute('aria-label', 'Preview ' + product.title);
      button.addEventListener('click', function () {
        openQuickView(card);
      });
    } else if (iconName === 'repeat-outline') {
      button.setAttribute('aria-label', 'Compare ' + product.title);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', function () {
        const isCompared = comparison.has(product.title);

        if (isCompared) {
          comparison.delete(product.title);
        } else {
          comparison.add(product.title);
        }

        button.setAttribute('aria-pressed', String(!isCompared));
        announce(comparison.size + ' ' + (comparison.size === 1 ? 'style selected' : 'styles selected') + ' to compare.');
      });
    }
  });

  document.querySelectorAll('.product-featured .showcase').forEach(function (card) {
    const addButton = card.querySelector('.add-cart-btn');
    if (addButton) {
      addButton.addEventListener('click', function () {
        addToCart(card);
      });
    }
  });

  const addButton = card.querySelector('.add-cart-btn');
  if (addButton) {
    addButton.addEventListener('click', function () {
      addToCart(card);
    });
  }
});

document.querySelectorAll('.product-grid .showcase-img-box, .product-grid .showcase-title, .product-minimal .showcase-img-box, .product-minimal .showcase-title').forEach(function (link) {
  const card = link.closest('.showcase');
  if (!card) return;

  link.addEventListener('click', function (event) {
    event.preventDefault();
    openQuickView(card);
  });
  link.setAttribute('href', '#collection');
  link.setAttribute('aria-label', 'Preview ' + getProductDetails(card).title);
});

document.querySelectorAll('.product-featured .showcase-title').forEach(function (link) {
  const card = link.closest('.showcase');
  link.addEventListener('click', function (event) {
    event.preventDefault();
    openQuickView(card);
  });
  link.setAttribute('href', '#deals');
});

document.querySelectorAll('.product-grid .showcase-category').forEach(function (link) {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    applyCategoryFilter(link.textContent.trim());
  });
  link.setAttribute('href', '#collection');
});

document.querySelectorAll('.category-btn').forEach(function (link) {
  const item = link.closest('.category-item');
  const heading = item ? item.querySelector('.category-item-title') : null;
  const category = heading ? heading.textContent.trim() : '';

  link.setAttribute('href', '#collection');
  link.addEventListener('click', function (event) {
    event.preventDefault();
    applyCategoryFilter(category);
  });
});

document.querySelectorAll('a[href="#"]').forEach(function (link) {
  const icon = link.querySelector('ion-icon');
  const iconName = icon ? icon.getAttribute('name') : '';
  const label = link.textContent.trim().toLowerCase();

  if (iconName.indexOf('logo-') === 0) {
    link.removeAttribute('href');
    link.classList.add('is-placeholder');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'Social profile links are not connected in this demo.');
    return;
  }

  if (link.classList.contains('service-item') ||
      /terms|legal|secure payment|sitemap|delivery|about us|english|espa|fran|usd|eur/.test(label)) {
    link.removeAttribute('href');
    link.classList.add('is-placeholder');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'This page is not available in the demo storefront.');
    return;
  }

  let destination = null;
  if (label.indexOf('home') !== -1 || label === 'shopflix') destination = '#home';
  else if (/beauty|cosmetic|perfume|fragrance|makeup|skincare|hair care|bath & body/.test(label)) destination = '#beauty';
  else if (/jewel|earring|necklace|bracelet|ring/.test(label)) destination = '#jewelry';
  else if (/blog|journal/.test(label)) destination = '#journal';
  else if (/offer|deal|sale|price/.test(label)) destination = '#deals';
  else if (/contact|support/.test(label)) destination = '#contact';
  else if (/fashion|clothes|shirt|short|jean|jacket|dress|shoe|footwear|watch|hat|cap|bag|formal|casual|sport|wallet|collection|product|category/.test(label)) destination = '#collection';

  if (destination) {
    link.setAttribute('href', destination);
  } else {
    link.removeAttribute('href');
    link.classList.add('is-placeholder');
    link.setAttribute('aria-disabled', 'true');
    link.setAttribute('title', 'This destination is not connected in the demo storefront.');
  }
});

document.querySelectorAll('[data-show-cart]').forEach(function (button) {
  button.addEventListener('click', function () {
    const items = Array.from(cart.values());
    if (!items.length) {
      announce('Your demo bag is empty. Add a style to get started.');
      return;
    }

    const summary = items.map(function (item) {
      return item.product.title + ' x ' + item.quantity;
    }).join(', ');
    announce('Your demo bag: ' + summary + '. Checkout is not connected.');
  });
});

document.querySelectorAll('[data-show-wishlist]').forEach(function (button) {
  button.addEventListener('click', function () {
    const savedItems = Array.from(wishlist);
    announce(savedItems.length ? 'Wishlist: ' + savedItems.join(', ') + '.' : 'Your wishlist is empty. Save a style with the heart button.');
  });
});

document.querySelectorAll('[data-open-account]').forEach(function (button) {
  button.addEventListener('click', function () {
    if (accountDialog && typeof accountDialog.showModal === 'function') accountDialog.showModal();
    else announce('Account sign-in is not connected in this demo.');
  });
});

if (quickViewAddButton) {
  quickViewAddButton.addEventListener('click', function () {
    if (activeQuickViewCard) addToCart(activeQuickViewCard);
  });
}

document.querySelectorAll('[data-open-newsletter]').forEach(function (button) {
  button.addEventListener('click', function () {
    if (modal) modal.classList.add('active');
  });
});

const newsletterForm = document.querySelector('[data-newsletter-form]');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', function (event) {
    event.preventDefault();
    newsletterForm.reset();
    modal.classList.remove('active');
    announce('Thanks for your interest. Email signups are not collected in this demo.');
  });
}

const modal = document.querySelector('[data-modal]');
const modalCloseBtn = document.querySelector('[data-modal-close]');
const modalCloseOverlay = document.querySelector('[data-modal-overlay]');
const closeNewsletter = function () {
  modal.classList.remove('active');
};

if (modalCloseOverlay) modalCloseOverlay.addEventListener('click', closeNewsletter);
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeNewsletter);

const mobileMenuOpenButtons = document.querySelectorAll('[data-mobile-menu-open-btn]');
const mobileMenus = document.querySelectorAll('[data-mobile-menu]');
const mobileMenuCloseButtons = document.querySelectorAll('[data-mobile-menu-close-btn]');
const overlay = document.querySelector('[data-overlay]');

mobileMenuOpenButtons.forEach(function (button, index) {
  button.addEventListener('click', function () {
    if (!mobileMenus[index]) return;
    mobileMenus[index].classList.add('active');
    overlay.classList.add('active');
  });
});

mobileMenuCloseButtons.forEach(function (button, index) {
  button.addEventListener('click', function () {
    if (mobileMenus[index]) mobileMenus[index].classList.remove('active');
    if (overlay) overlay.classList.remove('active');
  });
});

if (overlay) {
  overlay.addEventListener('click', function () {
    mobileMenus.forEach(function (menu) {
      menu.classList.remove('active');
    });
    overlay.classList.remove('active');
  });
}

document.querySelectorAll('[data-accordion-btn]').forEach(function (button) {
  button.addEventListener('click', function () {
    const content = button.nextElementSibling;
    const wasOpen = content.classList.contains('active');

    document.querySelectorAll('[data-accordion]').forEach(function (panel) {
      panel.classList.remove('active');
    });
    document.querySelectorAll('[data-accordion-btn]').forEach(function (accordionButton) {
      accordionButton.classList.remove('active');
    });

    if (!wasOpen) {
      content.classList.add('active');
      button.classList.add('active');
    }
  });
});
