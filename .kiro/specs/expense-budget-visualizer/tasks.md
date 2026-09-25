# Implementation Plan: Expense & Budget Visualizer

## Overview

Implementasi dilakukan secara incremental — mulai dari struktur file dan data model, kemudian logic layer (Validator, Storage, Calculator), lalu UI rendering layer (Balance, List, Chart), dan diakhiri dengan wiring semua komponen di App Controller. Setiap langkah menghasilkan kode yang terintegrasi, bukan modul yang tergantung tanpa disambungkan.

Seluruh kode JavaScript berada dalam satu file `js/app.js` (Req 6.3). Testing menggunakan Vitest + fast-check.

---

## Tasks

- [x] 1. Buat struktur proyek dan file dasar
  - Buat direktori `expense-budget-visualizer/`, `css/`, `js/`, `tests/unit/`, `tests/property/`
  - Buat `index.html` dengan markup semua komponen: Input Form, Balance Display, Transaction List, Chart canvas
  - Buat `css/style.css` kosong dengan komentar section (form, balance, list, chart, responsive)
  - Buat `js/app.js` kosong dengan komentar section (Data Model, Validator, Storage, Renderers, App Controller)
  - Inisialisasi `package.json` dengan Vitest dan fast-check sebagai devDependencies
  - Buat `vitest.config.js` dengan konfigurasi minimal (environment jsdom)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 13.1_

- [x] 2. Implementasi Validator
  - [x] 2.1 Tulis fungsi `validateTransaction(formData)` di `js/app.js`
    - Validasi `name`: tidak boleh kosong, maksimal 100 karakter
    - Validasi `amount`: harus angka positif (> 0), bukan NaN, bukan Infinity
    - Validasi `category`: tidak boleh kosong / belum dipilih
    - Kembalikan `{ valid: boolean, errors: string[] }`
    - _Requirements: 1.3, 1.4, 1.5_

  - [x]* 2.2 Tulis property test untuk Validator (Property 1 & 2)
    - **Property 1: Validasi form menolak input tidak lengkap**
    - **Validates: Requirements 1.3, 1.4**
    - **Property 2: Amount harus angka positif**
    - **Validates: Requirements 1.5**
    - File: `tests/property/validator.property.js`

  - [x]* 2.3 Tulis unit test untuk Validator
    - Test cases: field kosong, amount = 0, amount negatif, amount = "abc", semua field valid
    - File: `tests/unit/validator.test.js`
    - _Requirements: 1.3, 1.4, 1.5_

