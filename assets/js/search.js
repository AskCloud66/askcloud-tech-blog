import * as params from '@params';

const searchIcon = document.getElementById('search-icon');
const searchOverlay = document.getElementById('search-overlay');
const searchSection = document.getElementById('search-section');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchClose = document.getElementById('search-close');
const searchResults = document.getElementById('searchResults');
const noResults = document.getElementById('NotSearchResults');
const searchError = document.getElementById('searchError');
const searchLoading = document.getElementById('searchLoading');

let indexPromise;
let searchIndex = [];
let searchTimer;
let pageScrollY = 0;

function isReady() {
  return searchIcon && searchOverlay && searchSection && searchForm && searchInput && searchResults;
}

function showElement(element, displayClass = 'flex') {
  if (!element) return;
  element.classList.remove('hidden');
  element.classList.add(displayClass);
}

function hideElement(element, displayClass = 'flex') {
  if (!element) return;
  element.classList.add('hidden');
  element.classList.remove(displayClass);
}

function setLoading(isLoading) {
  if (isLoading) {
    showElement(searchLoading);
  } else {
    hideElement(searchLoading);
  }
}

function setError(hasError) {
  if (hasError) {
    showElement(searchError);
    searchResults.innerHTML = '';
    hideElement(noResults);
  } else {
    hideElement(searchError);
  }
}

function setNoResults(visible) {
  if (visible) {
    showElement(noResults);
  } else {
    hideElement(noResults);
  }
}

function setSearchOpen(isOpen) {
  if (isOpen) {
    pageScrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${pageScrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
  } else {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.right = '';
    document.body.style.width = '';
    window.scrollTo({ top: pageScrollY, behavior: 'auto' });
  }
  searchOverlay.classList.toggle('is-open', isOpen);
  searchSection.classList.toggle('is-open', isOpen);
  searchOverlay.setAttribute('aria-hidden', String(!isOpen));
  searchSection.setAttribute('aria-hidden', String(!isOpen));
  document.documentElement.classList.toggle('overflow-hidden', isOpen);
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(value = '') {
  return String(value).toLowerCase().trim();
}

function tokenize(query = '') {
  return normalize(query).split(/\s+/).filter(Boolean);
}

function highlightText(value, terms) {
  let html = escapeHtml(value);
  terms.forEach((term) => {
    if (!term) return;
    const pattern = new RegExp(escapeRegExp(term), 'gi');
    html = html.replace(pattern, (match) => `<mark class="rounded bg-yellow-200 px-1 text-gray-900">${match}</mark>`);
  });
  return html;
}

function extractSnippet(page, terms) {
  const sources = [page.summary, page.content].filter(Boolean);
  if (!sources.length) return '';

  for (const source of sources) {
    const sourceNormalized = normalize(source);
    let matchIndex = -1;

    for (const term of terms) {
      const index = sourceNormalized.indexOf(term);
      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
      }
    }

    if (matchIndex !== -1) {
      const start = Math.max(0, matchIndex - 48);
      const end = Math.min(source.length, matchIndex + 112);
      const snippet = source.slice(start, end).trim();
      return `${start > 0 ? '…' : ''}${snippet}${end < source.length ? '…' : ''}`;
    }
  }

  const fallback = sources[0].trim();
  return fallback.length > 160 ? `${fallback.slice(0, 160)}…` : fallback;
}

function getSearchableText(page) {
  return [
    page.title,
    page.summary,
    page.content,
    page.sectionTitle,
    page.section,
    ...(page.categories || []),
    ...(page.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function rankPage(page, terms) {
  const haystack = getSearchableText(page);
  if (!terms.every((term) => haystack.includes(term))) {
    return 0;
  }

  const title = normalize(page.title);
  const summary = normalize(page.summary);
  const content = normalize(page.content);
  const section = normalize(page.sectionTitle || page.section);
  const categories = normalize((page.categories || []).join(' '));
  const tags = normalize((page.tags || []).join(' '));

  return terms.reduce((score, term) => {
    if (title.includes(term)) score += title.startsWith(term) ? 16 : 10;
    if (summary.includes(term)) score += 6;
    if (section.includes(term)) score += 4;
    if (categories.includes(term)) score += 4;
    if (tags.includes(term)) score += 4;
    if (content.includes(term)) score += 2;
    return score;
  }, 0);
}

function renderResults(items, query) {
  searchResults.innerHTML = '';
  setError(false);

  const terms = tokenize(query);
  if (!terms.length) {
    setNoResults(false);
    return;
  }

  if (!items.length) {
    setNoResults(true);
    return;
  }

  setNoResults(false);
  searchResults.innerHTML = items
    .map(({ page }) => {
      const meta = [page.sectionTitle || page.section, page.date].filter(Boolean).join(' · ');
      return `
        <div class="site-search__item ais-Hits-item mb-4 rounded-2xl p-4">
          <a href="${escapeHtml(page.permalink)}" class="site-search__link flex flex-col justify-around space-y-2">
            <p class="site-search__title text-lg font-semibold">${highlightText(page.title || '', terms)}</p>
            <p class="site-search__meta text-sm">${escapeHtml(meta)}</p>
            <p class="site-search__snippet text-sm leading-7">${highlightText(extractSnippet(page, terms), terms)}</p>
          </a>
        </div>
      `;
    })
    .join('');
}

function search(query) {
  const terms = tokenize(query);
  if (!terms.length) {
    renderResults([], '');
    return;
  }

  const results = searchIndex
    .map((page) => ({ page, score: rankPage(page, terms) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.page.lastmod || '').localeCompare(left.page.lastmod || '');
    })
    .slice(0, Number(params.maxResults || 20));

  renderResults(results, query);
}

async function loadIndex() {
  if (!indexPromise) {
    setLoading(true);
    indexPromise = fetch(params.indexURL, {
      headers: {
        Accept: 'application/json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Search index request failed: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        searchIndex = Array.isArray(data) ? data : [];
        return searchIndex;
      })
      .catch((error) => {
        indexPromise = undefined;
        throw error;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return indexPromise;
}

async function ensureSearch(query) {
  try {
    await loadIndex();
    search(query);
  } catch (error) {
    console.error(error);
    setError(true);
  }
}

function openSearch() {
  setSearchOpen(true);
  setError(false);
  void ensureSearch(searchInput.value);
  window.requestAnimationFrame(() => {
    searchInput.focus();
  });
}

function closeSearch() {
  setSearchOpen(false);
  searchInput.blur();
}

if (isReady()) {
  searchIcon.addEventListener('click', (event) => {
    event.preventDefault();
    openSearch();
  });

  searchOverlay.addEventListener('click', () => {
    closeSearch();
  });

  if (searchClose) {
    searchClose.addEventListener('click', () => {
      closeSearch();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.code === 'Escape' && searchSection.classList.contains('is-open')) {
      closeSearch();
    }
  });

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    void ensureSearch(searchInput.value);
  });

  searchInput.addEventListener('input', () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      void ensureSearch(searchInput.value);
    }, 120);
  });
}
