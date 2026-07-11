document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi ikon dari Lucide secara otomatis
    lucide.createIcons();

    // DOM Elemen Utama Layar
    const viewHome = document.getElementById("view-home");
    const viewLoading = document.getElementById("view-loading");
    const viewSuccess = document.getElementById("view-result-success");
    const viewFailed = document.getElementById("view-result-failed");

    // Kontrol Input dan Navigasi Beranda
    const inputCertId = document.getElementById("input-cert-id");
    const btnVerify = document.getElementById("btn-verify");
    const btnStartScan = document.getElementById("btn-start-scan");
    const btnCloseScanner = document.getElementById("btn-close-scanner");
    const btnBackList = document.querySelectorAll(".btn-back");
    const scannerContainer = document.getElementById("scanner-container");

    // Elemen Pengisi Tabel Detail Surat Keterangan
    const resName = document.getElementById("res-name");
    const resNim = document.getElementById("res-nim");
    const resProdi = document.getElementById("res-prodi");
    const resPerihal = document.getElementById("res-perihal");
    const resTa = document.getElementById("res-ta");
    const resId = document.getElementById("res-id");
    const signersContainer = document.getElementById("signers-container");
    const btnDownloadPdf = document.getElementById("btn-download-pdf");

    let html5QrCode = null;
    let documentDatabase = null;

    // Menangkap parameter '?id=' dari URL untuk auto-verify (contoh scan QR)
    const urlParams = new URLSearchParams(window.location.search);
    const docIdParam = urlParams.get('id');

    // Menampilkan animasi loading saat menarik pangkalan data
    showView("loading");

    // ⚡ BYPASS CACHE STRATEGY: Mencegah browser menyimpan cache database lama
    fetch(`database.json?v=${new Date().getTime()}`, {
        headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Gagal memuat berkas database.json");
        return response.json();
    })
    .then(data => {
        documentDatabase = data;
        // Jika terdapat parameter ID di URL, langsung lakukan eksekusi pencarian otomatis
        if (docIdParam) {
            verifyDocument(docIdParam.trim());
        } else {
            showView("home");
        }
    })
    .catch(error => {
        console.error("Kesalahan memuat database:", error);
        if (docIdParam) showView("failed");
        else showView("home");
    });

    // Event Listener Verifikasi Manual via Tombol Klik
    btnVerify.addEventListener("click", () => {
        const docId = inputCertId.value.trim();
        if (docId) {
            window.location.href = `?id=${encodeURIComponent(docId)}`;
        } else {
            alert("Silakan masukkan NIM Mahasiswa atau Nomor Surat terlebih dahulu.");
        }
    });

    // Akses jalan pintas keyboard Enter pada kolom pencarian
    inputCertId.addEventListener("keypress", (e) => {
        if (e.key === "Enter") btnVerify.click();
    });

    // Event Listener Semua Tombol Kembali (Mereset URL ke halaman utama)
    btnBackList.forEach(btn => {
        btn.addEventListener("click", () => {
            window.location.href = window.location.pathname;
        });
    });

    // Event Listener Mengaktifkan Pemindai Kamera QR
    btnStartScan.addEventListener("click", () => {
        scannerContainer.classList.remove("hidden");
        btnStartScan.classList.add("hidden");
        startScanner();
    });

    // Event Listener Menutup Kotak Kamera
    btnCloseScanner.addEventListener("click", () => {
        stopScanner();
    });

    // ==========================================================================
    // FUNGSI UTAMA: Verifikasi Dokumen Surat Keterangan
    // ==========================================================================
    // Tambahkan ini di bagian atas app.js bersama deklarasi DOM lainnya
    const resNoSurat = document.getElementById("res-no-surat"); 
    
    function verifyDocument(id) {
        if (!documentDatabase) {
            showView("failed");
            return;
        }
    
        const cleanId = id.trim().toUpperCase();
        const docKey = Object.keys(documentDatabase).find(
            key => key.trim().toUpperCase() === cleanId
        );
    
        if (docKey && documentDatabase[docKey]) {
            const data = documentDatabase[docKey];
            
            // DISTRIBUSI DATA YANG BENAR:
            resName.textContent = data.name || "-";
            resNim.textContent = data.nim || docKey; // Menampilkan NIM asli (cth: 5021001)
            resProdi.textContent = data.prodi || "-";
            resPerihal.textContent = data.perihal || "Surat Keterangan Aktif Kuliah";
            resTa.textContent = data.ta || "-";
            
            // Menampilkan nomor surat resmi panjang (cth: 100/FIKes-UF/BAAK/Ket-Mhsw/VII/2026)
            resNoSurat.textContent = data.no_surat || "-"; 
            
            if (resId) resId.textContent = docKey; // Simpan key arsip di latar belakang
            
            // Logika tombol unduh PDF
            if (data.download_url) {
                btnDownloadPdf.href = data.download_url;
                btnDownloadPdf.style.display = "flex";
            } else {
                btnDownloadPdf.style.display = "none";
            }
    
            // Loop penandatangan
            signersContainer.innerHTML = "";
            if (data.signers && Array.isArray(data.signers) && data.signers.length > 0) {
                data.signers.forEach((signer) => {
                    const detailRow = document.createElement("div");
                    detailRow.className = "detail-row";
                    detailRow.innerHTML = `
                        <span class="detail-label">${signer.role || "Penandatangan"}</span>
                        <span class="detail-value font-semibold">${signer.name || "-"}</span>
                    `;
                    signersContainer.appendChild(detailRow);
                });
            } else {
                const detailRow = document.createElement("div");
                detailRow.className = "detail-row";
                detailRow.innerHTML = `
                    <span class="detail-label">Dekan FIKES - UF</span>
                    <span class="detail-value font-semibold">Prof. Dr. dr. Siti Aminah, M.Kes</span>
                `;
                signersContainer.appendChild(detailRow);
            }
    
            showView("success");
        } else {
            showView("failed");
        }
    }

    // Navigasi Pengalihan Kartu Tampilan Interface
    function showView(viewName) {
        viewHome.classList.add("hidden");
        viewLoading.classList.add("hidden");
        viewSuccess.classList.add("hidden");
        viewFailed.classList.add("hidden");

        if (viewName === "success") viewSuccess.classList.remove("hidden");
        else if (viewName === "failed") viewFailed.classList.remove("hidden");
        else if (viewName === "loading") viewLoading.classList.remove("hidden");
        else viewHome.classList.remove("hidden");
    }

    // ==========================================================================
    // KOMPONEN ENGINE SCANNER QR CODE (HTML5-QRCode)
    // ==========================================================================
    function startScanner() {
        html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(() => {
                alert("Akses modul kamera ditolak atau tidak terdeteksi di perangkat Anda.");
                stopScanner();
            });
    }

    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                scannerContainer.classList.add("hidden");
                btnStartScan.classList.remove("hidden");
                html5QrCode = null;
            }).catch(() => {
                scannerContainer.classList.add("hidden");
                btnStartScan.classList.remove("hidden");
                html5QrCode = null;
            });
        } else {
            scannerContainer.classList.add("hidden");
            btnStartScan.classList.remove("hidden");
        }
    }

    function onScanSuccess(decodedText) {
        stopScanner();
        let scannedId = decodedText;
        try {
            // Jika isi QR Code berupa URL penuh, potong dan ambil nilai parameter '?id=' saja
            if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
                const url = new URL(decodedText);
                const idParam = url.searchParams.get("id");
                if (idParam) scannedId = idParam;
            }
        } catch (e) {
            console.error("Gagal membaca enkripsi URL QR Code:", e);
        }
        window.location.href = `?id=${encodeURIComponent(scannedId.trim())}`;
    }

    function onScanFailure() {
        // Callback silent (dikosongkan agar console tidak penuh saat kamera melakukan tracking)
    }
});