- [x] 3. Implementasi Storage Module
  - [x] 3.1 Tulis fungsi `loadTransactions()` dan `saveTransactions(transactions)` di `js/app.js`
    - `loadTransactions()`: baca dari `localStorage.getItem('expense_transactions')`, parse JSON, validasi array, return null jika korup atau tidak tersedia
    - `saveTransactions()`: `JSON.stringify` lalu `localStorage.setItem`, tangani QuotaExceededError, return `{ success, error? }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x]* 3.2 Tulis property test untuk Storage round-trip (Property 10)
    - **Property 10: Storage round-trip menjaga integritas data**
    - **Validates: Requirements 5.1, 5.2, 5.3**
    - File: `tests/property/storage.property.js`

  - [x]* 3.3 Tulis unit test untuk Storage Module
    - Mock `localStorage`; test data korup, storage unavailable, kuota penuh, load kosong
    - File: `tests/unit/storage.test.js`
    - _Requirements: 5.5, 5.6_

- [x] 4. Implementasi kalkulasi Balance dan Chart stats
  - [x] 4.1 Tulis fungsi `calculateBalance(transactions)` di `js/app.js`
    - Jumlahkan semua `amount` dalam array; kembalikan 0 jika array kosong
    - _Requirements: 3.1, 3.4_

  - [x]* 4.2 Tulis property test untuk Balance (Property 7)
    - **Property 7: Balance sama dengan jumlah seluruh amount**
    - **Validates: Requirements 3.1, 3.4**
    - File: `tests/property/balance.property.js`

  - [x] 4.3 Tulis fungsi `calculateCategoryStats(transactions)` dan `generateUniqueColors(count)` di `js/app.js`
    - `calculateCategoryStats`: hitung total per kategori dan persentase (dibulatkan 1 desimal), return `CategoryStat[]`
    - `generateUniqueColors`: hasilkan N warna hex unik tanpa duplikat
    - _Requirements: 4.1, 4.6, 4.7_

  - [x]* 4.4 Tulis property test untuk Chart stats (Property 8 & 9)
    - **Property 8: Persentase kategori menjumlah ke 100**
    - **Validates: Requirements 4.1, 4.7**
    - **Property 9: Warna kategori selalu unik**
    - **Validates: Requirements 4.6**
    - File: `tests/property/chart.property.js`

- [x] 5. Checkpoint — Pastikan semua tests logic layer lulus
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implementasi fungsi pengurutan
  - [x] 6.1 Tulis fungsi `sortTransactions(transactions, mode)` di `js/app.js`
    - Mode `date-desc`: descending berdasarkan `date` (default)
    - Mode `amount-asc` / `amount-desc`: ascending / descending berdasarkan `amount`
    - Mode `category-asc`: ascending alfabetis berdasarkan `category`
    - Kembalikan array baru (tidak mutasi array asli)
    - _Requirements: 2.1, 11.1, 11.2_

  - [x]* 6.2 Tulis property test untuk pengurutan (Property 4, 11, 12)
    - **Property 4: Daftar transaksi selalu terurut newest-first**
    - **Validates: Requirements 2.1**
    - **Property 11: Pengurutan amount menghasilkan urutan yang benar**
    - **Validates: Requirements 11.1**
    - **Property 12: Pengurutan kategori menghasilkan urutan alfabetis**
    - **Validates: Requirements 11.2**
    - File: `tests/property/sort.property.js`

- [x] 7. Implementasi Renderer — Balance Display
  - [x] 7.1 Tulis fungsi `renderBalance(transactions)` di `js/app.js`
    - Hitung total via `calculateBalance()`, perbarui DOM element Balance_Display
    - Format angka sesuai kebutuhan tampilan
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x]* 7.2 Tulis unit test untuk renderBalance
    - Test: empty list → 0, single item, multiple items
    - File: `tests/unit/renderer.test.js`
    - _Requirements: 3.1, 3.4_

- [x] 8. Implementasi Renderer — Transaction List
  - [x] 8.1 Tulis fungsi `renderTransactionList(transactions, sortMode)` di `js/app.js`
    - Sort via `sortTransactions()`, render ulang seluruh list ke DOM
    - Setiap item tampilkan: nama, amount, kategori, tanggal, tombol hapus dengan `data-id`
    - Tampilkan empty state message jika array kosong
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [x]* 8.2 Tulis property test untuk item tombol hapus (Property 5)
    - **Property 5: Setiap item transaksi memiliki tombol hapus**
    - **Validates: Requirements 2.3**
    - File: `tests/property/renderer.property.js`

  - [x]* 8.3 Tulis unit test untuk renderTransactionList
    - Test: empty state message, jumlah item sesuai array, order newest-first
    - File: `tests/unit/renderer.test.js`
    - _Requirements: 2.1, 2.7_

- [x] 9. Implementasi Renderer — Chart
  - [x] 9.1 Tulis fungsi `renderChart(transactions)` di `js/app.js`
    - Jika array kosong: tampilkan placeholder teks, sembunyikan canvas
    - Jika ada data: hitung via `calculateCategoryStats()`, buat/update Chart.js instance dengan `generateUniqueColors()`
    - Wrap inisialisasi Chart.js dalam try-catch; tampilkan teks fallback jika gagal
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]* 9.2 Tulis unit test untuk renderChart
    - Test: empty state placeholder, single category → 100%, CDN failure fallback
    - File: `tests/unit/renderer.test.js`
    - _Requirements: 4.5, 4.7_

- [x] 10. Implementasi Input Form Handler
  - [x] 10.1 Tulis fungsi `handleFormSubmit(event)`, `clearForm()`, dan `showFormErrors(errors)` di `js/app.js`
    - `handleFormSubmit`: ambil data form → `validateTransaction()` → jika valid panggil `addTransaction()`, jika tidak panggil `showFormErrors()`
    - `clearForm`: kosongkan semua field dan hilangkan pesan error
    - `showFormErrors`: tampilkan pesan error per field
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 11. Implementasi App Controller — addTransaction dan deleteTransaction
  - [x] 11.1 Tulis fungsi `addTransaction(formData)` di `js/app.js`
    - Buat objek Transaction dengan `id` (crypto.randomUUID() atau Date.now()), `date` (new Date().toISOString())
    - Tambahkan ke `transactions[]`, coba `saveTransactions()` — jika gagal rollback (hapus dari array), tampilkan error
    - Panggil `renderAll()` jika berhasil, panggil `clearForm()`
    - _Requirements: 1.6, 3.2, 4.3, 5.1, 5.6_

  - [x]* 11.2 Tulis property test untuk addTransaction (Property 3)
    - **Property 3: Submit valid menambah transaksi dan mengosongkan form**
    - **Validates: Requirements 1.6, 3.2**
    - File: `tests/property/validator.property.js`

  - [x] 11.3 Tulis fungsi `deleteTransaction(id)` di `js/app.js`
    - Tampilkan konfirmasi (`window.confirm` atau custom dialog)
    - Jika dikonfirmasi: hapus dari `transactions[]`, coba `saveTransactions()` — jika gagal rollback, tampilkan error
    - Panggil `renderAll()` jika berhasil
    - _Requirements: 2.4, 2.5, 2.6, 3.3, 4.4, 5.2, 5.6_

  - [x]* 11.4 Tulis property test untuk deleteTransaction (Property 6)
    - **Property 6: Konfirmasi hapus menghilangkan transaksi dan memperbarui balance**
    - **Validates: Requirements 2.5, 3.3**
    - File: `tests/property/validator.property.js`

- [x] 12. Implementasi App Controller — initApp dan renderAll
  - [x] 12.1 Tulis fungsi `renderAll()` dan `initApp()` di `js/app.js`
    - `renderAll()`: panggil `renderBalance()`, `renderTransactionList()`, `renderChart()` masing-masing dalam try-catch terpisah
    - `initApp()`: `loadTransactions()` → populate `transactions[]` → tampilkan error jika data korup → `renderAll()`
    - Daftarkan event listeners: form submit, delete buttons (event delegation), sort control change
    - Panggil `initApp()` pada event `DOMContentLoaded`
    - _Requirements: 5.3, 5.5, 9.1_

  - [x]* 12.2 Tulis unit test App Controller integration flow
    - Test: add → save → render flow, delete confirmation flow, storage write failure rollback
    - File: `tests/unit/integration.test.js`
    - _Requirements: 1.6, 2.5, 5.6_

- [x] 13. Implementasi CSS — Styling dan Responsif
  - [x] 13.1 Tulis `css/style.css` lengkap
    - Layout responsif (flexbox/grid), mendukung lebar mulai 320px hingga desktop
    - Section: reset, typography, form, balance display, transaction list, chart, error messages, empty states
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 14. Tambahkan kontrol pengurutan ke UI
  - [x] 14.1 Tambahkan elemen kontrol sort ke `index.html` dan handler di `js/app.js`
    - Tambahkan `<select>` atau tombol sort di atas Transaction List
    - Tulis fungsi `handleSortChange(mode)`: ubah `sortMode` → panggil `renderTransactionList()`
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 15. Checkpoint akhir — Pastikan semua tests lulus dan app berfungsi
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks bertanda `*` adalah opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceabilitas
- Seluruh JavaScript harus berada dalam satu file `js/app.js` (Req 6.3)
- Seluruh CSS harus berada dalam satu file `css/style.css` (Req 6.2)
- Property tests menggunakan fast-check; unit tests menggunakan Vitest
- Rollback storage wajib diimplementasikan (Req 5.6) — bukan opsional
- Requirement 10 (Custom Category) dan 12 (Highlight Berlebih) tidak disertakan dalam tasks ini karena berstatus opsional dan tidak direferensikan oleh properties; dapat ditambahkan sebagai epic terpisah

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4.1", "4.3"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.2", "3.3", "4.2", "4.4", "6.1"] },
    { "id": 2, "tasks": ["6.2", "7.1", "11.1", "11.3"] },
    { "id": 3, "tasks": ["7.2", "8.1", "11.2", "11.4"] },
    { "id": 4, "tasks": ["8.2", "8.3", "9.1", "12.1"] },
    { "id": 5, "tasks": ["9.2", "10.1", "12.2"] },
    { "id": 6, "tasks": ["13.1", "14.1"] }
  ]
}
```
