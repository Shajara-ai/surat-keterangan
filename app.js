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

    let html5QrCode = null;
    let certificateDatabase = null;

    const urlParams = new URLSearchParams(window.location.search);
    const certIdParam = urlParams.get('id');

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

    function verifyCertificate(id) {
        if (!certificateDatabase) { showView("failed"); return; }
        const cleanId = id.trim().toUpperCase();
        const certKey = Object.keys(certificateDatabase).find(key => key.trim().toUpperCase() === cleanId);

        if (certKey && certificateDatabase[cleanId]) {
            const data = certificateDatabase[cleanId];
            
            const resName = document.getElementById("res-name");
            const resId = document.getElementById("res-id");
            const resProdi = document.getElementById("res-prodi");
            const resSemester = document.getElementById("res-semester");
            const resDate = document.getElementById("res-date");
            const resNomorSurat = document.getElementById("res-nomor-surat");
            const resPenandatangan = document.getElementById("res-penandatangan");

            if (resName) resName.textContent = data.name ? data.name.toUpperCase() : "-";
            if (resId) resId.textContent = cleanId;
            if (resDate) resDate.textContent = data.date || "-";
            
            const nomorUrut = data.nomor || "042";
            if (resNomorSurat) resNomorSurat.textContent = `${nomorUrut}/FIKes-UF/BAAK/Ket-Mhsw/IV/2026`;

            if (resPenandatangan) {
                resPenandatangan.innerHTML = `Ahmad Jubaedi, SKM, MKM <br><span style="font-size:0.75rem; color:#64748b; font-weight:400;">(Dekan FIKES - UF)</span>`;
            }

            let rawActivity = data.activity || "";
            let prodiText = "Sarjana Keperawatan";
            let semesterText = "Semester IV / VIII";

            if (rawActivity.includes("Program Studi")) {
                let parts = rawActivity.split("Program Studi");
                if (parts[1]) prodiText = parts[1].split("Tahun")[0].replace("<br>", "").trim();
            }
            if (rawActivity.includes("Semester")) {
                let parts = rawActivity.split("Semester");
                if (parts[1]) semesterText = "Semester " + parts[1].split("Program")[0].replace("<br>", "").trim();
            }

            if (resProdi) resProdi.textContent = prodiText;
            if (resSemester) resSemester.textContent = `${semesterText} (Tahun Akademik 2026/2027)`;

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

    function stopScanner() {
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
