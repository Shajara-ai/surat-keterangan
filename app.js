document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const viewHome = document.getElementById("view-home");
    const viewSuccess = document.getElementById("view-result-success");
    const viewFailed = document.getElementById("view-result-failed");
    const inputCertId = document.getElementById("input-cert-id");
    const btnVerify = document.getElementById("btn-verify");
    const btnStartScan = document.getElementById("btn-start-scan");
    const btnCloseScanner = document.getElementById("btn-close-scanner");
    const scannerContainer = document.getElementById("scanner-container");

    let html5QrCode = null;
    let certificateDatabase = null;

    // 1. Ambil data JSON dengan menghindari cache browser
    fetch(`database.json?v=${new Date().getTime()}`, {
        headers: {'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'}
    })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(data => {
        certificateDatabase = data;
        const urlParams = new URLSearchParams(window.location.search);
        const certIdParam = urlParams.get('id');
        
        if (certIdParam) verifyCertificate(certIdParam.trim());
        else showView("home");
    })
    .catch(() => { 
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('id')) showView("failed"); 
        else showView("home"); 
    });

    // 2. Logika Utama Verifikasi Dokumen
    function verifyCertificate(id) {
        if (!certificateDatabase) { showView("failed"); return; }
        
        const searchInput = id.trim().toUpperCase();
        let targetKey = null;

        // Mencari data berdasarkan NIM (Key) atau Nilai "nomor" di dalam JSON
        for (const key in certificateDatabase) {
            const item = certificateDatabase[key];
            const nomorUrutExcel = item.nomor ? String(item.nomor).trim().toUpperCase() : "";
            
            if (key.toUpperCase() === searchInput || nomorUrutExcel === searchInput) {
                targetKey = key;
                break;
            }
        }

        if (targetKey) {
            const data = certificateDatabase[targetKey];
            
            // Atur lebar kartu dinamis jika tipenya 'surat'
            if (data.type === "surat") {
                viewSuccess.classList.add("card-surat");
            } else {
                viewSuccess.classList.remove("card-surat");
            }

            // Isi Data Personal Ke HTML
            document.getElementById("res-name").textContent = data.name ? data.name.toUpperCase() : "-";
            document.getElementById("res-id").textContent = targetKey;
            
            // Ambil nama Program Studi
            let prodiText = "Sarjana Keperawatan";
            if (data.activity && data.activity.includes("Program Studi")) {
                let parts = data.activity.split("Program Studi");
                if (parts[1]) prodiText = parts[1].split("Tahun")[0].replace("<br>", "").trim();
            }
            document.getElementById("res-prodi").textContent = prodiText;

            // Pengisian Baris Baru: Perihal & Tahun Akademik Langsung Dari JSON
            document.getElementById("res-perihal").textContent = data.perihal || "Keterangan Aktif Mahasiswa";
            document.getElementById("res-ta").textContent = data.ta || "2025/2026";
            
            // Format Pengisian Nomor Surat (Bersih dari NIM Terpaut)
            let nomor = String(data.nomor || searchInput);
            if (nomor.includes('/')) {
                const parts = nomor.split('/');
                nomor = parts[0].length > 10 ? parts.slice(1).join('/') : nomor;
            }
            document.getElementById("res-nomor-surat").textContent = `${nomor}/FIKes-UF/BAAK/Ket-Mhsw/IV/2026`;

            // Tampilkan Penandatangan Terkini
            document.getElementById("res-penandatangan").innerHTML = `Ahmad Jubaedi, SKM, MKM <br><span style="font-size:0.75rem; color:#64748b; font-weight:400;">(Dekan FIKES - UF)</span>`;

            showView("success");
            lucide.createIcons();
        } else {
            showView("failed");
        }
    }

    // 3. Kontrol Tampilan (Views)
    function showView(v) {
        [viewHome, viewSuccess, viewFailed].forEach(el => el.classList.add("hidden"));
        if (v === "success") viewSuccess.classList.remove("hidden");
        else if (v === "failed") viewFailed.classList.remove("hidden");
        else viewHome.classList.remove("hidden");
    }

    // 4. Peristiwa Aksi (Event Listeners)
    btnVerify.addEventListener("click", () => {
        const certId = inputCertId.value.trim();
        if (certId) window.location.href = `?id=${encodeURIComponent(certId)}`;
    });

    inputCertId.addEventListener("keypress", (e) => { if (e.key === "Enter") btnVerify.click(); });
    
    document.querySelectorAll(".btn-back").forEach(btn => { 
        btn.addEventListener("click", () => { window.location.href = window.location.pathname; }); 
    });

    // Kontrol Pemindai Kamera QR
    btnStartScan.addEventListener("click", () => {
        scannerContainer.classList.remove("hidden");
        btnStartScan.classList.add("hidden");
        startScanner();
    });

    btnCloseScanner.addEventListener("click", () => { stopScanner(); });

    function startScanner() {
        html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, onScanSuccess, () => {});
    }

    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => { 
                scannerContainer.classList.add("hidden"); 
                btnStartScan.classList.remove("hidden"); 
                html5QrCode = null; 
            });
        }
    }

    function onScanSuccess(text) {
        stopScanner();
        let certId = text;
        try {
            if (text.startsWith("http")) {
                const url = new URL(text);
                const idParam = url.searchParams.get("id");
                if (idParam) certId = idParam;
            }
        } catch (e) {}
        window.location.href = `?id=${encodeURIComponent(certId.trim())}`;
    }
});
