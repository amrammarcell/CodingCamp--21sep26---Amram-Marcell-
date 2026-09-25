# Requirements Document

## Introduction

Expense & Budget Visualizer adalah mobile-friendly web app yang membantu pengguna melacak pengeluaran harian secara visual. Aplikasi menampilkan total saldo terkini, riwayat transaksi yang dapat di-scroll, dan pie chart distribusi pengeluaran per kategori. Dibangun menggunakan HTML, CSS, dan Vanilla JavaScript tanpa backend — semua data disimpan di browser Local Storage. Aplikasi dapat diakses sebagai halaman web biasa maupun browser extension, dan dipublikasikan via GitHub Pages.

---

## Glossary

- **App**: Expense & Budget Visualizer web application.
- **Transaction**: Satu entri pengeluaran yang terdiri dari nama item, jumlah (amount), kategori, dan tanggal pencatatan.
- **Transaction_List**: Komponen UI yang menampilkan semua transaksi yang tersimpan dalam daftar scrollable.
- **Input_Form**: Komponen UI berupa form untuk memasukkan data transaksi baru.
- **Balance_Display**: Komponen UI yang menampilkan total saldo (total pengeluaran) saat ini.
- **Chart**: Komponen visualisasi pie chart yang menampilkan distribusi pengeluaran per kategori.
- **Category**: Label pengelompokan transaksi; nilai default: Food, Transport, Fun.
- **Storage**: Browser Local Storage API yang digunakan untuk menyimpan semua data transaksi secara persisten.
- **Validator**: Komponen yang memvalidasi input sebelum transaksi disimpan.
- **Chart_Library**: Library eksternal (Chart.js atau sejenisnya) yang digunakan untuk merender pie chart.
- **Custom_Category**: Kategori yang ditambahkan sendiri oleh pengguna di luar kategori default.

---

## Requirements

---

### Requirement 1: Input Form — Entri Transaksi Baru

**User Story:** As a pengguna, I want mengisi form dengan nama item, jumlah, dan kategori, so that saya dapat mencatat pengeluaran baru dengan cepat.

#### Acceptance Criteria

1. THE Input_Form SHALL menyediakan field teks untuk nama item (maksimal 100 karakter), field numerik untuk jumlah (amount), dan dropdown untuk kategori.
2. THE Input_Form SHALL menyediakan kategori default: Food, Transport, dan Fun pada dropdown kategori.
3. WHEN pengguna mengklik tombol submit pada Input_Form, THE Validator SHALL memeriksa bahwa semua field (nama item, jumlah, dan kategori) telah terisi.
4. IF salah satu field pada Input_Form kosong saat submit, THEN THE Validator SHALL menampilkan pesan error yang menyebutkan field mana yang belum terisi dan mencegah transaksi disimpan, serta mempertahankan nilai yang sudah diisi pada field lainnya.
5. IF nilai amount yang dimasukkan bukan angka positif (lebih besar dari 0), atau bukan angka valid, THEN THE Validator SHALL menampilkan pesan error yang menyatakan bahwa jumlah harus berupa angka positif dan mencegah transaksi disimpan.
6. WHEN Input_Form berhasil disubmit dan Validator menyatakan valid, THE App SHALL menambahkan transaksi baru ke Transaction_List, memperbarui Balance_Display dan Chart, lalu mengosongkan semua field pada Input_Form.

---

### Requirement 2: Transaction List — Tampilan Riwayat Transaksi

**User Story:** As a pengguna, I want melihat semua transaksi yang pernah dicatat dalam satu daftar, so that saya dapat meninjau riwayat pengeluaran saya.

#### Acceptance Criteria

