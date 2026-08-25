import { moveToTrash } from './trash.js';
import { db } from './supabase-app.js';

import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from './supabase-compat.js';

const $ = id => document.getElementById(id);

const esc = v =>
  String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

let rows = [];
let editId = null;

const DEF = {
  name: 'Pink Blue Professional',
  primary: '#ec4899',
  secondary: '#2563eb',
  accent: '#f59e0b',
  pageBg: '#f8fafc',
  surface: '#ffffff',
  text: '#132238',
  menuBg: '#172554',
  menuText: '#ffffff',
  menuActive: '#ec4899',
  footer: '#07182d',
  buttonText: '#ffffff',
  border: '#e2e8f0',
  radius: '20',
  mode: 'light'
};

function set(id, value) {
  if ($(id)) {
    $(id).value = value ?? '';
  }
}

function msg(text, type = 'info') {
  const e = $('themeManagerMessage');

  if (e) {
    e.textContent = text;
    e.className = 'settings-message ' + type;
  }
}

function data() {
  return {
    name: $('themeName')?.value.trim() || 'Untitled Theme',
    primary: $('themePrimary2')?.value || DEF.primary,
    secondary: $('themeSecondary2')?.value || DEF.secondary,
    accent: $('themeAccent2')?.value || DEF.accent,
    pageBg: $('themePageBg')?.value || DEF.pageBg,
    surface: $('themeSurface')?.value || DEF.surface,
    text: $('themeText')?.value || DEF.text,
    menuBg: $('themeMenuBg')?.value || DEF.menuBg,
    menuText: $('themeMenuText')?.value || DEF.menuText,
    menuActive: $('themeMenuActive')?.value || DEF.menuActive,
    footer: $('themeFooter')?.value || DEF.footer,
    buttonText: $('themeButtonText')?.value || DEF.buttonText,
    border: $('themeBorder')?.value || DEF.border,
    radius: $('themeRadius')?.value || DEF.radius,
    mode: $('themeMode')?.value || DEF.mode
  };
}

function fill(x = DEF) {
  const fields = {
    themeName: 'name',
    themePrimary2: 'primary',
    themeSecondary2: 'secondary',
    themeAccent2: 'accent',
    themePageBg: 'pageBg',
    themeSurface: 'surface',
    themeText: 'text',
    themeMenuBg: 'menuBg',
    themeMenuText: 'menuText',
    themeMenuActive: 'menuActive',
    themeFooter: 'footer',
    themeButtonText: 'buttonText',
    themeBorder: 'border',
    themeRadius: 'radius',
    themeMode: 'mode'
  };

  for (const [id, key] of Object.entries(fields)) {
    set(id, x[key] ?? DEF[key]);
  }
}

