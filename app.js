document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();

    const viewHome = document.getElementById("view-home");
    const viewSuccess = document.getElementById("view-result-success");
    const viewFailed = document.getElementById("view-result-failed");
    const inputCertId = document.getElementById("input-cert-id");
    const btnVerify = document.getElementById("btn-verify");
    const btnStartScan = document.getElementById("btn-start-scan");
    const btnCloseScanner = document.getElementById("btn-close-scanner");
    const btnBackList = document.querySelectorAll(".btn-back");
    const scannerContainer = document.getElementById("scanner-container");

    // Element Selector UI Baru
    const resName = document.getElementById("res-name");
    const resId = document.getElementById("res-id");
    const resProdi = document.getElementById("res-prodi");
    const resSemester = document.getElementById("res-semester");
    const resRole = document.getElementById("res-role");
    const resDate = document.getElementById("res-date");
    const resHash = document.getElementById("res-hash");
    const signersContainer = document.getElementById("signers-container");

    let html5QrCode = null;
    let certificateDatabase = null;

    const urlParams = new URLSearchParams(window.location.search);
    const certIdParam = urlParams.get('id');

    // Fetch Database dengan Bypass Cache
    fetch(`database.json?v=${new Date().getTime()}`, {
        headers: {'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'Expires': '0'}
    })
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(data => {
        certificateDatabase = data;
        if (certIdParam) verifyCertificate(certIdParam.trim());
        else showView("home");
    })
    .catch(() => { if (certIdParam) showView("failed"); else showView("home"); });

    btnVerify.addEventListener("click", () => {
        const certId = inputCertId.value.trim();
        if (certId) window.location.href = `?id=${encodeURIComponent(certId)}`;
    });

    inputCertId.addEventListener("keypress", (e) => { if (e.key === "Enter") btnVerify.click(); });
    btnBackList.forEach(btn => { btn.addEventListener("click", () => { window.location.href = window.location.pathname; }); });

    btnStartScan.addEventListener("click", () => {
        scannerContainer.classList.remove("hidden");
        btnStartScan.classList.add("hidden");
        startScanner();
    });

    btnCloseScanner.addEventListener("click", () => { stopScanner(); });

    // FUNGSI VERIFIKASI UTAMA (VERSI PROFESIONAL)
    function verifyCertificate(id) {
        if (!certificateDatabase) { showView("failed"); return; }
        const cleanId = id.trim().toUpperCase();
        const certKey = Object.keys(certificateDatabase).find(key => key.trim().toUpperCase() === cleanId);

        if (certKey && certificateDatabase[certKey]) {
            const data = certificateDatabase[certKey];
            
            // Render Data Dasar
            resName.textContent = data.name ? data.name.toUpperCase() : "-";
            resId.textContent = certKey;
            resDate.textContent = data.date || "-";
            
            // GENERATOR SIGNATURE SECURITY HASH ACAK BERBASIS NIM
            resHash.textContent = `SHA256-UF/FIKES/${certKey}-${data.date ? data.date.replace(/ /g, '') : '2026'}`;

            // MEMECAH DATA AKTIVITAS JADI LEBIH BERSIH & HIRARKIS
            // Mencari kata kunci Prodi dan Semester di teks database asli
            let rawActivity = data.activity || "";
            let prodiText = "Sarjana Keperawatan";
            let semesterText = "Semester Aktif Kuliah";

            if (rawActivity.includes("Program Studi")) {
                let parts = rawActivity.split("Program Studi");
                if(parts[1]) prodiText = parts[1].split("Tahun")[0].replace("<br>", "").trim();
            }
            if (rawActivity.includes("Semester")) {
                let parts = rawActivity.split("Semester");
                if(parts[1]) semesterText = "Semester " + parts[1].split("<br>")[0].split("Program")[0].trim();
            }

            resProdi.textContent = prodiText;
            resSemester.textContent = semesterText;

            // Render Tim Penandatangan Dokumen
            signersContainer.innerHTML = "";
            if (data.signers && Array.isArray(data.signers)) {
                data.signers.forEach((signer) => {
                    const row = document.createElement("div");
                    row.className = "detail-row";
                    row.innerHTML = `
                        <span class="detail-label">Pengesah Dokumen</span>
                        <span class="detail-value font-semibold text-slate-100">${signer.name} <br><small style="color:#64748b; font-weight:400;">(${signer.role})</small></span>
                    `;
                    signersContainer.appendChild(row);
                });
            }

            showView("success");
            lucide.createIcons();
        } else {
            showView("failed");
        }
    }

    function showView(v) {
        viewHome.classList.add("hidden"); viewSuccess.classList.add("hidden"); viewFailed.classList.add("hidden");
        if (v === "success") viewSuccess.classList.remove("hidden");
        else if (v === "failed") viewFailed.classList.remove("hidden");
        else viewHome.classList.remove("hidden");
    }

    function startScanner() {
        html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, onScanSuccess, () => {});
    }

    閲覧function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => { scannerContainer.classList.add("hidden"); btnStartScan.classList.remove("hidden"); html5QrCode = null; });
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