1. THE Transaction_List SHALL menampilkan semua transaksi yang tersimpan secara berurutan dari yang terbaru ke yang terlama, dengan setiap item menampilkan nama item, jumlah (amount), kategori, dan tanggal pencatatan.
2. WHILE jumlah transaksi melebihi tinggi tampilan yang tersedia, THE Transaction_List SHALL dapat di-scroll secara vertikal untuk mengakses semua item.
3. THE Transaction_List SHALL menampilkan tombol hapus pada setiap item transaksi.
4. WHEN pengguna mengklik tombol hapus pada suatu item transaksi, THE App SHALL menampilkan konfirmasi penghapusan yang meminta pengguna memilih antara membatalkan atau melanjutkan.
5. WHEN pengguna mengonfirmasi penghapusan, THE App SHALL menghapus transaksi tersebut dari Transaction_List dan memperbarui Balance_Display serta Chart secara otomatis.
6. IF penghapusan transaksi gagal, THEN THE App SHALL menampilkan pesan kesalahan yang menginformasikan bahwa transaksi gagal dihapus, dan transaksi tersebut tetap ditampilkan di Transaction_List tanpa perubahan.
7. WHEN tidak ada transaksi yang tersimpan, THE Transaction_List SHALL menampilkan pesan yang menginformasikan bahwa belum ada transaksi yang dicatat.

---

### Requirement 3: Total Balance — Tampilan Saldo

**User Story:** As a pengguna, I want melihat total pengeluaran saya secara real-time di bagian atas halaman, so that saya selalu tahu berapa total yang sudah saya keluarkan.

#### Acceptance Criteria

1. THE Balance_Display SHALL ditampilkan di bagian atas halaman dan menampilkan jumlah total dari seluruh amount transaksi yang tersimpan.
2. WHEN transaksi baru berhasil ditambahkan, THE Balance_Display SHALL memperbarui nilainya secara otomatis tanpa memuat ulang halaman.
3. WHEN suatu transaksi berhasil dihapus dari Transaction_List, THE Balance_Display SHALL memperbarui nilainya secara otomatis tanpa memuat ulang halaman.
4. WHEN tidak ada transaksi yang tersimpan, THE Balance_Display SHALL menampilkan nilai nol.

---

### Requirement 4: Visual Chart — Pie Chart Distribusi Pengeluaran

**User Story:** As a pengguna, I want melihat pie chart yang menunjukkan distribusi pengeluaran per kategori, so that saya dapat memahami pola pengeluaran saya secara visual.

#### Acceptance Criteria

1. THE Chart SHALL menampilkan pie chart yang merepresentasikan proporsi total amount setiap kategori terhadap keseluruhan transaksi, dengan setiap segmen menampilkan nama kategori dan persentasenya (dibulatkan satu desimal).
2. THE Chart SHALL dirender menggunakan Chart_Library (Chart.js atau library chart sederhana lainnya).
3. WHEN transaksi baru berhasil ditambahkan, THE Chart SHALL memperbarui tampilannya secara otomatis untuk mencerminkan distribusi terbaru tanpa memuat ulang halaman.
4. WHEN suatu transaksi berhasil dihapus, THE Chart SHALL memperbarui tampilannya secara otomatis untuk mencerminkan distribusi terbaru tanpa memuat ulang halaman.
5. WHEN tidak ada transaksi yang tersimpan, THE Chart SHALL menampilkan pesan teks yang terlihat oleh pengguna yang menginformasikan bahwa data belum tersedia, tanpa menampilkan grafik kosong.
6. THE Chart SHALL menggunakan warna yang berbeda untuk setiap kategori sehingga tidak ada dua segmen yang berdampingan menggunakan warna yang sama.
7. IF hanya terdapat satu kategori dengan transaksi, THEN THE Chart SHALL menampilkan satu segmen lingkaran penuh (100%) untuk kategori tersebut.

---

### Requirement 5: Persistensi Data — Local Storage

**User Story:** As a pengguna, I want data pengeluaran saya tetap tersimpan meskipun saya menutup dan membuka kembali browser, so that saya tidak kehilangan riwayat transaksi.

