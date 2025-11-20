const apiBase = 'http://localhost:4000/api';
const apiOrigin = apiBase.replace(/\/api$/, '');
const navLinks = document.querySelectorAll('.nav-links a');
const ctaButtons = document.querySelectorAll('.cta-group button');
const views = document.querySelectorAll('.view');
const logoutBtn = document.getElementById('logoutBtn');
const navBrowseLink = document.querySelector('[data-section="browse"]');
const navMyItemsLink = document.querySelector('[data-section="my-items"]');
const navAuthLink = document.querySelector('[data-section="auth"]');
const navAdminLink = document.querySelector('[data-section="admin"]');
const authAlert = document.getElementById('authAlert');
const spinner = document.getElementById('globalSpinner');
const yearSpan = document.getElementById('year');
yearSpan.textContent = new Date().getFullYear();

let authToken = localStorage.getItem('campus_token');
let authUser = JSON.parse(localStorage.getItem('campus_user') || 'null');
const BROWSE_LOGIN_MESSAGE = 'Please login with your campus email to browse items.';
const MANAGE_ITEMS_MESSAGE = 'Please login with your campus email to manage items.';
const ADMIN_ONLY_MESSAGE = 'Admin access only.';
const PLACEHOLDER_IMG = 'https://via.placeholder.com/300x200?text=No+Image';
let spinnerCount = 0;

const resolveImageUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiOrigin}${normalized}`;
};

const showSection = (id) => {
  views.forEach((view) => view.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
  navLinks.forEach((link) => link.classList.toggle('active', link.dataset.section === id));
};

const showAuthAlert = (message) => {
  if (!authAlert) return;
  authAlert.textContent = message;
  authAlert.classList.remove('hidden');
};

const clearAuthAlert = () => {
  if (!authAlert) return;
  authAlert.textContent = '';
  authAlert.classList.add('hidden');
};

const requireBrowseAuth = () => {
  if (!authUser) {
    showAuthAlert(BROWSE_LOGIN_MESSAGE);
    showSection('auth');
    return false;
  }
  return true;
};

const setSpinnerVisible = (visible) => {
  if (!spinner) return;
  spinnerCount = Math.max(0, spinnerCount + (visible ? 1 : -1));
  spinner.classList.toggle('hidden', spinnerCount === 0);
};

const initRippleEffects = () => {
  document.querySelectorAll('.ripple').forEach((el) => {
    el.addEventListener('pointerdown', (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--ripple-x', `${event.clientX - rect.left}px`);
      el.style.setProperty('--ripple-y', `${event.clientY - rect.top}px`);
      el.classList.remove('is-animating');
      void el.offsetWidth;
      el.classList.add('is-animating');
    });
    el.addEventListener('animationend', () => el.classList.remove('is-animating'));
  });
};

[...navLinks, ...ctaButtons].forEach((el) =>
  el.addEventListener('click', (e) => {
    const { section } = e.currentTarget.dataset;
    if (!section) return;
    e.preventDefault();

    if (section === 'browse' && !requireBrowseAuth()) {
      return;
    }

    if (section === 'my-items' && !authUser) {
      showAuthAlert(MANAGE_ITEMS_MESSAGE);
      showSection('auth');
      return;
    }

    if (section === 'admin' && authUser?.role !== 'admin') {
      showAuthAlert(ADMIN_ONLY_MESSAGE);
      showSection('auth');
      return;
    }

    showSection(section);

    if (section === 'browse') {
      loadItems();
    } else if (section === 'my-items') {
      loadMyItems();
    } else if (section === 'admin') {
      loadAdminData();
    }
  }),
);

logoutBtn.addEventListener('click', () => {
  authToken = null;
  authUser = null;
  localStorage.removeItem('campus_token');
  localStorage.removeItem('campus_user');
  clearAuthAlert();
  updateUI();
  showSection('home');
});

const updateUI = () => {
  if (authUser) {
    logoutBtn.hidden = false;
    navAuthLink.textContent = 'Account';
    navBrowseLink.hidden = false;
    navMyItemsLink.hidden = authUser.role === 'admin';
    navAdminLink.hidden = authUser.role !== 'admin';
  } else {
    logoutBtn.hidden = true;
    navAuthLink.textContent = 'Login / Register';
    navBrowseLink.hidden = true;
    navMyItemsLink.hidden = true;
    navAdminLink.hidden = true;
  }
};

const apiFetch = async (path, options = {}) => {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  setSpinnerVisible(true);
  try {
    const response = await fetch(`${apiBase}${path}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Request failed');
    }
    return response.json().catch(() => ({}));
  } finally {
    setSpinnerVisible(false);
  }
};

