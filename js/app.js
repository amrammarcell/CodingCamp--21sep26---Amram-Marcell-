/**
 * Expense & Budget Visualizer — app.js
 * Req 6.3: Seluruh JavaScript berada dalam satu file ini
 *
 * Arsitektur: Event-Driven Single Source of Truth
 *   - transactions[] adalah satu-satunya sumber kebenaran (in-memory)
 *   - Setiap perubahan memicu saveTransactions() lalu renderAll()
 */

'use strict';

/* ==========================================================================
   1. DATA MODEL
   ========================================================================== */

/**
 * @typedef {object} Transaction
 * @property {string} id         - UUID unik (crypto.randomUUID() atau Date.now() fallback)
 * @property {string} name       - Nama item (1–100 karakter)
 * @property {number} amount     - Jumlah pengeluaran (angka positif > 0)
 * @property {string} category   - Nama kategori (Food / Transport / Fun / custom)
 * @property {string} date       - ISO 8601 string saat transaksi dibuat
 */

/**
 * @typedef {object} CategoryStat
 * @property {string} category   - Nama kategori
 * @property {number} amount     - Total amount kategori ini
 * @property {number} percentage - Persentase dari total (dibulatkan 1 desimal)
 */

/**
 * @typedef {object} FormData
 * @property {string} name       - Raw string dari input teks
 * @property {string} amount     - Raw string dari input numerik (belum dikonversi)
 * @property {string} category   - Nilai yang dipilih dari dropdown
 */


/* ==========================================================================
   2. VALIDATOR
   ========================================================================== */

/**
 * Memvalidasi data form sebelum transaksi dibuat.
 * @param {FormData} formData
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTransaction(formData) {
  const errors = [];

  // Validasi name: tidak boleh kosong atau hanya whitespace, maksimal 100 karakter
  const name = (formData.name || '').trim();
  if (name.length === 0) {
    errors.push('Nama item harus diisi.');
  } else if (name.length > 100) {
    errors.push('Nama item tidak boleh lebih dari 100 karakter.');
  }

  // Validasi amount: harus angka positif (> 0), bukan NaN, bukan Infinity
  const rawAmount = (formData.amount || '').trim();
  if (rawAmount.length === 0) {
    errors.push('Jumlah harus diisi.');
  } else {
    const amount = Number(rawAmount);
    if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
      errors.push('Jumlah harus berupa angka lebih dari 0.');
    }
  }

  // Validasi category: tidak boleh kosong atau belum dipilih
  const category = (formData.category || '').trim();
  if (category.length === 0) {
    errors.push('Pilih kategori.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}


/* ==========================================================================
   3. STORAGE MODULE
   ========================================================================== */

/** localStorage key untuk menyimpan transaksi */
const STORAGE_KEY = 'expense_transactions';

/**
 * Memuat transaksi dari localStorage.
 * @returns {Transaction[] | null} null jika storage tidak tersedia atau data korup
 */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    // Key tidak ada → kembalikan array kosong (bukan null)
    if (raw === null || raw === undefined) {
      return [];
    }
    const parsed = JSON.parse(raw);
    // Hasil parse bukan array → data korup
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch (e) {
    // JSON.parse throws, atau localStorage tidak tersedia
    return null;
  }
}

/**
 * Menyimpan transaksi ke localStorage.
 * @param {Transaction[]} transactions
 * @returns {{ success: boolean, error?: string }}
 */
function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    return { success: true };
  } catch (e) {
    // QuotaExceededError atau error lainnya
    const isQuotaError =
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    const message = isQuotaError
      ? 'Data gagal disimpan. Penyimpanan browser mungkin penuh.'
      : 'Data gagal disimpan. Terjadi kesalahan pada penyimpanan.';
    return { success: false, error: message };
  }
}


/* ==========================================================================
   4. CALCULATORS
   ========================================================================== */

/**
 * Menghitung total balance dari semua transaksi.
 * @param {Transaction[]} transactions
 * @returns {number} 0 jika array kosong
 */
