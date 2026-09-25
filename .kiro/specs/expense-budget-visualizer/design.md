# Design Document

## Expense & Budget Visualizer

---

## Overview

Expense & Budget Visualizer adalah mobile-friendly web app berbasis klien yang memungkinkan pengguna mencatat, menampilkan, dan memvisualisasikan pengeluaran harian. Aplikasi dibangun sepenuhnya dengan HTML, CSS, dan Vanilla JavaScript — tanpa framework, tanpa backend, tanpa build step. Semua data disimpan di browser Local Storage sehingga persisten antar sesi tanpa memerlukan server.

Aplikasi terdiri dari empat komponen utama yang berinteraksi satu sama lain:
- **Input Form** — entri transaksi baru
- **Balance Display** — total pengeluaran real-time
- **Transaction List** — riwayat scrollable, newest-first
- **Chart** — pie chart distribusi per kategori via Chart.js

Karena tidak ada backend, seluruh logika (validasi, kalkulasi, persistensi, rendering) berjalan di sisi klien. Arsitektur mengikuti pola **event-driven dengan satu sumber kebenaran (single source of truth)**: array transaksi di memori selalu menjadi acuan, dan setiap perubahan pada array tersebut memicu re-render semua komponen UI sekaligus.

---

## Architecture

### Pola Arsitektur: Event-Driven Single Source of Truth

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Input Form  │  │   Balance    │  │     Chart     │  │
│  │  (UI Layer)  │  │   Display   │  │  (Chart.js)   │  │
│  └──────┬───────┘  └──────▲───────┘  └───────▲───────┘  │
│         │ submit           │                  │          │
│         ▼                  │ re-render        │          │
│  ┌──────────────────────────────────────────────────┐    │
│  │            App Controller (app.js)               │    │
│  │   - transactions[] (in-memory source of truth)   │    │
│  │   - addTransaction()                             │    │
│  │   - deleteTransaction()                          │    │
│  │   - renderAll()                                  │    │
│  └──────┬───────────────────────────────────▲───────┘    │
│         │ read/write                         │ load       │
│         ▼                                   │            │
│  ┌──────────────────────────────────────────────────┐    │
│  │           Storage Module (localStorage)          │    │
│  └──────────────────────────────────────────────────┘    │
│         │                                                 │
│         ▼                                                 │
│  ┌──────────────────────────────────────────────────┐    │
│  │           Transaction List (UI Layer)            │    │
│  │   - renders dari transactions[]                  │    │
│  │   - delete button per item                       │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Alur data utama:**
1. Pengguna mengisi Input Form → submit
2. Validator memvalidasi input
3. Jika valid: `addTransaction()` dipanggil → update `transactions[]` → simpan ke Storage → `renderAll()`
4. `renderAll()` memanggil ulang semua renderer: Balance, Chart, Transaction List
5. Saat halaman dimuat: Storage dibaca → `transactions[]` diisi → `renderAll()`

### Struktur File

```
expense-budget-visualizer/
├── index.html          # Satu-satunya HTML, semua markup ada di sini
├── css/
│   └── style.css       # Seluruh styling (satu file, sesuai Req 6.2)
├── js/
│   └── app.js          # Seluruh JavaScript (satu file, sesuai Req 6.3)
└── README.md
```

> **Constraint penting (Req 6):** Seluruh logika JavaScript harus berada dalam satu file `js/app.js`. Ini berarti semua modul (Storage, Validator, Renderer, Controller) diimplementasikan sebagai fungsi/objek dalam satu file yang sama, bukan sebagai ES modules terpisah. Struktur diorganisasi menggunakan IIFE atau objek namespace untuk menjaga keterbacaan.

---

## Components and Interfaces

### 1. App Controller

Koordinator utama yang mengelola state dan memanggil semua operasi.

```javascript
// State global (single source of truth)
let transactions = [];       // Array<Transaction>
let sortMode = 'date-desc';  // 'date-desc' | 'amount-asc' | 'amount-desc' | 'category-asc'

// Operasi utama
function initApp()                          // Dipanggil saat DOMContentLoaded
function addTransaction(formData)           // Validasi → simpan → re-render
function deleteTransaction(id)              // Hapus dari array → simpan → re-render
function renderAll()                        // Panggil semua renderer sekaligus
function handleSortChange(mode)             // Ubah sortMode → re-render list
```