// Authentication
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    name: document.getElementById('regName').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
  };
  try {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    authToken = data.token;
    authUser = data.user;
    localStorage.setItem('campus_token', authToken);
    localStorage.setItem('campus_user', JSON.stringify(authUser));
    updateUI();
    clearAuthAlert();
    showSection('my-items');
    document.getElementById('registerForm').reset();
    loadItems();
    loadMyItems();
  } catch (err) {
    showAuthAlert(err.message);
  }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    email: document.getElementById('loginEmail').value,
    password: document.getElementById('loginPassword').value,
  };
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    authToken = data.token;
    authUser = data.user;
    localStorage.setItem('campus_token', authToken);
    localStorage.setItem('campus_user', JSON.stringify(authUser));
    updateUI();
    clearAuthAlert();
    showSection('my-items');
    loadItems();
    loadMyItems();
  } catch (err) {
    showAuthAlert(err.message);
  }
});

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    email: document.getElementById('adminEmail').value,
    password: document.getElementById('adminPassword').value,
  };
  try {
    const data = await apiFetch('/auth/admin/login', { method: 'POST', body: JSON.stringify(payload) });
    authToken = data.token;
    authUser = data.user;
    localStorage.setItem('campus_token', authToken);
    localStorage.setItem('campus_user', JSON.stringify(authUser));
    updateUI();
    clearAuthAlert();
    showSection('admin');
    loadItems();
    loadAdminData();
  } catch (err) {
    showAuthAlert(err.message);
  }
});

