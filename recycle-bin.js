import { db } from './supabase-app.js';

import {
  collection,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from './supabase-compat.js';


const $ = id => document.getElementById(id);

const esc = value =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

let rows = [];


/* =========================================
   COLLECTION NAME FIX / MAPPING
========================================= */

function getRestoreCollection(type) {

  const key = String(type || '')
    .trim()
    .toLowerCase();

  const map = {

    // Government Updates
    'update': 'updates',
    'updates': 'updates',
    'governmentupdate': 'updates',
    'governmentupdates': 'updates',
    'government-update': 'updates',
    'government-updates': 'updates',

    // Services
    'service': 'services',
    'services': 'services',

    // Categories
    'category': 'categories',
    'categories': 'categories',

    // Documents
    'document': 'documents',
    'documents': 'documents',

    // Document Checklists
    'documentchecklist': 'documentChecklists',
    'documentchecklists': 'documentChecklists',

    // Images
    'image': 'images',
    'images': 'images',

    // YouTube
    'youtube': 'youtube',
    'video': 'youtube',
    'videos': 'youtube',

    // Notifications
    'notification': 'notifications',
    'notifications': 'notifications',

    // Themes
    'theme': 'themes',
    'themes': 'themes',

    // Website CMS
    'sitesection': 'siteSections',
    'sitesections': 'siteSections',

    'pagecontent': 'pageContent',

    // Dynamic Pages
    'dynamicpage': 'dynamicPages',
    'dynamicpages': 'dynamicPages',

    'dynamicsection': 'dynamicSections',
    'dynamicsections': 'dynamicSections',

    // Extra Menu
    'menuitem': 'menuItems',
    'menuitems': 'menuItems',

    // Admin Editor logical items
    'adminmenu': 'settings/adminEditor',
    'adminpage': 'settings/adminEditor',
    'admintheme': 'settings/adminEditor'
  };

  return map[key] || type;
}


/* =========================================
   CLEAN DATABASE DATA
========================================= */

function clean(value) {

  if (Array.isArray(value)) {
    return value
      .filter(item => item !== undefined)
      .map(clean);
  }

  if (
    value &&
    typeof value === 'object'
  ) {

    // Database timestamp ko as-is rakho
    if (
      typeof value.toDate === 'function'
    ) {
      return value;
    }

    const output = {};

    for (
      const [key, item]
      of Object.entries(value)
    ) {

      if (
        item !== undefined &&
        key !== 'id'
      ) {
        output[key] = clean(item);
      }

    }

    return output;
  }

  return value;
}


/* =========================================
   RENDER RECYCLE BIN
========================================= */

function render() {

  const box = $('recycleList');

  if (!box) return;


  const query =
    String(
      $('recycleSearch')?.value || ''
    ).toLowerCase();


  const filter =
    $('recycleFilter')?.value ||
    'all';


  const list = rows.filter(item => {

    const filterMatch =
      filter === 'all' ||
      item.type === filter;

    const searchText =
      JSON.stringify(
        item.data || {}
      ).toLowerCase();

    const searchMatch =
      !query ||
      searchText.includes(query) ||
      String(item.type || '')
        .toLowerCase()
        .includes(query);

    return (
      filterMatch &&
      searchMatch
    );
  });


  if (!list.length) {

    box.innerHTML = `
      <div class="empty-state">
        Recycle Bin empty.
      </div>
    `;

    return;
  }


  box.innerHTML = list
    .map(item => {

      const title =
        item.data?.name ||
        item.data?.title ||
        item.data?.serviceName ||
        item.data?.heading ||
        item.type ||
        'Item';

      return `

        <article class="content-card">

          <span class="status-badge draft">
            Deleted
          </span>

          <h3>
            ${esc(title)}
          </h3>

          <p>
            Type:
            <strong>
              ${esc(item.type || '')}
            </strong>
          </p>

          <small>
            Restore to:
            ${esc(
              getRestoreCollection(
                item.type
              )
            )}
          </small>

          <div class="card-actions">

            <button
              class="action-btn edit"
              data-r="${item.id}">
              ↩ Restore
            </button>

            <button
              class="action-btn delete"
              data-d="${item.id}">
              🗑 Permanent Delete
            </button>

          </div>

        </article>

      `;
    })
    .join('');
}


/* =========================================
   RESTORE
========================================= */

async function restore(id) {

  const item =
    rows.find(
      row => row.id === id
    );

  if (!item) {
    throw new Error(
      'Recycle Bin item not found.'
    );
  }


  if (!item.sourceId) {
    throw new Error(
      'Original document ID missing.'
    );
  }


  if (!item.type) {
    throw new Error(
      'Original collection type missing.'
    );
  }


  // Admin Editor items settings/adminEditor document ke andar stored hote hain.
  if (['adminMenu', 'adminPage', 'adminTheme'].includes(item.type)) {
    const ref = doc(db, 'settings', 'adminEditor');
    const snap = await getDoc(ref);
    const state = snap.exists() ? snap.data() : {};
    state.menu = state.menu || {};
    state.pageOverrides = state.pageOverrides || {};
    state.customMenus = Array.isArray(state.customMenus) ? state.customMenus : [];
    state.customPages = Array.isArray(state.customPages) ? state.customPages : [];
    state.themes = Array.isArray(state.themes) ? state.themes : [];
    const d = item.data || {};
    if (item.type === 'adminMenu') {
      if (d.kind === 'fixed') state.menu[d.key || item.sourceId] = {...(d.config || {}), visible:true};
      else if (d.menu && !state.customMenus.some(x => x.id === d.menu.id)) state.customMenus.push({...d.menu, visible:true});
    }
    if (item.type === 'adminPage') {
      if (d.kind === 'fixed') {
        const key=d.key || item.sourceId;
        state.pageOverrides[key] = {...(state.pageOverrides[key]||{}), ...(d.page||{}), deleted:false, visible:true};
        state.menu[key] = {...(d.menu||state.menu[key]||{}), visible:true};
      } else if (d.page && !state.customPages.some(x => x.id === d.page.id)) state.customPages.push({...d.page, visible:true});
    }
    if (item.type === 'adminTheme' && d.theme) state.themes.push(d.theme);
    state.updatedAt = serverTimestamp();
    await setDoc(ref, state, {merge:false});
    await deleteDoc(doc(db, 'recycleBin', id));
    alert('✅ Admin item restored successfully');
    return;
  }

  const targetCollection =
    getRestoreCollection(
      item.type
    );


  const restoredData =
    clean(
      item.data || {}
    );


  restoredData.restoredAt =
    serverTimestamp();


  console.log(
    'Restoring:',
    {
      recycleId: id,
      originalType: item.type,
      targetCollection,
      sourceId: item.sourceId
    }
  );


  /*
    Original ID ke saath
    original database collection me
    document restore hoga.
  */

  await setDoc(
    doc(
      db,
      targetCollection,
      item.sourceId
    ),
    restoredData,
    {
      merge: false
    }
  );


  /*
    Original successfully restore hone
    ke BAAD hi Recycle Bin item delete.
  */

  await deleteDoc(
    doc(
      db,
      'recycleBin',
      id
    )
  );


  alert(
    '✅ Restored successfully'
  );
}


/* =========================================
   PERMANENT DELETE
========================================= */

async function remove(id) {

  const ok = confirm(
    'Permanently delete? Isko restore nahi kar sakte.'
  );

  if (!ok) return;


  await deleteDoc(
    doc(
      db,
      'recycleBin',
      id
    )
  );
}


/* =========================================
   EVENTS
========================================= */

$('recycleSearch')
  ?.addEventListener(
    'input',
    render
  );


$('recycleFilter')
  ?.addEventListener(
    'change',
    render
  );


$('recycleList')
  ?.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          'button'
        );

      if (!button) return;


      if (
        button.dataset.r
      ) {

        restore(
          button.dataset.r
        )
          .catch(error => {

            console.error(
              'Restore failed:',
              error
            );

            alert(
              'Restore failed: ' +
              error.message
            );

          });

      }


      if (
        button.dataset.d
      ) {

        remove(
          button.dataset.d
        )
          .catch(error => {

            console.error(
              'Permanent delete failed:',
              error
            );

            alert(
              error.message
            );

          });

      }

    }
  );


/* =========================================
   SUPABASE LIVE RECYCLE BIN
========================================= */

onSnapshot(

  collection(
    db,
    'recycleBin'
  ),

  snapshot => {

    rows =
      snapshot.docs.map(
        item => ({
          id: item.id,
          ...item.data()
        })
      );

    render();
  },

  error => {

    console.error(
      'Recycle Bin listener error:',
      error
    );

    if (
      $('recycleList')
    ) {

      $('recycleList').innerHTML = `
        <div class="empty-state">
          ${esc(error.message)}
        </div>
      `;

    }

  }

);