### 2. Validator

Memvalidasi data form sebelum transaksi dibuat. Mengembalikan objek hasil validasi.

```javascript
/**
 * @param {object} formData - { name: string, amount: string, category: string }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateTransaction(formData)

// Aturan validasi:
// - name: tidak boleh kosong, maksimal 100 karakter
// - amount: harus angka positif (> 0), bukan NaN, bukan Infinity
// - category: tidak boleh kosong / belum dipilih
```

### 3. Storage Module

Abstraksi atas `window.localStorage`. Menangani serialisasi, error pada kuota penuh, dan data korup.

```javascript
/**
 * @returns {Transaction[] | null} - null jika storage tidak tersedia atau data korup
 */
function loadTransactions()

/**
 * @param {Transaction[]} transactions
 * @returns {{ success: boolean, error?: string }}
 */
function saveTransactions(transactions)
```

### 4. Renderer — Balance

```javascript
/**
 * Menghitung ulang total dan memperbarui DOM element Balance_Display.
 * @param {Transaction[]} transactions
 */
function renderBalance(transactions)
```

### 5. Renderer — Transaction List

```javascript
/**
 * Merender ulang seluruh daftar transaksi ke DOM.
 * @param {Transaction[]} transactions
 * @param {string} sortMode
 */
function renderTransactionList(transactions, sortMode)

/**
 * Mengurutkan array transaksi berdasarkan mode.
 * @param {Transaction[]} transactions
 * @param {string} mode - 'date-desc' | 'amount-asc' | 'amount-desc' | 'category-asc'
 * @returns {Transaction[]} - array baru (tidak mutasi array asli)
 */
function sortTransactions(transactions, mode)
```

### 6. Renderer — Chart

```javascript
/**
 * Menghitung distribusi per kategori dan memperbarui Chart.js instance.
 * Jika transactions kosong, tampilkan placeholder teks.
 * @param {Transaction[]} transactions
 */
function renderChart(transactions)

/**
 * Menghitung persentase per kategori (dibulatkan 1 desimal).
 * @param {Transaction[]} transactions
 * @returns {CategoryStat[]} - [{ category, amount, percentage }]
 */
function calculateCategoryStats(transactions)

/**
 * Menghasilkan palet warna unik untuk sejumlah kategori.
 * @param {number} count
 * @returns {string[]} - array hex color strings
 */
function generateUniqueColors(count)
```

### 7. Input Form Handler

```javascript
/**
 * Menangani event submit form: ambil data → validasi → tambah transaksi atau tampilkan error.
 * @param {Event} event
 */
function handleFormSubmit(event)

/**
 * Mengosongkan semua field form dan menghilangkan pesan error.
 */
function clearForm()

/**
 * Menampilkan pesan error per-field pada form.
 * @param {string[]} errors
 */
function showFormErrors(errors)
```

---

## Data Models

### Transaction

Satu entri pengeluaran yang disimpan di memori dan di Local Storage.

```javascript
/**
 * @typedef {object} Transaction
 * @property {string} id         - UUID unik (crypto.randomUUID() atau Date.now() fallback)
 * @property {string} name       - Nama item (1–100 karakter)
 * @property {number} amount     - Jumlah pengeluaran (angka positif > 0)
 * @property {string} category   - Nama kategori (Food / Transport / Fun / custom)
 * @property {string} date       - ISO 8601 string saat transaksi dibuat (new Date().toISOString())
 */
```

**Contoh:**
```json
{
  "id": "1718000000000",
  "name": "Makan Siang",
  "amount": 25000,
  "category": "Food",
  "date": "2024-06-10T12:00:00.000Z"
}
```

### CategoryStat

Hasil kalkulasi distribusi per kategori untuk Chart.

```javascript
/**
 * @typedef {object} CategoryStat
 * @property {string} category   - Nama kategori
 * @property {number} amount     - Total amount kategori ini
 * @property {number} percentage - Persentase dari total (dibulatkan 1 desimal)
 */
```

### Local Storage Schema