// Items
const renderItems = (items = []) => {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const category = document.getElementById('categoryFilter').value;

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm) ||
      item.category.toLowerCase().includes(searchTerm);
    const matchesCategory = !category || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const grid = document.getElementById('itemsGrid');
  grid.innerHTML = '';

  if (!items.length) {
    grid.innerHTML = '<p class="muted">No items have been posted yet.</p>';
    return;
  }

  if (!filtered.length) {
    grid.innerHTML = '<p class="muted">No items match your search.</p>';
    return;
  }

  filtered.forEach((item) => {
    const imageSrc = resolveImageUrl(item.image_url) || PLACEHOLDER_IMG;
    const card = document.createElement('div');
    card.className = 'card item-card';
    card.innerHTML = `
      <img src="${imageSrc}" alt="${item.title}" onerror="this.src='${PLACEHOLDER_IMG}'" />
      <h4>${item.title}</h4>
      <p class="muted">${item.category}</p>
      <p>${item.description}</p>
      <p class="price">₹${Number(item.price).toLocaleString()}</p>
      <small>Seller: ${item.owner?.name || 'Student'} · ${item.owner?.email || ''}</small>
      <button class="secondary" data-report="${item.id}">Report Listing</button>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('[data-report]').forEach((btn) =>
    btn.addEventListener('click', () => {
      if (!authUser) {
        alert('Login before reporting');
        return;
      }
      const reason = prompt('Why are you reporting this item?');
      if (reason) {
        submitReport(btn.dataset.report, reason);
      }
    }),
  );
};

const loadItems = async () => {
  if (!authUser) {
    window.marketItems = [];
    return;
  }
  try {
    const response = await apiFetch('/items/browse', { method: 'GET' });
    const items = Array.isArray(response) ? response : response.items || [];
    window.marketItems = items;
    renderItems(items);
  } catch (err) {
    showAuthAlert(err.message || BROWSE_LOGIN_MESSAGE);
    document.getElementById('itemsGrid').innerHTML =
      '<p class="muted">Unable to load items right now.</p>';
    console.error('loadItems error', err);
  }
};

document.getElementById('searchInput').addEventListener('input', () => renderItems(window.marketItems || []));
document.getElementById('categoryFilter').addEventListener('change', () =>
  renderItems(window.marketItems || []),
);

const loadMyItems = async () => {
  if (!authUser) {
    document.getElementById('myItemsList').innerHTML = '<p>Please login to view your items.</p>';
    return;
  }
  try {
    const data = await apiFetch('/items/mine', { method: 'GET' });
    const container = document.getElementById('myItemsList');
    container.innerHTML = '';
    if (!data.length) {
      container.innerHTML = '<p class="muted">You have not posted anything yet.</p>';
      return;
    }
    window.myItemsCache = {};
    data.forEach((item) => {
      window.myItemsCache[item.id] = item;
      const imageSrc = resolveImageUrl(item.image_url) || PLACEHOLDER_IMG;
      const div = document.createElement('div');
      div.className = 'my-item';
      div.innerHTML = `
        <div class="my-item-info">
          <img src="${imageSrc}" alt="${item.title}" onerror="this.src='${PLACEHOLDER_IMG}'" />
          <strong>${item.title}</strong>
          <p class="muted">${item.category} · ₹${Number(item.price).toLocaleString()}</p>
        </div>
        <div class="my-item-actions">
          <button class="secondary" data-edit="${item.id}">Edit</button>
          <button class="ghost" data-delete="${item.id}">Delete</button>
        </div>
      `;
      container.appendChild(div);
    });

    container.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => {
        const item = window.myItemsCache[btn.dataset.edit];
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemImageUrl').value = item.image_url || '';
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemPrice').value = item.price;
        document.getElementById('itemDescription').value = item.description;
        showSection('my-items');
      }),
    );

    container.querySelectorAll('[data-delete]').forEach((btn) =>
      btn.addEventListener('click', async () => {
        if (confirm('Delete this item?')) {
          try {
            await apiFetch(`/items/${btn.dataset.delete}`, { method: 'DELETE' });
            loadMyItems();
            loadItems();
          } catch (err) {
            alert(err.message);
          }
        }
      }),
    );
  } catch (err) {
    alert(err.message);
  }
};

document.getElementById('resetItemBtn').addEventListener('click', () => {
  document.getElementById('itemForm').reset();
  document.getElementById('itemId').value = '';
  document.getElementById('itemImageUrl').value = '';
});

document.getElementById('itemForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!authUser) {
    alert('Please login first.');
    return;
  }

  const formData = new FormData();
  formData.append('title', document.getElementById('itemTitle').value);
  formData.append('category', document.getElementById('itemCategory').value);
  formData.append('price', document.getElementById('itemPrice').value);
  formData.append('description', document.getElementById('itemDescription').value);
  const existingImage = document.getElementById('itemImageUrl').value;
  if (existingImage) {
    formData.append('image_url', existingImage);
  }
  const file = document.getElementById('itemImage').files[0];
  if (file) {
    formData.append('image', file);
  }

  const itemId = document.getElementById('itemId').value;
  const method = itemId ? 'PUT' : 'POST';
  const path = itemId ? `/items/${itemId}` : '/items';
  try {
    await apiFetch(path, { method, body: formData });
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemImageUrl').value = '';
    loadMyItems();
    loadItems();
  } catch (err) {
    alert(err.message);
  }
});

const submitReport = async (itemId, reason) => {
  try {
    await apiFetch('/reports', { method: 'POST', body: JSON.stringify({ item_id: itemId, reason }) });
    alert('Report submitted. Admins will review it soon.');
  } catch (err) {
    alert(err.message);
  }
};

// Admin data
const loadAdminData = async () => {
  if (authUser?.role !== 'admin') return;
  try {
    const [users, items, reports] = await Promise.all([
      apiFetch('/admin/users', { method: 'GET' }),
      apiFetch('/admin/items', { method: 'GET' }),
      apiFetch('/admin/reports', { method: 'GET' }),
    ]);
    renderAdminUsers(users);
    renderAdminItems(items);
    renderAdminReports(reports);
  } catch (err) {
    alert(err.message);
  }
};

const renderAdminUsers = (users) => {
  const tbody = document.getElementById('adminUsers');
  tbody.innerHTML = users
    .map(
      (user) => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
          <button class="ghost" data-remove-user="${user.id}">Remove</button>
        </td>
      </tr>`,
    )
    .join('');

  tbody.querySelectorAll('[data-remove-user]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (confirm('Delete this user?')) {
        try {
          await apiFetch(`/admin/users/${btn.dataset.removeUser}`, { method: 'DELETE' });
          loadAdminData();
        } catch (err) {
          alert(err.message);
        }
      }
    }),
  );
};