function calculateBalance(transactions) {
  if (!transactions || transactions.length === 0) return 0;
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Menghitung distribusi per kategori beserta persentase.
 * @param {Transaction[]} transactions
 * @returns {CategoryStat[]}
 */
function calculateCategoryStats(transactions) {
  if (!transactions || transactions.length === 0) return [];

  // Group amounts by category
  const totals = {};
  for (const t of transactions) {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  }

  const totalAmount = Object.values(totals).reduce((sum, v) => sum + v, 0);

  return Object.entries(totals).map(([category, amount]) => ({
    category,
    amount,
    percentage: Math.round((amount / totalAmount) * 1000) / 10, // round to 1 decimal
  }));
}

/**
 * Menghasilkan N warna hex unik tanpa duplikat.
 * @param {number} count
 * @returns {string[]} array of hex color strings
 */
function generateUniqueColors(count) {
  /**
   * Convert HSL values to a hex color string.
   * @param {number} h - Hue [0, 360)
   * @param {number} s - Saturation [0, 100]
   * @param {number} l - Lightness [0, 100]
   * @returns {string} hex color e.g. '#e05c5c'
   */
  function hslToHex(h, s, l) {
    const sNorm = s / 100;
    const lNorm = l / 100;
    const a = sNorm * Math.min(lNorm, 1 - lNorm);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = lNorm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  const colors = [];
  for (let i = 0; i < count; i++) {
    const hue = (i * 360) / count;
    colors.push(hslToHex(hue, 65, 55));
  }
  return colors;
}


/* ==========================================================================
   5. SORT
   ========================================================================== */

/**
 * Mengurutkan array transaksi berdasarkan mode.
 * Tidak mengubah (mutasi) array asli — mengembalikan array baru.
 * @param {Transaction[]} transactions
 * @param {string} mode - 'date-desc' | 'amount-asc' | 'amount-desc' | 'category-asc'
 * @returns {Transaction[]}
 */
function sortTransactions(transactions, mode) {
  const arr = transactions.slice(); // never mutate original
  switch (mode) {
    case 'date-desc':
      return arr.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    case 'amount-asc':
      return arr.sort((a, b) => a.amount - b.amount);
    case 'amount-desc':
      return arr.sort((a, b) => b.amount - a.amount);
    case 'category-asc':
      return arr.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return arr;
  }
}


/* ==========================================================================
   6. RENDERERS
   ========================================================================== */

/**
 * Renderer — Balance Display
 * Menghitung total dan memperbarui DOM element Balance_Display.
 * @param {Transaction[]} transactions
 */
function renderBalance(transactions) {
  const total = calculateBalance(transactions);
  const formatted = 'Rp\u00a0' + total.toLocaleString('id-ID');
  const el = document.getElementById('balance-amount');
  if (el) el.textContent = formatted;
}

/**
 * Renderer — Transaction List
 * Merender ulang seluruh daftar transaksi ke DOM.
 * @param {Transaction[]} transactions
 * @param {string} sortMode
 */
function renderTransactionList(transactions, sortMode) {
  const ul = document.getElementById('transaction-list');
  const emptyState = document.getElementById('empty-state');
  if (!ul || !emptyState) return;

  const sorted = sortTransactions(transactions, sortMode);

  if (sorted.length === 0) {
    emptyState.removeAttribute('hidden');
    ul.innerHTML = '';
    return;
  }

  emptyState.setAttribute('hidden', '');

  ul.innerHTML = sorted.map((t) => {
    const formattedAmount = 'Rp\u00a0' + t.amount.toLocaleString('id-ID');
    const formattedDate = new Date(t.date).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const categoryClass = 'category--' + t.category.toLowerCase();
    return `<li class="transaction-item" data-id="${t.id}">
  <div class="transaction-main">
    <span class="transaction-name">${escapeHtml(t.name)}</span>
    <span class="transaction-amount">${formattedAmount}</span>
  </div>
  <div class="transaction-meta">
    <span class="transaction-category ${categoryClass}">${escapeHtml(t.category)}</span>
    <span class="transaction-date">${formattedDate}</span>
  </div>
  <button
    class="btn btn-delete"
    data-id="${t.id}"
    aria-label="Hapus ${escapeHtml(t.name)}"
    type="button"
  >Hapus</button>
</li>`;
  }).join('');
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renderer — Chart
 * Merender pie chart via Chart.js. Tampilkan placeholder jika kosong.
 * @param {Transaction[]} transactions
 */
function renderChart(transactions) {
  const canvas = document.getElementById('expense-chart');
  const placeholder = document.getElementById('chart-placeholder');
  if (!canvas || !placeholder) return;

  if (!transactions || transactions.length === 0) {
    placeholder.removeAttribute('hidden');
    canvas.setAttribute('hidden', '');
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    return;
  }

  placeholder.setAttribute('hidden', '');
  canvas.removeAttribute('hidden');

  const stats = calculateCategoryStats(transactions);
  const colors = generateUniqueColors(stats.length);

  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  try {
    chartInstance = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: stats.map((s) => s.category),
        datasets: [{
          data: stats.map((s) => s.amount),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              font: { size: 13 },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const stat = stats[context.dataIndex];
                const amount = 'Rp\u00a0' + stat.amount.toLocaleString('id-ID');
                return ` ${stat.category}: ${amount} (${stat.percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (e) {
    console.error('Chart render error', e);
    placeholder.textContent = 'Grafik tidak tersedia.';
    placeholder.removeAttribute('hidden');
    canvas.setAttribute('hidden', '');
  }
}


/* ==========================================================================
   7. INPUT FORM HANDLER
   ========================================================================== */

/**
 * Menghilangkan pesan error pada form tanpa mereset field nilai.
 */
function clearFormErrors() {
  ['name-error', 'amount-error', 'category-error'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
  const msg = document.getElementById('form-message');
  if (msg) msg.textContent = '';
}

/**
 * Mengosongkan semua field form dan menghilangkan pesan error.
 */
function clearForm() {
  const form = document.getElementById('transaction-form');
  if (form) form.reset();
  clearFormErrors();
}

/**
 * Menampilkan pesan error per-field pada form.
 * @param {string[]} errors
 */
function showFormErrors(errors) {
  errors.forEach((error) => {
    if (error.includes('Nama')) {
      const el = document.getElementById('name-error');
      if (el) el.textContent = error;
    } else if (error.includes('Jumlah')) {
      const el = document.getElementById('amount-error');
      if (el) el.textContent = error;
    } else if (error.includes('kategori')) {
      const el = document.getElementById('category-error');
      if (el) el.textContent = error;
    } else {
      const el = document.getElementById('form-message');
      if (el) el.textContent = error;
    }
  });
}

/**
 * Menangani event submit form.
 * @param {Event} event
 */
function handleFormSubmit(event) {
  event.preventDefault();
  clearFormErrors(); // only clear errors, NOT the field values

  const name = (document.getElementById('item-name') || {}).value || '';
  const amount = (document.getElementById('item-amount') || {}).value || '';
  const category = (document.getElementById('item-category') || {}).value || '';

  const result = validateTransaction({ name, amount, category });
  if (!result.valid) {
    showFormErrors(result.errors);
    return;
  }
  addTransaction({ name, amount, category });
}


/* ==========================================================================
   8. APP CONTROLLER
   ========================================================================== */

// --- State global (single source of truth) ---
/** @type {Transaction[]} */
let transactions = [];

/** @type {string} */
let sortMode = 'date-desc';

/** @type {import('chart.js').Chart | null} */
let chartInstance = null;

/**
 * Menambahkan transaksi baru.
 * Jika save gagal → rollback. Jika berhasil → renderAll() + clearForm().
 * @param {FormData} formData
 */
function addTransaction(formData) {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : String(Date.now());

  const transaction = {
    id,
    name: formData.name.trim(),
    amount: parseFloat(formData.amount),
    category: formData.category,
    date: new Date().toISOString(),
  };

  transactions.push(transaction);

  const result = saveTransactions(transactions);
  if (!result.success) {
    transactions.pop(); // rollback
    const appMsg = document.getElementById('app-message');
    if (appMsg) appMsg.textContent = result.error || 'Data gagal disimpan.';
    return;
  }

  const appMsg = document.getElementById('app-message');
  if (appMsg) appMsg.textContent = '';
  renderAll();
  clearForm();
}

/**
 * Menghapus transaksi berdasarkan id setelah konfirmasi.
 * Jika save gagal → rollback.
 * @param {string} id
 */
function deleteTransaction(id) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index === -1) return;

  const name = transactions[index].name;
  if (!window.confirm('Hapus transaksi "' + name + '"?')) return;

  const removed = transactions.splice(index, 1)[0];

  const result = saveTransactions(transactions);
  if (!result.success) {
    transactions.splice(index, 0, removed); // rollback
    const appMsg = document.getElementById('app-message');
    if (appMsg) appMsg.textContent = result.error || 'Transaksi gagal dihapus. Silakan coba lagi.';
    renderAll();
    return;
  }

  const appMsg = document.getElementById('app-message');
  if (appMsg) appMsg.textContent = '';
  renderAll();
}

/**
 * Memanggil semua renderer secara independen dalam try-catch terpisah.
 * Kegagalan satu renderer tidak menghentikan renderer lainnya.
 */
function renderAll() {
  try { renderBalance(transactions); } catch (e) { console.error('Balance render error', e); }
  try { renderTransactionList(transactions, sortMode); } catch (e) { console.error('List render error', e); }
  try { renderChart(transactions); } catch (e) { console.error('Chart render error', e); }
}

/**
 * Mengubah mode sort dan merender ulang daftar transaksi.
 * @param {string} mode
 */
function handleSortChange(mode) {
  sortMode = mode;
  try { renderTransactionList(transactions, sortMode); } catch (e) { console.error('Sort render error', e); }
}

/**
 * Inisialisasi aplikasi saat DOMContentLoaded.
 * Load dari storage → populate transactions[] → renderAll().
 */
function initApp() {
  const loaded = loadTransactions();
  if (loaded === null) {
    const appMsg = document.getElementById('app-message');
    if (appMsg) appMsg.textContent = 'Data sebelumnya tidak valid dan telah direset.';
    transactions = [];
  } else {
    transactions = loaded;
  }

  renderAll();

  const form = document.getElementById('transaction-form');
  if (form) form.addEventListener('submit', handleFormSubmit);

  const list = document.getElementById('transaction-list');
  if (list) {
    list.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-id]');
      if (btn) deleteTransaction(btn.dataset.id);
    });
  }

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function (e) {
      handleSortChange(e.target.value);
    });
  }
}


/* ==========================================================================
   9. BROWSER RUNTIME
   ========================================================================== */

// No module exports needed — app runs directly in browser


/* ==========================================================================
   10. BOOTSTRAP
   ========================================================================== */

// Panggil initApp() saat DOM siap
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initApp);
}