```javascript
// Key: 'expense_transactions'
// Value: JSON.stringify(Transaction[])

// Contoh:
localStorage.setItem('expense_transactions', JSON.stringify([
  { id: "1", name: "Bensin", amount: 50000, category: "Transport", date: "2024-06-10T08:00:00.000Z" },
  { id: "2", name: "Kopi", amount: 15000, category: "Food", date: "2024-06-10T09:00:00.000Z" }
]));
```

**Validasi saat load:** data dianggap valid jika berhasil di-parse sebagai JSON dan hasilnya adalah array. Jika `JSON.parse` throws atau hasilnya bukan array, data dianggap korup dan aplikasi mulai dari array kosong sambil menampilkan pesan error.

### Form Data (input sebelum validasi)

```javascript
/**
 * @typedef {object} FormData
 * @property {string} name       - Raw string dari input teks
 * @property {string} amount     - Raw string dari input numerik (belum dikonversi)
 * @property {string} category   - Nilai yang dipilih dari dropdown
 */
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Validasi form menolak input tidak lengkap

*For any* kombinasi nilai field form di mana setidaknya satu field kosong (name kosong, amount kosong, atau category tidak dipilih), fungsi validator SHALL mengembalikan `valid: false` dan array `errors` yang menyebut field mana yang bermasalah, serta array transaksi tidak bertambah.

**Validates: Requirements 1.3, 1.4**

---

### Property 2: Amount harus angka positif

*For any* nilai amount yang bukan angka positif (termasuk string non-numerik, nol, negatif, NaN, Infinity, string kosong), fungsi validator SHALL mengembalikan `valid: false` dengan pesan error yang menyatakan jumlah harus berupa angka positif, dan transaksi tidak disimpan.

**Validates: Requirements 1.5**

---

### Property 3: Submit valid menambah transaksi dan mengosongkan form

*For any* data form yang valid (name non-kosong ≤100 char, amount > 0, category non-kosong), setelah `addTransaction()` dipanggil: panjang array `transactions` bertambah satu, balance yang ditampilkan sama dengan jumlah semua amount, dan semua field form menjadi kosong.

**Validates: Requirements 1.6, 3.2**

---

### Property 4: Daftar transaksi selalu terurut newest-first

*For any* koleksi transaksi dengan tanggal yang berbeda-beda, urutan tampilan di Transaction List (pada sort mode default `date-desc`) SHALL selalu descending berdasarkan field `date` — transaksi dengan `date` lebih baru muncul lebih dulu.

**Validates: Requirements 2.1**

---

### Property 5: Setiap item transaksi memiliki tombol hapus

*For any* koleksi transaksi non-kosong yang dirender, setiap elemen DOM item transaksi SHALL mengandung tepat satu elemen tombol hapus dengan atribut `data-id` yang sesuai dengan `id` transaksi tersebut.

**Validates: Requirements 2.3**

---

### Property 6: Konfirmasi hapus menghilangkan transaksi dan memperbarui balance

*For any* transaksi yang ada dalam array, setelah `deleteTransaction(id)` dipanggil: array `transactions` tidak lagi mengandung transaksi dengan id tersebut, balance yang ditampilkan sama dengan jumlah semua amount yang tersisa.

**Validates: Requirements 2.5, 3.3**

---

### Property 7: Balance sama dengan jumlah seluruh amount

*For any* koleksi transaksi (termasuk koleksi kosong), nilai yang ditampilkan oleh Balance_Display SHALL sama persis dengan hasil penjumlahan aritmetika semua nilai `amount` dalam array. Koleksi kosong menghasilkan nilai nol.

**Validates: Requirements 3.1, 3.4**

---

### Property 8: Persentase kategori menjumlah ke 100

*For any* koleksi transaksi non-kosong, hasil `calculateCategoryStats()` SHALL menghasilkan array di mana jumlah semua nilai `percentage` sama dengan 100 (dalam toleransi floating-point ±0.1), dan setiap `percentage` sama dengan `(category_amount / total_amount * 100)` yang dibulatkan ke satu desimal.

**Validates: Requirements 4.1, 4.7**

---

### Property 9: Warna kategori selalu unik

*For any* jumlah kategori N (N ≥ 1), fungsi `generateUniqueColors(N)` SHALL mengembalikan array dengan N warna di mana tidak ada dua warna yang identik (tidak ada duplikat).

**Validates: Requirements 4.6**

---

### Property 10: Storage round-trip menjaga integritas data

*For any* array transaksi yang disimpan dengan `saveTransactions()`, pemanggilan berikutnya pada `loadTransactions()` SHALL mengembalikan array yang secara struktural identik (semua id, name, amount, category, date sama persis).

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 11: Pengurutan amount menghasilkan urutan yang benar

*For any* koleksi transaksi, `sortTransactions(transactions, 'amount-asc')` SHALL menghasilkan array di mana setiap elemen ke-i memiliki `amount` ≤ elemen ke-(i+1). Sebaliknya, `sortTransactions(transactions, 'amount-desc')` SHALL menghasilkan urutan terbalik. Kedua operasi tidak mengubah panjang array.

**Validates: Requirements 11.1**

---

### Property 12: Pengurutan kategori menghasilkan urutan alfabetis

*For any* koleksi transaksi, `sortTransactions(transactions, 'category-asc')` SHALL menghasilkan array di mana nilai `category` setiap elemen ke-i secara leksikografis ≤ nilai `category` elemen ke-(i+1), tanpa mengubah panjang array.

**Validates: Requirements 11.2**

---

## Error Handling

### Strategi Umum

Semua error ditangani secara lokal — tidak ada crash halaman. Error ditampilkan sebagai pesan teks di UI yang relevan. State aplikasi dipertahankan atau di-rollback ke kondisi sebelumnya jika operasi gagal.

### Tabel Error

| Skenario | Behavior | Pesan kepada pengguna |
|---|---|---|
| Field form kosong saat submit | Blokir submit, tampilkan error per field | "Nama item harus diisi." / "Jumlah harus diisi." / "Pilih kategori." |
| Amount bukan angka positif | Blokir submit, tampilkan error | "Jumlah harus berupa angka lebih dari 0." |
| Storage tidak tersedia saat load | Mulai dengan array kosong | "Data tidak dapat dimuat. Memulai dengan daftar kosong." |
| Data di Storage korup (JSON invalid) | Mulai dengan array kosong, abaikan data lama | "Data sebelumnya tidak valid dan telah direset." |
| Kuota Storage penuh saat save | Rollback: jangan tambah/hapus transaksi, batalkan perubahan | "Data gagal disimpan. Penyimpanan browser mungkin penuh." |
| Penghapusan gagal (Storage error) | Tampilkan error, transaksi tetap ada di list | "Transaksi gagal dihapus. Silakan coba lagi." |
| Tidak ada transaksi (empty state) | Tampilkan placeholder di List dan Chart | "Belum ada transaksi." / "Tambahkan transaksi untuk melihat grafik." |

### Error pada Chart

Jika Chart.js gagal diinisialisasi (misalnya CDN tidak tersedia), aplikasi tetap berfungsi untuk fitur lain (form, list, balance). Chart canvas menampilkan teks fallback: "Grafik tidak tersedia."

### Error Boundary pada renderAll()

`renderAll()` memanggil setiap renderer secara independen dalam try-catch. Kegagalan satu renderer tidak menghentikan renderer lainnya.

```javascript
function renderAll() {
  try { renderBalance(transactions); } catch (e) { console.error('Balance render error', e); }
  try { renderTransactionList(transactions, sortMode); } catch (e) { console.error('List render error', e); }
  try { renderChart(transactions); } catch (e) { console.error('Chart render error', e); }
}
```

---

## Testing Strategy

### Pendekatan Dual Testing

Pengujian menggunakan dua pendekatan komplementer:
1. **Unit tests (example-based)** — memverifikasi contoh konkret, edge case, dan integrasi antar komponen
2. **Property-based tests** — memverifikasi properti universal yang harus berlaku untuk semua input valid

Library yang digunakan:
- **Property-based testing:** [fast-check](https://github.com/dubzzz/fast-check) (JavaScript, aktif dikelola, tidak memerlukan build step khusus untuk testing)
- **Test runner:** [Vitest](https://vitest.dev/) (kompatibel dengan Vanilla JS, cepat, zero-config)

> **Catatan:** fast-check dipilih karena mature, dokumentasi lengkap, dan bekerja baik dengan Vitest tanpa konfigurasi tambahan.

### Struktur File Test

```
tests/
├── unit/
│   ├── validator.test.js       # Unit tests untuk Validator
│   ├── storage.test.js         # Unit tests untuk Storage Module
│   ├── renderer.test.js        # Unit tests untuk renderer functions
│   └── integration.test.js    # Integrasi antar komponen
└── property/
    ├── validator.property.js   # Property tests untuk validasi
    ├── balance.property.js     # Property tests untuk kalkulasi balance
    ├── chart.property.js       # Property tests untuk kalkulasi chart
    ├── storage.property.js     # Property tests untuk Storage round-trip
    └── sort.property.js        # Property tests untuk pengurutan