const renderAdminItems = (items) => {
  const tbody = document.getElementById('adminItems');
  window.adminItemsCache = {};
  tbody.innerHTML = items
    .map(
      (item) => `
      <tr>
        <td>${item.title}</td>
        <td>${item.category}</td>
        <td>₹${Number(item.price).toLocaleString()}</td>
        <td>${item.owner_name} <br /><small>${item.owner_email}</small></td>
        <td>
          <button class="secondary" data-edit-item="${item.id}">Edit</button>
          <button class="ghost" data-delete-item="${item.id}">Delete</button>
        </td>
      </tr>`,
    )
    .join('');

  items.forEach((item) => {
    window.adminItemsCache[item.id] = item;
  });

  tbody.querySelectorAll('[data-edit-item]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const item = window.adminItemsCache[btn.dataset.editItem];
      document.getElementById('itemId').value = item.id;
      document.getElementById('itemImageUrl').value = item.image_url || '';
      document.getElementById('itemTitle').value = item.title;
      document.getElementById('itemCategory').value = item.category;
      document.getElementById('itemPrice').value = item.price;
      document.getElementById('itemDescription').value = item.description;
      showSection('my-items');
    }),
  );

  tbody.querySelectorAll('[data-delete-item]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      if (confirm('Delete this listing?')) {
        try {
          await apiFetch(`/admin/items/${btn.dataset.deleteItem}`, { method: 'DELETE' });
          loadAdminData();
          loadItems();
        } catch (err) {
          alert(err.message);
        }
      }
    }),
  );
};

const renderAdminReports = (reports) => {
  const tbody = document.getElementById('adminReports');
  tbody.innerHTML = reports
    .map(
      (report) => `
      <tr>
        <td>${report.item_title}</td>
        <td>${report.reporter_name}</td>
        <td>${report.reason}</td>
        <td><span class="badge ${report.status}">${report.status}</span></td>
        <td>
          <button class="secondary" data-resolve="${report.id}" ${report.status === 'resolved' ? 'disabled' : ''}>
            Resolve
          </button>
        </td>
      </tr>`,
    )
    .join('');

  tbody.querySelectorAll('[data-resolve]').forEach((btn) =>
    btn.addEventListener('click', async () => {
      try {
        await apiFetch(`/admin/reports/${btn.dataset.resolve}`, {
          method: 'PUT',
          body: JSON.stringify({ status: 'resolved' }),
        });
        loadAdminData();
      } catch (err) {
        alert(err.message);
      }
    }),
  );
};

// Initial load
updateUI();
initRippleEffects();
if (authUser) {
  loadItems();
  if (authUser.role === 'admin') {
    loadAdminData();
  } else {
    loadMyItems();
  }
}

