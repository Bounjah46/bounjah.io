import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const grid = document.getElementById('grid');

if (grid && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PASTE_') && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_PUBLISHABLE_KEY.includes('PASTE_')) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  const { data, error } = await supabase
    .from('gallery_images')
    .select('id,title,image_url,created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(4);

  if (!error && data && data.length) {
    const cards = data.map((item, i) => {
      const a = document.createElement('a');
      a.className = 'art recent-card';
      a.href = 'gallery.html';

      const img = document.createElement('img');
      img.src = item.image_url;
      img.alt = item.title || '';
      img.decoding = 'async';

      const cap = document.createElement('span');
      cap.className = 'recent-cap';
      cap.textContent = String(i + 1).padStart(2, '0') + ' / ' + (item.title || '');

      a.append(img, cap);
      return a;
    });
    grid.replaceChildren(...cards);
  }
}
