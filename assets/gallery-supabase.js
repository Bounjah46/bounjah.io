import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const PER_PAGE = 24;

const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const status = document.getElementById('gallery-status');
const filters = [...document.querySelectorAll('[data-filter]')];

const pager = document.createElement('nav');
pager.className = 'pager';
pager.setAttribute('aria-label', 'Gallery pages');
grid.after(pager);

if (!SUPABASE_URL.startsWith('https://') || SUPABASE_URL.includes('PASTE_') || !SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('PASTE_')) {
  if (status) status.textContent = 'Gallery connection is not configured yet.';
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const pageFromUrl = () => Math.max(1, parseInt(new URLSearchParams(location.search).get('page'), 10) || 1);

  async function load(page, { scroll = false } = {}) {
    const from = (page - 1) * PER_PAGE;
    const to = from + PER_PAGE - 1;

    const { data, error, count } = await supabase
      .from('gallery_images')
      .select('id,title,description,image_url,created_at', { count: 'exact' })
      .eq('published', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    // Page number past the end (e.g. ?page=99): fall back to page 1
    if (error && page > 1) {
      setUrl(1, true);
      return load(1, { scroll });
    }
    if (error) {
      if (status) status.textContent = 'The gallery could not load right now.';
      return;
    }

    grid.replaceChildren();
    for (const item of data || []) {
      const card = document.createElement('article'); card.className = 'art gallery-card';
      const image = document.createElement('img'); image.src = item.image_url; image.alt = item.title; image.loading = 'lazy'; image.decoding = 'async';
      const body = document.createElement('div'); body.className = 'gallery-card-copy';
      const title = document.createElement('h2'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description || '';
      body.append(title, description); card.append(image, body); grid.append(card);
    }

    const total = count || 0;
    const pages = Math.max(1, Math.ceil(total / PER_PAGE));
    if (status) {
      status.textContent = total
        ? `Showing ${from + 1}–${from + (data?.length || 0)} of ${total} published image${total === 1 ? '' : 's'}.`
        : 'The archive is waiting for its first published images.';
    }
    if (empty) empty.hidden = total > 0;
    for (const button of filters) button.disabled = true;

    renderPager(page, pages);
    if (scroll) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setUrl(page, replace) {
    const url = new URL(location.href);
    if (page === 1) url.searchParams.delete('page'); else url.searchParams.set('page', page);
    history[replace ? 'replaceState' : 'pushState'](null, '', url);
  }

  function addButton(label, target, { disabled = false, current = false } = {}) {
    const b = document.createElement('button');
    b.textContent = label;
    b.disabled = disabled;
    if (current) b.setAttribute('aria-current', 'page');
    b.addEventListener('click', () => { setUrl(target, false); load(target, { scroll: true }); });
    pager.append(b);
  }

  function renderPager(page, pages) {
    pager.replaceChildren();
    if (pages <= 1) return;
    addButton('‹ Prev', page - 1, { disabled: page === 1 });
    let last = 0;
    for (let p = 1; p <= pages; p++) {
      if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
        if (last && p - last > 1) {
          const dots = document.createElement('span');
          dots.className = 'dots'; dots.textContent = '…';
          pager.append(dots);
        }
        addButton(String(p), p, { current: p === page });
        last = p;
      }
    }
    addButton('Next ›', page + 1, { disabled: page === pages });
  }

  window.addEventListener('popstate', () => load(pageFromUrl(), { scroll: true }));
  await load(pageFromUrl());
}