```

### Property-Based Tests

Setiap property test dikonfigurasi minimum **100 iterasi** (default fast-check). Setiap test diberi tag komentar referensi ke design property.

**Contoh implementasi (Property 7 — Balance = Sum):**

```javascript
import fc from 'fast-check';
import { calculateBalance } from '../js/app.js';

// Feature: expense-budget-visualizer, Property 7: Balance sama dengan jumlah seluruh amount
test('balance equals sum of all amounts for any transaction list', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        id: fc.string(),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        amount: fc.float({ min: 0.01, max: 1_000_000, noNaN: true }),
        category: fc.constantFrom('Food', 'Transport', 'Fun'),
        date: fc.date().map(d => d.toISOString()),
      })),
      (transactions) => {
        const expected = transactions.reduce((sum, t) => sum + t.amount, 0);
        expect(calculateBalance(transactions)).toBeCloseTo(expected, 5);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Tag format untuk setiap property test:**
```
// Feature: expense-budget-visualizer, Property {N}: {property_text}
```

### Mapping Property ke Test

| Property | Test File | Tag |
|---|---|---|
| Property 1: Validasi form menolak input tidak lengkap | `validator.property.js` | `Feature: expense-budget-visualizer, Property 1` |
| Property 2: Amount harus angka positif | `validator.property.js` | `Feature: expense-budget-visualizer, Property 2` |
| Property 3: Submit valid menambah transaksi | `validator.property.js` | `Feature: expense-budget-visualizer, Property 3` |
| Property 4: Daftar terurut newest-first | `sort.property.js` | `Feature: expense-budget-visualizer, Property 4` |
| Property 5: Setiap item punya tombol hapus | `renderer.property.js` | `Feature: expense-budget-visualizer, Property 5` |
| Property 6: Hapus menghilangkan transaksi dan update balance | `validator.property.js` | `Feature: expense-budget-visualizer, Property 6` |
| Property 7: Balance = sum semua amount | `balance.property.js` | `Feature: expense-budget-visualizer, Property 7` |
| Property 8: Persentase kategori = 100 | `chart.property.js` | `Feature: expense-budget-visualizer, Property 8` |
| Property 9: Warna kategori unik | `chart.property.js` | `Feature: expense-budget-visualizer, Property 9` |
| Property 10: Storage round-trip | `storage.property.js` | `Feature: expense-budget-visualizer, Property 10` |
| Property 11: Sort amount menghasilkan urutan benar | `sort.property.js` | `Feature: expense-budget-visualizer, Property 11` |
| Property 12: Sort kategori alfabetis | `sort.property.js` | `Feature: expense-budget-visualizer, Property 12` |

### Unit Tests (Example-Based)

| Komponen | Test Cases |
|---|---|
| Validator | Field kosong, amount = 0, amount negatif, amount = "abc", semua field valid |
| Storage | Data korup, storage unavailable (mock), kuota penuh (mock), load kosong |
| Renderer — Balance | Empty list → 0, single item, multiple items |
| Renderer — List | Empty state message, item count match, newest-first order |
| Renderer — Chart | Empty state placeholder, single category → 100%, CDN failure |
| App Controller | Add → save → render flow, delete confirmation flow, storage write failure rollback |

### Integrasi dan Browser Compatibility

- **Chrome, Firefox, Edge, Safari:** Manual test atau Playwright untuk compatibility check
- **Responsive (320px+):** Manual test di Chrome DevTools Device Mode
- **Performance (< 300ms update):** `performance.now()` timing assertions pada unit tests
- **GitHub Pages:** Deploy check — verifikasi semua asset dapat dimuat via URL publik
