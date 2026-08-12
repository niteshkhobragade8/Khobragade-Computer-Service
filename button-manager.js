import { db } from './firebase-config.js';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';

const $ = id => document.getElementById(id);
const esc = v => String(v ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

let customDocs = [];
let nativeButtons = [];
let editId = null;
let editNativeKey = null;
let dynamicPages = [];
let adminEditor = { customPages: [] };
const isAdmin = !!document.getElementById('sidebarMenu');

const PUBLIC_FILES = [
  ['home', 'index.html'],
  ['services', 'services.html'],
  ['yojana', 'maharashtra.html'],
  ['divyang', 'divyang.html'],
  ['documents', 'documents.html'],
  ['contact', 'contact.html']
];

/* =========================================================
   PAGE KEYS
========================================================= */
function publicPageKey() {
  const f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const map = {
    'index.html': 'home',
    'services.html': 'services',
    'maharashtra.html': 'yojana',
    'divyang.html': 'divyang',
    'documents.html': 'documents',
    'contact.html': 'contact'
  };
  if (f === 'dynamic-page.html') {
    return 'dynamic:' + (new URLSearchParams(location.search).get('page') || '');
  }
  return map[f] || document.body.dataset.page || 'home';
}

function adminPageKey() {
  return document.querySelector('.page.active')?.id?.replace(/Page$/, '') ||
    localStorage.getItem('activePage') || 'dashboard';
}

/* =========================================================
   HELPERS
========================================================= */
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function cssEscapeId(id) {
  if (window.CSS?.escape) return CSS.escape(id);
  return String(id).replace(/([^a-zA-Z0-9_-])/g, '\\$1');
}

function selectorFor(el, root) {
  if (el.id) return '#' + cssEscapeId(el.id);

  const parts = [];
  let node = el;
  while (node && node !== root && node.nodeType === 1) {
    if (node.id) {
      parts.unshift('#' + cssEscapeId(node.id));
      return parts.join(' > ');
    }
    const tag = node.tagName.toLowerCase();
    const siblings = node.parentElement
      ? [...node.parentElement.children].filter(x => x.tagName === node.tagName)
      : [];
    const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : '';
    parts.unshift(tag + nth);
    node = node.parentElement;
  }

  if (root?.id) parts.unshift('#' + cssEscapeId(root.id));
  return parts.join(' > ');
}

function cleanText(el) {
  return String(el.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100) || 'Button';
}

function nativeDocId(nativeKey) {
  return 'native_' + hashString(nativeKey);
}

function makeNativeRecord({ area, page, selector, text, url = '', target = '_self', kind = 'action', group = false }) {
  const nativeKey = `${area}|${page}|${selector}`;
  return {
    id: nativeDocId(nativeKey),
    nativeKey,
    source: 'native',
    area,
    page,
    selector,
    text,
    originalText: text,
    url,
    originalUrl: url,
    target,
    originalTarget: target,
    kind,
    group,
    position: 'original',
    order: 50,
    visible: true,
    bgColor: '#2979ff',
    textColor: '#ffffff',
    radius: 12,
    fontSize: 15
  };
}

/* =========================================================
   DISCOVER EXISTING ADMIN BUTTONS
   Dashboard HTML me sab old Admin pages already DOM me hote hain.
========================================================= */
function discoverAdminNativeButtons() {
  const out = [];
  const pages = [...document.querySelectorAll('.page')];

  pages.forEach(pageEl => {
    const page = pageEl.id.replace(/Page$/, '');
    if (!page) return;

    pageEl.querySelectorAll('button, a.btn, a.action-link, a.text-button').forEach(el => {
      /* Button Manager khud ko manage karke self-break na kare. */
      if (el.closest('#aeButtonsPanel')) return;
      if (el.closest('.admin-editor-tabs')) return;
      if (el.closest('#aeMenuPanel')) return;
      if (el.closest('#aePagesPanel')) return;
      if (el.closest('#aeThemePanel')) return;
      if (el.classList.contains('managed-custom-button')) return;

      const selector = selectorFor(el, pageEl);
      if (!selector) return;
      const isLink = el.tagName === 'A';
      out.push(makeNativeRecord({
        area: 'admin',
        page,
        selector,
        text: cleanText(el),
        url: isLink ? (el.getAttribute('href') || '') : '',
        target: isLink ? (el.getAttribute('target') || '_self') : '_self',
        kind: isLink ? 'link' : 'action'
      }));
    });
  });

  /* Top-right ke existing controls (notification bell etc.) */
  document.querySelectorAll('.top-right button, .top-right a').forEach(el => {
    if (el.classList.contains('managed-custom-button')) return;
    const selector = selectorFor(el, document.body);
    if (!selector) return;
    const isLink = el.tagName === 'A';
    out.push(makeNativeRecord({
      area: 'admin',
      page: 'all',
      selector,
      text: cleanText(el),
      url: isLink ? (el.getAttribute('href') || '') : '',
      target: isLink ? (el.getAttribute('target') || '_self') : '_self',
      kind: isLink ? 'link' : 'action'
    }));
  });

  return out;
}

/* =========================================================
   DISCOVER EXISTING PUBLIC BUTTONS FROM ALL STATIC PAGES
========================================================= */
async function discoverPublicNativeButtons() {
  const out = [];

  for (const [page, file] of PUBLIC_FILES) {
    try {
      const res = await fetch(file, { cache: 'no-store' });
      if (!res.ok) continue;
      const html = await res.text();
      const parsed = new DOMParser().parseFromString(html, 'text/html');
      parsed.querySelectorAll('button, a.btn, a.nav-cta, a.floating-wa').forEach(el => {
        if (el.classList.contains('managed-custom-button')) return;
        const selector = selectorFor(el, parsed.body);
        if (!selector) return;
        const isLink = el.tagName === 'A';
        out.push(makeNativeRecord({
          area: 'public',
          page,
          selector,
          text: cleanText(el),
          url: isLink ? (el.getAttribute('href') || '') : '',
          target: isLink ? (el.getAttribute('target') || '_self') : '_self',
          kind: isLink ? 'link' : 'action'
        }));
      });
    } catch (e) {
      console.warn('Public button scan skipped:', file, e.message);
    }
  }

  /* JS se generate hone wale old button groups */
  [
    ['services', '.pro-card .btn.btn-wa', 'Service WhatsApp Apply Buttons'],
    ['yojana', '.pro-card .btn.btn-wa', 'Yojana WhatsApp Apply Buttons'],
    ['divyang', '.pro-card .btn.btn-wa', 'Divyang WhatsApp Apply Buttons'],
    ['documents', '.pro-card .btn.btn-wa', 'Documents WhatsApp Buttons'],
    ['documents', '.pro-card .btn.btn-blue', 'Open Document Buttons'],
    ['home', '.youtube-public-card .btn.btn-blue', 'YouTube Watch Buttons']
  ].forEach(([page, selector, text]) => {
    out.push(makeNativeRecord({
      area: 'public',
      page,
      selector,
      text,
      kind: 'group',
      group: true
    }));
  });

  return out;
}

function dedupeNative(rows) {
  const map = new Map();
  rows.forEach(x => {
    if (!map.has(x.nativeKey)) map.set(x.nativeKey, x);
  });
  return [...map.values()];
}

async function loadNativeCatalog() {
  if (!isAdmin) return;
  const adminRows = discoverAdminNativeButtons();
  const publicRows = await discoverPublicNativeButtons();
  nativeButtons = dedupeNative([...adminRows, ...publicRows]);
  renderList();
}

/* =========================================================
   FORM TARGET OPTIONS
========================================================= */
function adminTargets() {
  const fixed = [
    ['dashboard', 'Dashboard'],
    ['admineditor', 'Admin Editor'],
    ['updates', 'Government Updates'],
    ['services', 'Services'],
    ['categories', 'Categories'],
    ['images', 'Images'],
    ['documents', 'Documents'],
    ['youtube', 'YouTube'],
    ['notifications', 'Notifications'],
    ['analytics', 'Analytics'],
    ['seo', 'SEO Manager'],
    ['pages', 'Website Pages'],
    ['sitebuilder', 'Full Website CMS'],
    ['dynamicpages', 'Page & Menu Builder'],
    ['recyclebin', 'Recycle Bin'],
    ['themes', 'Theme Manager'],
    ['settings', 'Settings']
  ];
  return [
    ['all', 'All Admin Pages'],
    ...fixed,
    ...(adminEditor.customPages || []).map(x => ['custom_' + x.id, x.name || 'Custom Admin Page'])
  ];
}

function publicTargets() {
  return [
    ['all', 'All Website Pages'],
    ['home', 'Home'],
    ['services', 'Services'],
    ['yojana', 'Yojana'],
    ['divyang', 'Divyang'],
    ['documents', 'Documents'],
    ['contact', 'Contact'],
    ...dynamicPages.map(x => ['dynamic:' + (x.slug || ''), x.name || x.title || x.slug || 'Dynamic Page'])
  ];
}

function fillPageOptions() {
  const s = $('bmPage');
  if (!s) return;
  const rows = $('bmArea')?.value === 'admin' ? adminTargets() : publicTargets();
  const old = s.value;
  s.innerHTML = rows.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('');
  if (rows.some(x => x[0] === old)) s.value = old;
  fillPositionOptions();
}

function fillPositionOptions() {
  const s = $('bmPosition');
  if (!s) return;
  const admin = $('bmArea')?.value === 'admin';
  const rows = admin
    ? [
        ['original', 'Original Position'],
        ['topbar-right', 'Top Bar Right'],
        ['page-top-right', 'Page Top Right'],
        ['page-top-left', 'Page Top Left'],
        ['page-bottom', 'Page Bottom'],
        ['floating-right', 'Floating Right']
      ]
    : [
        ['original', 'Original Position'],
        ['header-right', 'Header / Menu Right'],
        ['page-top-right', 'Page Top'],
        ['after-hero', 'After Hero / Banner'],
        ['page-bottom', 'Before Footer'],
        ['floating-right', 'Floating Right']
      ];
  const old = s.value;
  s.innerHTML = rows.map(([v, n]) => `<option value="${v}">${n}</option>`).join('');
  if (rows.some(x => x[0] === old)) s.value = old;
}

/* =========================================================
   CUSTOM BUTTON RENDER
========================================================= */
function makeButton(x) {
  const a = document.createElement('a');
  a.className = 'managed-custom-button';
  a.href = x.url || '#';
  a.target = x.target || '_self';
  if (a.target === '_blank') a.rel = 'noopener';
  a.innerHTML = `${x.icon ? `<i class="${esc(x.icon)}"></i> ` : ''}${esc(x.text || 'Button')}`;
  a.style.setProperty('--bm-bg', x.bgColor || '#2979ff');
  a.style.setProperty('--bm-text', x.textColor || '#ffffff');
  a.style.setProperty('--bm-radius', (Number(x.radius) || 12) + 'px');
  a.style.setProperty('--bm-size', (Number(x.fontSize) || 15) + 'px');
  return a;
}

function host(cls, where) {
  let h = document.querySelector('.' + cls);
  if (h) return h;
  h = document.createElement('div');
  h.className = 'button-manager-host ' + cls;
  if (where?.parent && where.before) where.parent.insertBefore(h, where.before);
  else if (where?.parent) where.parent.appendChild(h);
  return h;
}

function customHost(area, pos) {
  if (area === 'admin') {
    const page = document.querySelector('.page.active');
    if (!page) return null;
    if (pos === 'topbar-right') return host('bm-admin-topbar', { parent: document.querySelector('.top-right') });
    if (pos === 'page-bottom') return host('bm-admin-bottom', { parent: page });
    const intro = page.querySelector('.page-intro');
    const h = host('bm-admin-page-top', { parent: page, before: intro?.nextSibling || page.firstChild });
    h.classList.toggle('bm-left', pos === 'page-top-left');
    return h;
  }

  const footer = document.getElementById('siteFooter');
  const hero = document.querySelector('.hero');
  if (pos === 'header-right') return host('bm-public-header', { parent: document.querySelector('.nav-links') || document.querySelector('header') || document.body });
  if (pos === 'after-hero') return host('bm-public-after-hero', { parent: hero?.parentNode || document.body, before: hero?.nextSibling || null });
  if (pos === 'page-bottom') return host('bm-public-bottom', { parent: footer?.parentNode || document.body, before: footer || null });
  return host('bm-public-top', { parent: (hero || document.querySelector('.global-search') || footer)?.parentNode || document.body, before: hero || document.querySelector('.global-search') || footer || null });
}

function clearRenderedCustom() {
  document.querySelectorAll('.button-manager-host,.managed-custom-button[data-bm-floating]').forEach(e => e.remove());
}

function renderCustomButtons() {
  clearRenderedCustom();
  const key = isAdmin ? adminPageKey() : publicPageKey();

  customDocs
    .filter(x => x.source !== 'native')
    .filter(x => x.visible !== false && x.area === (isAdmin ? 'admin' : 'public') && (x.page === 'all' || x.page === key))
    .sort((a, b) => Number(a.order || 50) - Number(b.order || 50))
    .forEach(x => {
      const a = makeButton(x);
      const pos = x.position || 'page-top-right';
      if (pos === 'floating-right') {
        a.dataset.bmFloating = '1';
        a.classList.add('bm-floating');
        document.body.appendChild(a);
        return;
      }
      if (pos === 'original') return; // custom button has no original DOM position
      customHost(isAdmin ? 'admin' : 'public', pos)?.appendChild(a);
    });
}

/* =========================================================
   NATIVE BUTTON OVERRIDES
========================================================= */
function snapshotOriginal(el) {
  if (el.dataset.bmNativeSnapshot === '1') return;
  el.dataset.bmNativeSnapshot = '1';
  el.dataset.bmOriginalDisplay = el.style.display || '';
  el.dataset.bmOriginalStyle = el.getAttribute('style') || '';
  el.dataset.bmOriginalHtml = el.innerHTML;
  if (el.tagName === 'A') {
    el.dataset.bmOriginalHref = el.getAttribute('href') || '';
    el.dataset.bmOriginalTarget = el.getAttribute('target') || '';
  }
}

function restoreNativeElements() {
  document.querySelectorAll('[data-bm-native-snapshot="1"]').forEach(el => {
    el.innerHTML = el.dataset.bmOriginalHtml ?? el.innerHTML;
    const style = el.dataset.bmOriginalStyle || '';
    if (style) el.setAttribute('style', style);
    else el.removeAttribute('style');
    if (el.tagName === 'A') {
      const href = el.dataset.bmOriginalHref ?? '';
      const target = el.dataset.bmOriginalTarget ?? '';
      if (href) el.setAttribute('href', href); else el.removeAttribute('href');
      if (target) el.setAttribute('target', target); else el.removeAttribute('target');
    }
    el.removeAttribute('data-bm-native-hidden');
  });
  document.querySelectorAll('[data-bm-native-proxy]').forEach(el => el.remove());
}

function styleNativeElement(el, x) {
  el.style.background = x.bgColor || '';
  el.style.color = x.textColor || '';
  el.style.borderRadius = (Number(x.radius) || 12) + 'px';
  el.style.fontSize = (Number(x.fontSize) || 15) + 'px';
}

function makeNativeProxy(x, originals) {
  const original = originals[0];
  if (!original) return null;

  if (x.kind === 'link' || original.tagName === 'A') {
    const a = makeButton(x);
    a.dataset.bmNativeProxy = x.nativeKey || '1';
    a.href = x.url || original.getAttribute('href') || '#';
    a.target = x.target || original.getAttribute('target') || '_self';
    if (a.target === '_blank') a.rel = 'noopener';
    return a;
  }

  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'managed-custom-button';
  b.dataset.bmNativeProxy = x.nativeKey || '1';
  b.innerHTML = `${x.icon ? `<i class="${esc(x.icon)}"></i> ` : ''}${esc(x.text || cleanText(original))}`;
  b.style.setProperty('--bm-bg', x.bgColor || '#2979ff');
  b.style.setProperty('--bm-text', x.textColor || '#ffffff');
  b.style.setProperty('--bm-radius', (Number(x.radius) || 12) + 'px');
  b.style.setProperty('--bm-size', (Number(x.fontSize) || 15) + 'px');
  b.addEventListener('click', () => original.click());
  return b;
}

function applyNativeOverride(x) {
  const currentArea = isAdmin ? 'admin' : 'public';
  const key = isAdmin ? adminPageKey() : publicPageKey();
  if (x.area !== currentArea) return;
  if (x.page !== 'all' && x.page !== key) return;
  if (!x.selector) return;

  let originals = [];
  try {
    originals = [...document.querySelectorAll(x.selector)];
  } catch (e) {
    console.warn('Invalid native button selector:', x.selector);
    return;
  }
  if (!originals.length) return;

  originals.forEach(snapshotOriginal);

  if (x.visible === false || x.deleted === true) {
    originals.forEach(el => {
      el.style.display = 'none';
      el.dataset.bmNativeHidden = '1';
    });
    return;
  }

  const pos = x.position || 'original';

  if (pos === 'original' || x.group === true || x.kind === 'group') {
    originals.forEach(el => {
      el.style.display = el.dataset.bmOriginalDisplay || '';
      if (x.text && x.text !== x.originalText && x.group !== true && x.kind !== 'group') {
        el.textContent = x.text;
      }
      if (el.tagName === 'A') {
        if (x.url) el.setAttribute('href', x.url);
        if (x.target) el.setAttribute('target', x.target);
      }
      styleNativeElement(el, x);
    });
    return;
  }

  /* Existing action ko safely move: original hidden, proxy click original ko call karega. */
  originals.forEach(el => {
    el.style.display = 'none';
    el.dataset.bmNativeHidden = '1';
  });

  const proxy = makeNativeProxy(x, originals);
  if (!proxy) return;
  if (pos === 'floating-right') {
    proxy.classList.add('bm-floating');
    proxy.dataset.bmNativeProxy = x.nativeKey || '1';
    document.body.appendChild(proxy);
  } else {
    customHost(currentArea, pos)?.appendChild(proxy);
  }
}

function renderNativeOverrides() {
  restoreNativeElements();
  customDocs.filter(x => x.source === 'native').forEach(applyNativeOverride);
}

function renderButtons() {
  renderCustomButtons();
  renderNativeOverrides();
}

/* =========================================================
   LIST: EXISTING + NEW
========================================================= */
function overrideFor(nativeKey) {
  return customDocs.find(x => x.source === 'native' && x.nativeKey === nativeKey);
}

function mergedNativeRows() {
  return nativeButtons.map(base => ({ ...base, ...(overrideFor(base.nativeKey) || {}), source: 'native' }));
}

function renderList() {
  const b = $('bmList');
  if (!b) return;

  const nativeRows = mergedNativeRows();
  const customRows = customDocs.filter(x => x.source !== 'native');
  const rows = [...nativeRows, ...customRows].sort((a, b) => {
    const aa = a.area || 'public';
    const bb = b.area || 'public';
    return aa.localeCompare(bb) || String(a.page || '').localeCompare(String(b.page || '')) || Number(a.order || 50) - Number(b.order || 50);
  });

  if (!rows.length) {
    b.innerHTML = '<div class="empty-state">Buttons loading / no buttons found.</div>';
    return;
  }

  b.innerHTML = rows.map(x => {
    const native = x.source === 'native';
    const status = x.deleted === true ? 'Deleted / Hidden' : (x.visible === false ? 'Hidden' : 'Visible');
    return `<article class="content-card">
      <div class="box-heading">
        <div><span class="box-kicker">${native ? 'EXISTING' : 'CUSTOM'} · ${esc((x.area || 'public').toUpperCase())}</span><h3>${esc(x.text || 'Button')}</h3></div>
        <span>${esc(status)}</span>
      </div>
      <p>${esc(x.page || 'all')} · ${esc(x.position || 'original')} · ${esc(x.target || '_self')}</p>
      <p class="field-help">${esc(x.url || (native && x.kind === 'action' ? 'Original action/function preserved' : '#'))}</p>
      ${native ? `<p class="field-help">Old button · safe managed mode · core action delete nahi hota.</p>` : ''}
      <div class="card-actions">
        <button class="action-btn edit" data-bm-edit="${esc(native ? x.nativeKey : x.id)}" data-bm-native="${native ? '1' : '0'}">✏ Edit</button>
        ${native
          ? `<button class="action-btn delete" data-bm-safe-delete="${esc(x.nativeKey)}">🗑 Delete / Hide</button><button class="action-btn copy" data-bm-restore="${esc(x.nativeKey)}">↩ Restore Original</button>`
          : `<button class="action-btn delete" data-bm-delete="${esc(x.id)}">🗑 Delete</button>`}
      </div>
    </article>`;
  }).join('');
}

/* =========================================================
   FORM
========================================================= */
function setNativeMode(native = false, row = null) {
  if ($('bmArea')) $('bmArea').disabled = native;
  if ($('bmPage')) $('bmPage').disabled = native;
  if ($('bmUrl')) {
    $('bmUrl').disabled = native && row?.kind === 'action';
    $('bmUrl').placeholder = native && row?.kind === 'action'
      ? 'Original action/function preserved'
      : 'https://9637832490.online/';
  }
  if ($('bmMessage')) {
    $('bmMessage').textContent = native
      ? 'Existing button edit mode: Delete = safe Hide. Restore Original se purana button wapas.'
      : 'Button Manager ready.';
  }
}

function resetForm() {
  editId = null;
  editNativeKey = null;
  ['bmText', 'bmUrl'].forEach(id => { if ($(id)) $(id).value = ''; });
  if ($('bmIcon')) $('bmIcon').value = 'fa-solid fa-link';
  if ($('bmOrder')) $('bmOrder').value = '50';
  if ($('bmVisible')) $('bmVisible').value = 'true';
  if ($('bmTarget')) $('bmTarget').value = '_blank';
  if ($('bmBg')) $('bmBg').value = '#2979ff';
  if ($('bmTextColor')) $('bmTextColor').value = '#ffffff';
  if ($('bmRadius')) $('bmRadius').value = '12';
  if ($('bmFontSize')) $('bmFontSize').value = '15';
  if ($('bmPosition')) $('bmPosition').value = 'page-top-right';
  if ($('bmSave')) $('bmSave').textContent = 'Add Button';
  setNativeMode(false);
}

function formData() {
  return {
    text: $('bmText').value.trim(),
    icon: $('bmIcon').value.trim(),
    url: $('bmUrl').value.trim(),
    area: $('bmArea').value,
    page: $('bmPage').value,
    position: $('bmPosition').value,
    target: $('bmTarget').value,
    order: Number($('bmOrder').value || 50),
    visible: $('bmVisible').value !== 'false',
    bgColor: $('bmBg').value,
    textColor: $('bmTextColor').value,
    radius: Number($('bmRadius').value || 12),
    fontSize: Number($('bmFontSize').value || 15),
    updatedAt: serverTimestamp()
  };
}

function loadRowIntoForm(x, native) {
  if (!x) return;
  editId = native ? null : x.id;
  editNativeKey = native ? x.nativeKey : null;

  $('bmText').value = x.text || '';
  $('bmIcon').value = x.icon || '';
  $('bmUrl').value = x.url || '';
  $('bmArea').value = x.area || 'public';
  fillPageOptions();
  $('bmPage').value = x.page || 'all';
  fillPositionOptions();
  $('bmPosition').value = x.position || (native ? 'original' : $('bmPosition').value);
  $('bmTarget').value = x.target || '_self';
  $('bmOrder').value = x.order ?? 50;
  $('bmVisible').value = String(x.visible !== false && x.deleted !== true);
  $('bmBg').value = x.bgColor || '#2979ff';
  $('bmTextColor').value = x.textColor || '#ffffff';
  $('bmRadius').value = x.radius ?? 12;
  $('bmFontSize').value = x.fontSize ?? 15;
  $('bmSave').textContent = native ? 'Update Existing Button' : 'Update Button';
  setNativeMode(native, x);
  document.getElementById('bmPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* =========================================================
   EVENTS
========================================================= */
$('bmArea')?.addEventListener('change', fillPageOptions);
$('bmClear')?.addEventListener('click', resetForm);

$('bmSave')?.addEventListener('click', async () => {
  const d = formData();
  if (!d.text) return alert('Button Text required.');

  try {
    if (editNativeKey) {
      const base = nativeButtons.find(x => x.nativeKey === editNativeKey);
      if (!base) return alert('Existing button record not found. Refresh karke try karein.');

      const id = nativeDocId(editNativeKey);
      await setDoc(doc(db, 'customButtons', id), {
        ...base,
        ...d,
        source: 'native',
        nativeKey: editNativeKey,
        selector: base.selector,
        kind: base.kind,
        group: base.group === true,
        originalText: base.originalText,
        originalUrl: base.originalUrl,
        originalTarget: base.originalTarget,
        deleted: false,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } else if (editId) {
      await updateDoc(doc(db, 'customButtons', editId), d);
    } else {
      if (!d.url) return alert('New custom button ke liye Button Link / URL required.');
      await addDoc(collection(db, 'customButtons'), { ...d, source: 'custom', createdAt: serverTimestamp() });
    }

    resetForm();
    if ($('bmMessage')) $('bmMessage').textContent = 'Button saved / updated successfully.';
  } catch (e) {
    console.error(e);
    alert('Button save error: ' + e.message);
  }
});

$('bmList')?.addEventListener('click', async e => {
  const b = e.target.closest('button');
  if (!b) return;

  if (b.dataset.bmEdit) {
    const native = b.dataset.bmNative === '1';
    if (native) {
      const base = mergedNativeRows().find(x => x.nativeKey === b.dataset.bmEdit);
      loadRowIntoForm(base, true);
    } else {
      const x = customDocs.find(v => v.id === b.dataset.bmEdit && v.source !== 'native');
      loadRowIntoForm(x, false);
    }
    return;
  }

  if (b.dataset.bmSafeDelete) {
    if (!confirm('Existing button ko website/dashboard se Hide/Delete karna hai? Core function safe rahega aur Restore Original se wapas aa jayega.')) return;
    const base = nativeButtons.find(x => x.nativeKey === b.dataset.bmSafeDelete);
    if (!base) return;
    try {
      await setDoc(doc(db, 'customButtons', nativeDocId(base.nativeKey)), {
        ...base,
        source: 'native',
        visible: false,
        deleted: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      alert('Delete/Hide error: ' + err.message);
    }
    return;
  }

  if (b.dataset.bmRestore) {
    const key = b.dataset.bmRestore;
    try {
      const existing = customDocs.find(x => x.source === 'native' && x.nativeKey === key);
      if (existing) await deleteDoc(doc(db, 'customButtons', existing.id));
      if ($('bmMessage')) $('bmMessage').textContent = 'Original button restored.';
    } catch (err) {
      alert('Restore error: ' + err.message);
    }
    return;
  }

  if (b.dataset.bmDelete) {
    if (!confirm('Custom button delete karna hai?')) return;
    try {
      await deleteDoc(doc(db, 'customButtons', b.dataset.bmDelete));
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  }
});

/* =========================================================
   FIRESTORE + LIVE RENDER
========================================================= */
onSnapshot(
  collection(db, 'customButtons'),
  s => {
    customDocs = s.docs.map(d => ({ id: d.id, ...d.data() }));
    renderList();
    renderButtons();
  },
  e => console.error('Button Manager error:', e)
);

if (isAdmin) {
  onSnapshot(collection(db, 'dynamicPages'), s => {
    dynamicPages = s.docs.map(d => ({ id: d.id, ...d.data() }));
    fillPageOptions();
  });

  onSnapshot(doc(db, 'settings', 'adminEditor'), s => {
    adminEditor = s.exists() ? s.data() : { customPages: [] };
    fillPageOptions();
    setTimeout(renderButtons, 0);
  });

  /* Page switch hone par managed buttons re-apply. */
  new MutationObserver(() => setTimeout(renderButtons, 0))
    .observe(document.querySelector('.main-content') || document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['class']
    });

  fillPageOptions();
  loadNativeCatalog();
}

/* Public pages par JS-generated service cards baad me aate hain, isliye DOM changes par native group override re-apply. */
if (!isAdmin) {
  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(renderNativeOverrides, 80);
  }).observe(document.body, { childList: true, subtree: true });
}

window.refreshManagedButtons = renderButtons;
