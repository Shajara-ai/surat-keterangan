document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi ikon dari Lucide
    lucide.createIcons();

    // DOM Elemen Utama
    const viewHome = document.getElementById("view-home");
    const viewLoading = document.getElementById("view-loading");
    const viewSuccess = document.getElementById("view-result-success");
    const viewFailed = document.getElementById("view-result-failed");

    const inputCertId = document.getElementById("input-cert-id");
    const btnVerify = document.getElementById("btn-verify");
    const btnStartScan = document.getElementById("btn-start-scan");
    const btnCloseScanner = document.getElementById("btn-close-scanner");
    const btnBackList = document.querySelectorAll(".btn-back");
    const scannerContainer = document.getElementById("scanner-container");

    // Elemen Pengisi Data Detail Keberhasilan
    const resName = document.getElementById("res-name");
    const resRole = document.getElementById("res-role");
    const resActivity = document.getElementById("res-activity");
    const resDate = document.getElementById("res-date");
    const resId = document.getElementById("res-id");
    const signersContainer = document.getElementById("signers-container");

    let html5QrCode = null;
    let documentDatabase = null;

    // Ambil parameter dari URL (?id=5021xxxx)
    const urlParams = new URLSearchParams(window.location.search);
    const certIdParam = urlParams.get('id');

    // Tampilkan loading saat database sedang dimuat
    showView("loading");

    // ⚡ BYPASS CACHE STRATEGY: Memaksa browser mengambil data paling baru langsung dari server GitHub
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
        // Jika ada parameter ID di URL, langsung lakukan verifikasi otomatis
        if (certIdParam) {
            verifyDocument(certIdParam.trim());
        } else {
            showView("home");
        }
    })
    .catch(error => {
        console.error("Kesalahan memuat database:", error);
        if (certIdParam) showView("failed");
        else showView("home");
    });

    // Event Listener Tombol Verifikasi Manual (Input NIM)
    btnVerify.addEventListener("click", () => {
        const certId = inputCertId.value.trim();
        if (certId) {
            window.location.href = `?id=${encodeURIComponent(certId)}`;
        } else {
            alert("Silakan masukkan NIM Mahasiswa terlebih dahulu.");
        }
    });

    inputCertId.addEventListener("keypress", (e) => {
        if (e.key === "Enter") btnVerify.click();
    });

    // Event Listener Tombol Kembali
    btnBackList.forEach(btn => {
        btn.addEventListener("click", () => {
            window.location.href = window.location.pathname;
        });
    });

    // Event Listener Kamera/Scanner
    btnStartScan.addEventListener("click", () => {
        scannerContainer.classList.remove("hidden");
        btnStartScan.classList.add("hidden");
        startScanner();
    });

    btnCloseScanner.addEventListener("click", () => {
        stopScanner();
    });

    // Fungsi Utama Verifikasi Arsip Surat
    function verifyDocument(id) {
        if (!documentDatabase) {
            showView("failed");
            return;
        }

        // Antisipasi ketidakcocokan huruf besar/kecil dari input URL
        const cleanId = id.trim().toUpperCase();

        // Cari Key (NIM) di database secara Case-Insensitive
        const docKey = Object.keys(documentDatabase).find(
            key => key.trim().toUpperCase() === cleanId
        );

        if (docKey && documentDatabase[docKey]) {
            const data = documentDatabase[docKey];
            
            // Masukkan data dasar ke komponen HTML
            resName.textContent = data.name || "-";
            resRole.textContent = data.role || "Mahasiswa Aktif";
            resActivity.innerHTML = data.activity || "-"; // Mendukung render string berwujud tag <i> & <br>
            resDate.textContent = data.date || "-";
            resId.textContent = data.nomor || "-"; // Menampilkan Nomor Surat Keluar resmi
            
            // Render Elemen Penandatangan secara dinamis
            signersContainer.innerHTML = "";
            if (data.signers && Array.isArray(data.signers) && data.signers.length > 0) {
                data.signers.forEach((signer) => {
                    const signerCard = document.createElement("div");
                    signerCard.className = "signer-card";
                    
                    const labelRole = signer.role || "Pejabat Berwenang";
                    const signerName = signer.name || "-";
                    
                    signerCard.innerHTML = `
                        <div class="signer-name">${signerName}</div>
                        <div class="signer-role">${labelRole}</div>
                    `;
                    signersContainer.appendChild(signerCard);
                });
            } else {
                // Aturan fallback jika data penandatangan kosong di database.json
                const signerCard = document.createElement("div");
                signerCard.className = "signer-card";
                signerCard.innerHTML = `
                    <div class="signer-name">Ahmad Jubaedi, SKM, MKM</div>
                    <div class="signer-role">Dekan FIKES - UF</div>
                `;
                signersContainer.appendChild(signerCard);
            }

            showView("success");
        } else {
            showView("failed");
        }
    }

    // Navigasi Tampilan Kartu Sistem (View Switcher)
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

    // Fungsi Kamera Scanner QR
    function startScanner() {
        html5QrCode = new Html5Qrcode("qr-reader");
        const config = { fps: 10, qrbox: { width: 220, height: 220 } };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
            .catch(() => {
                alert("Akses kamera ditolak atau perangkat media tidak ditemukan.");
                stopScanner();
            });
    }

    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                scannerContainer.add("hidden");
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
        let targetId = decodedText;
        try {
            // Jika isi QR Code berupa URL utuh (?id=5021xxx), bedah untuk mengambil nilai parameter id saja
            if (decodedText.startsWith("http://") || decodedText.startsWith("https://")) {
                const url = new URL(decodedText);
                const idParam = url.searchParams.get("id");
                if (idParam) targetId = idParam;
            }
        } catch (e) {
            console.error("Gagal memproses parsing URL QR Code:", e);
        }
        window.location.href = `?id=${encodeURIComponent(targetId.trim())}`;
    }

    function onScanFailure() {
        // Callback silent untuk meminimalisasi log konsol saat mencari QR Code
    }
});