#### Acceptance Criteria

1. WHEN transaksi baru berhasil ditambahkan, THE Storage SHALL menyimpan data transaksi tersebut ke browser Local Storage secara langsung.
2. WHEN suatu transaksi berhasil dihapus, THE Storage SHALL menghapus data transaksi tersebut dari browser Local Storage secara langsung.
3. WHEN App dimuat oleh browser dan Storage mengandung data transaksi yang valid, THE App SHALL membaca semua data transaksi dari Storage dan menampilkannya pada Transaction_List, Balance_Display, dan Chart sebelum pengguna berinteraksi.
4. THE Storage SHALL menyimpan semua data transaksi di sisi client saja tanpa mengirimkan data ke server eksternal.
5. IF Storage tidak tersedia atau data di Storage tidak valid saat App dimuat, THEN THE App SHALL menampilkan pesan yang menginformasikan bahwa data tidak dapat dimuat dan memulai dengan daftar transaksi kosong.
6. IF operasi tulis ke Storage gagal (misalnya karena kuota penuh), THEN THE App SHALL membatalkan penambahan atau penghapusan transaksi tersebut, mengembalikan tampilan ke kondisi sebelumnya, dan menampilkan pesan kesalahan yang menginformasikan bahwa data gagal disimpan.

---

### Requirement 6: Teknologi — Stack dan Struktur File

**User Story:** As a developer, I want aplikasi dibangun hanya dengan HTML, CSS, dan Vanilla JavaScript, so that kode mudah dipahami, dikelola, dan tidak memerlukan setup tambahan.

#### Acceptance Criteria

1. THE App SHALL diimplementasikan menggunakan HTML untuk struktur, CSS untuk styling, dan Vanilla JavaScript tanpa framework frontend (React, Vue, Angular, atau sejenisnya).
2. THE App SHALL menyimpan seluruh kode CSS dalam tepat satu file di dalam direktori `css/`.
3. THE App SHALL menyimpan seluruh kode JavaScript dalam tepat satu file di dalam direktori `js/`.
4. THE App SHALL dapat berjalan langsung di browser tanpa memerlukan proses build, server, atau setup tambahan.

---

### Requirement 7: Kompatibilitas Browser

**User Story:** As a pengguna, I want aplikasi berjalan dengan baik di browser favorit saya, so that saya tidak terbatas pada satu browser tertentu.

#### Acceptance Criteria

1. THE App SHALL berfungsi dengan benar pada versi terkini browser Chrome, Firefox, Edge, dan Safari.
2. THE App SHALL dapat digunakan sebagai halaman web standalone yang diakses via URL.
3. WHERE App digunakan sebagai browser extension, THE App SHALL tetap berfungsi dengan benar tanpa modifikasi tambahan.

---

### Requirement 8: Tampilan Mobile-Friendly dan Responsif

**User Story:** As a pengguna yang mengakses lewat ponsel, I want antarmuka yang nyaman digunakan di layar kecil, so that saya dapat mencatat pengeluaran kapan saja dari perangkat apapun.

#### Acceptance Criteria

1. THE App SHALL menggunakan layout responsif yang menyesuaikan tampilan untuk ukuran layar mulai dari lebar 320px hingga layar desktop.
2. THE Input_Form, Transaction_List, Balance_Display, dan Chart SHALL tetap dapat digunakan dan terbaca dengan jelas pada layar dengan lebar 320px ke atas.
3. THE App SHALL menampilkan hierarki visual yang jelas dengan tipografi yang mudah dibaca pada semua ukuran layar yang didukung.

---

### Requirement 9: Performa UI

**User Story:** As a pengguna, I want aplikasi merespons aksi saya dengan cepat, so that pengalaman penggunaan terasa lancar tanpa hambatan.

#### Acceptance Criteria