async function apply(x) {
  await setDoc(
    doc(db, 'settings', 'activeTheme'),
    {
      ...x,
      updatedAt: serverTimestamp()
    },
    { merge: false }
  );

  await setDoc(
    doc(db, 'settings', 'website'),
    {
      themePrimary: x.primary,
      themeSecondary: x.secondary,
      menuColor: x.menuBg,
      cardRadius: String(x.radius),
      defaultMode: x.mode,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  msg('Theme applied to public website.', 'success');
}

async function save() {
  const d = data();

  const duplicate = rows.some(
    x =>
      String(x.name || '').toLowerCase() ===
      d.name.toLowerCase()
  );

  if (duplicate) {
    msg('Theme name already exists.', 'error');
    return;
  }

  await addDoc(
    collection(db, 'themes'),
    {
      ...d,
      createdAt: serverTimestamp()
    }
  );

  await apply(d);

  msg('New theme saved and applied.', 'success');
}

async function update() {
  if (!editId) {
    msg('Pehle saved theme ka Edit dabao.', 'error');
    return;
  }

  const d = data();

  await updateDoc(
    doc(db, 'themes', editId),
    {
      ...d,
      updatedAt: serverTimestamp()
    }
  );

  await apply(d);

  msg('Theme updated and applied.', 'success');
}

function edit(id) {
  const x = rows.find(v => v.id === id);

  if (!x) return;

  editId = id;

  fill(x);

  msg('Editing: ' + x.name, 'info');
}

async function remove(id) {
  const x = rows.find(v => v.id === id);

  if (!x) return;

  if (!confirm(`Move theme "${x.name}" to Recycle Bin?`)) {
    return;
  }

  await moveToTrash('themes', id, x);

  if (editId === id) {
    editId = null;
    fill(DEF);
  }
}

async function reset() {
  fill(DEF);

  editId = null;

  await apply(DEF);

  msg('Pink + Blue default restored.', 'success');
}

function render() {
  const box = $('themePresetList');

  if (!box) return;

  const query =
    String($('themeSearch')?.value || '')
      .toLowerCase();

  const filtered = rows.filter(x =>
    !query ||
    String(x.name || '')
      .toLowerCase()
      .includes(query)
  );

  if (!filtered.length) {
    box.innerHTML =
      '<div class="empty-state">' +
      'No saved themes. Pink + Blue default is available.' +
      '</div>';

    return;
  }

  box.innerHTML = filtered.map(x => `
    <article class="content-card">

      <div style="display:flex;gap:8px;margin-bottom:10px">

        <span style="
          width:28px;
          height:28px;
          border-radius:50%;
          background:${esc(x.primary)}
        "></span>

        <span style="
          width:28px;
          height:28px;
          border-radius:50%;
          background:${esc(x.secondary)}
        "></span>

        <span style="
          width:28px;
          height:28px;
          border-radius:50%;
          background:${esc(x.menuBg)}
        "></span>

      </div>

      <h3>${esc(x.name)}</h3>

      <small>
        ${esc(x.mode || 'light')}
        · Radius ${esc(x.radius || 20)}px
      </small>

      <div class="card-actions">

        <button
          class="action-btn edit"
          data-e="${x.id}">
          ✏ Edit
        </button>

        <button
          class="action-btn copy"
          data-a="${x.id}">
          ✅ Apply
        </button>

        <button
          class="action-btn delete"
          data-d="${x.id}">
          🗑 Delete
        </button>

      </div>

    </article>
  `).join('');
}

$('saveThemePreset')?.addEventListener(
  'click',
  () => {
    save().catch(error => {
      console.error('Theme save error:', error);
      msg(error.message, 'error');
    });
  }
);

$('updateThemePreset')?.addEventListener(
  'click',
  () => {
    update().catch(error => {
      console.error('Theme update error:', error);
      msg(error.message, 'error');
    });
  }
);

$('applyThemePreview')?.addEventListener(
  'click',
  () => {
    apply(data()).catch(error => {
      console.error('Theme apply error:', error);
      msg(error.message, 'error');
    });
  }
);

$('resetDefaultTheme')?.addEventListener(
  'click',
  () => {
    reset().catch(error => {
      console.error('Theme reset error:', error);
      msg(error.message, 'error');
    });
  }
);

$('themeSearch')?.addEventListener(
  'input',
  render
);

$('themePresetList')?.addEventListener(
  'click',
  e => {
    const button = e.target.closest('button');

    if (!button) return;

    if (button.dataset.e) {
      edit(button.dataset.e);
    }

    if (button.dataset.a) {
      const x = rows.find(
        v => v.id === button.dataset.a
      );

      if (x) {
        apply(x).catch(error => {
          console.error('Theme apply error:', error);
          msg(error.message, 'error');
        });
      }
    }

    if (button.dataset.d) {
      remove(button.dataset.d).catch(error => {
        console.error('Theme delete error:', error);
        msg(error.message, 'error');
      });
    }
  }
);

onSnapshot(
  collection(db, 'themes'),

  snapshot => {
    rows = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    render();
  },

  error => {
    console.error('Theme listener error:', error);
    msg(error.message, 'error');
  }
);

window.addEventListener(
  'DOMContentLoaded',
  () => {
    fill(DEF);
  }
);
