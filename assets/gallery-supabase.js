import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';
const grid = document.getElementById('grid');
const empty = document.getElementById('empty');
const status = document.getElementById('gallery-status');
const filters = [...document.querySelectorAll('[data-filter]')];
if (!SUPABASE_URL.startsWith('https://') || SUPABASE_URL.includes('PASTE_') || !SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY.includes('PASTE_')) {
  if (status) status.textContent = 'Gallery connection is not configured yet.';
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await supabase.from('gallery_images').select('id,title,description,image_url,created_at').eq('published', true).order('created_at', { ascending: false });
  if (error) { if (status) status.textContent = 'The gallery could not load right now.'; }
  else {
    grid.replaceChildren();
    for (const item of data || []) {
      const card = document.createElement('article'); card.className = 'art gallery-card';
      const image = document.createElement('img'); image.src = item.image_url; image.alt = item.title; image.loading = 'lazy'; image.decoding = 'async';
      const body = document.createElement('div'); body.className = 'gallery-card-copy';
      const title = document.createElement('h2'); title.textContent = item.title;
      const description = document.createElement('p'); description.textContent = item.description || '';
      body.append(title, description); card.append(image, body); grid.append(card);
    }
    if (status) status.textContent = data?.length ? `${data.length} published image${data.length === 1 ? '' : 's'}.` : 'The archive is waiting for its first published images.';
    if (empty) empty.hidden = true;
    for (const button of filters) button.disabled = true;
  }
}