1. WHEN pengguna menambahkan atau menghapus transaksi, THE App SHALL memperbarui Transaction_List, Balance_Display, dan Chart dalam waktu kurang dari 300ms tanpa memuat ulang halaman.
2. THE App SHALL menampilkan konten utama dalam waktu kurang dari 3 detik pada koneksi broadband standar.
3. WHILE App sedang memperbarui tampilan setelah aksi pengguna, THE App SHALL tidak menampilkan lag atau flicker yang terlihat pada antarmuka.

---

### Requirement 10: Custom Category (Opsional)

**User Story:** As a pengguna, I want menambahkan kategori pengeluaran sendiri di luar pilihan default, so that saya dapat mencatat pengeluaran dengan label yang lebih relevan bagi saya.

#### Acceptance Criteria

1. WHERE fitur Custom_Category diaktifkan, THE Input_Form SHALL menyediakan opsi bagi pengguna untuk memasukkan nama kategori baru selain kategori default.
2. WHERE Custom_Category ditambahkan, THE App SHALL menyimpan nama kategori tersebut ke Storage dan menampilkannya sebagai pilihan pada dropdown kategori dalam sesi selanjutnya.
3. WHERE Custom_Category digunakan pada transaksi, THE Chart SHALL menampilkan Custom_Category tersebut sebagai segmen tersendiri pada pie chart dengan warna yang unik.

---

### Requirement 11: Pengurutan Transaksi (Opsional)

**User Story:** As a pengguna, I want mengurutkan daftar transaksi berdasarkan jumlah atau kategori, so that saya dapat dengan mudah menemukan atau menganalisis pengeluaran tertentu.

#### Acceptance Criteria

1. WHERE fitur pengurutan diaktifkan, THE Transaction_List SHALL menyediakan kontrol untuk mengurutkan transaksi berdasarkan amount (ascending atau descending).
2. WHERE fitur pengurutan diaktifkan, THE Transaction_List SHALL menyediakan kontrol untuk mengurutkan transaksi berdasarkan kategori secara alfabetis.
3. WHEN pengguna memilih opsi pengurutan, THE Transaction_List SHALL memperbarui urutan tampilan transaksi dalam waktu kurang dari 300ms tanpa memuat ulang halaman.

---

### Requirement 12: Highlight Pengeluaran Berlebih (Opsional)

**User Story:** As a pengguna, I want melihat peringatan visual saat pengeluaran suatu kategori melewati batas yang saya tetapkan, so that saya dapat mengontrol pengeluaran dan tetap sesuai anggaran.

#### Acceptance Criteria

1. WHERE fitur highlight pengeluaran berlebih diaktifkan, THE App SHALL menyediakan field bagi pengguna untuk menetapkan batas pengeluaran (spending limit) per kategori.
2. WHILE total amount suatu kategori melebihi spending limit yang ditetapkan, THE Transaction_List SHALL menampilkan penanda visual yang jelas (misalnya warna merah atau ikon peringatan) pada item transaksi dalam kategori tersebut.
3. WHILE total amount suatu kategori melebihi spending limit yang ditetapkan, THE Chart SHALL menampilkan segmen kategori tersebut dengan warna atau penanda yang berbeda untuk membedakannya dari kategori dalam batas normal.

---

### Requirement 13: Deployment via GitHub Pages

**User Story:** As a developer, I want mempublikasikan aplikasi menggunakan GitHub Pages, so that aplikasi dapat diakses secara publik tanpa memerlukan server atau hosting berbayar.

#### Acceptance Criteria

1. THE App SHALL terdiri dari file statis (HTML, CSS, JavaScript) sehingga dapat di-host langsung pada GitHub Pages tanpa konfigurasi server.
2. THE App SHALL dapat diakses melalui URL GitHub Pages setelah repository di-push ke GitHub.
3. WHEN semua file proyek di-push ke branch utama repository GitHub, THE App SHALL dapat dipublikasikan dan diakses melalui GitHub Pages tanpa langkah build tambahan.
