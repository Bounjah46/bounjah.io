import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ADMIN_USER_ID, STORAGE_BUCKET } from './supabase-config.js';

const $ = (id) => document.getElementById(id);
const statusBox = $('status');
let supabase;
const configured = SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('PASTE_') && SUPABASE_PUBLISHABLE_KEY && !SUPABASE_PUBLISHABLE_KEY.includes('PASTE_') && ADMIN_USER_ID && !ADMIN_USER_ID.includes('PASTE_');
function message(text, error=false) { statusBox.textContent = text; statusBox.classList.toggle('error', error); }
function owner(user) { return !!user && user.id === ADMIN_USER_ID; }
function showManager(on) { $('login-panel').classList.toggle('hidden', on); $('manager').classList.toggle('hidden', !on); }
function escapeText(value) { return String(value ?? ''); }

if (!configured) {
  message('Setup needed: edit assets/supabase-config.js and replace the three placeholders with your Supabase project URL, publishable key, and your Auth user UUID. Then apply supabase-setup.sql.', true);
  $('login-form').addEventListener('submit', e => { e.preventDefault(); message('Configure assets/supabase-config.js and run the SQL setup first.', true); });
} else {
  supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  async function enforceOwner() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { showManager(false); return; }
    if (!owner(session.user)) { await supabase.auth.signOut(); showManager(false); message('Access denied: this account is not the configured owner.', true); return; }
    showManager(true); message('Signed in as the owner.'); await loadItems();
  }
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault(); message('Signing in…');
    const { data, error } = await supabase.auth.signInWithPassword({ email: $('email').value.trim(), password: $('password').value });
    if (error) return message(error.message, true);
    if (!owner(data.user)) { await supabase.auth.signOut(); return message('Access denied: this account is not the configured owner.', true); }
    $('password').value = ''; await enforceOwner();
  });
  $('signout').addEventListener('click', async () => { await supabase.auth.signOut(); showManager(false); message('You have signed out.'); });
  $('refresh').addEventListener('click', loadItems);
  supabase.auth.onAuthStateChange((_event, session) => { if (!session) showManager(false); });

  $('upload-form').addEventListener('submit', async e => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !owner(session.user)) { await supabase.auth.signOut(); showManager(false); return message('Please sign in with the owner account.', true); }
    const file = $('image-file').files[0];
    const title = $('image-title').value.trim();
    const description = $('image-description').value.trim();
    if (!file) return message('Choose an image file first.', true);
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) return message('Please choose a JPG, PNG, WebP, or GIF image.', true);
    if (file.size > 5 * 1024 * 1024) return message('This file is larger than 5 MB. Compress it and try again.', true);
    if (!title) return message('Enter a title.', true);
    const extension = ({'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'})[file.type];
    const path = `${crypto.randomUUID()}.${extension}`;
    message('Uploading image…');
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false, cacheControl: '3600' });
    if (uploadError) return message(`Upload failed: ${uploadError.message}`, true);
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    const { error: rowError } = await supabase.from('gallery_images').insert({ title, description, image_url: urlData.publicUrl, storage_path: path, published: $('publish-now').checked });
    if (rowError) {
      await supabase.storage.from(STORAGE_BUCKET).remove([path]);
      return message(`Image uploaded but metadata could not be saved; uploaded file cleanup was attempted. Error: ${rowError.message}`, true);
    }
    $('upload-form').reset(); $('publish-now').checked = true;
    message('Image uploaded successfully.'); await loadItems();
  });

  async function loadItems() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !owner(session.user)) return;
    const list = $('admin-list'); list.replaceChildren();
    const { data, error } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false });
    if (error) return message(`Could not load gallery: ${error.message}`, true);
    if (!data.length) { list.textContent = 'No images yet. Upload your first image above.'; return; }
    for (const item of data) {
      const article = document.createElement('article'); article.className = 'admin-item';
      const img = document.createElement('img'); img.src = item.image_url; img.alt = item.title; img.loading = 'lazy';
      const content = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = item.title;
      const desc = document.createElement('p'); desc.textContent = item.description || 'No description.';
      const meta = document.createElement('p'); meta.className = 'admin-small'; meta.textContent = item.published ? 'Published' : 'Unpublished';
      const actions = document.createElement('div'); actions.className = 'admin-actions';
      const edit = document.createElement('button'); edit.type='button'; edit.className='admin-btn secondary'; edit.textContent='Edit text'; edit.addEventListener('click', () => editItem(item));
      const publish = document.createElement('button'); publish.type='button'; publish.className='admin-btn secondary'; publish.textContent=item.published ? 'Unpublish' : 'Publish'; publish.addEventListener('click', () => togglePublish(item));
      const remove = document.createElement('button'); remove.type='button'; remove.className='admin-btn danger'; remove.textContent='Delete'; remove.addEventListener('click', () => deleteItem(item));
      actions.append(edit, publish, remove); content.append(title, desc, meta, actions); article.append(img, content); list.append(article);
    }
  }
  async function editItem(item) {
    const title = prompt('Image title:', item.title); if (title === null) return;
    const description = prompt('Image description:', item.description || ''); if (description === null) return;
    if (!title.trim()) return message('Title cannot be empty.', true);
    const { error } = await supabase.from('gallery_images').update({ title: title.trim(), description: description.trim() }).eq('id', item.id);
    if (error) return message(error.message, true); message('Image details updated.'); await loadItems();
  }
  async function togglePublish(item) {
    const { error } = await supabase.from('gallery_images').update({ published: !item.published }).eq('id', item.id);
    if (error) return message(error.message, true); message(item.published ? 'Image unpublished.' : 'Image published.'); await loadItems();
  }
  async function deleteItem(item) {
    if (!confirm(`Permanently delete “${item.title}” and its image file?`)) return;
    const { error: storageError } = await supabase.storage.from(STORAGE_BUCKET).remove([item.storage_path]);
    if (storageError) return message(`File deletion failed: ${storageError.message}. Gallery record was kept.`, true);
    const { error } = await supabase.from('gallery_images').delete().eq('id', item.id);
    if (error) return message(`File removed, but database row could not be deleted: ${error.message}`, true);
    message('Image deleted.'); await loadItems();
  }
  enforceOwner();
}
