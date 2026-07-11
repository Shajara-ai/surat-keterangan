// ==============================================================================
// 🌐 CONFIGURATION & GLOBAL VARIABLES
// ==============================================================================
const CONFIG = {
    databaseUrl: "database.json", // File database.json di root GitHub Pages
    autoTimeoutUrl: 3000
};

let documentDatabase = {};
let html5QrcodeScanner = null;

// ==============================================================================
// 🛠️ DOM ELEMENTS (DISESUAIKAN DENGAN HTML BARU)
// ==============================================================================
const views = {
    loading: document.getElementById("view-loading"),
    scan: document.getElementById("view-home"),               // Sesuai HTML: view-home
    success: document.getElementById("view-result-success"),  // Sesuai HTML: view-result-success
    error: document.getElementById("view-result-failed")      // Sesuai HTML: view-result-failed
};

const inputManualId = document.getElementById("input-cert-id"); // Sesuai HTML: input-cert-id
const btnVerifyManual = document.getElementById("btn-verify");   // Sesuai HTML: btn-verify
const btnStartScan = document.getElementById("btn-start-scan");
const btnCloseScanner = document.getElementById("btn-close-scanner");
const scannerContainer = document.getElementById("scanner-container");

// Elements penampung data sukses (Sesuai ID di HTML baru)
const dataFields = {
    nomor: document.getElementById("res-id"),         // Sesuai HTML: res-id
    perihal: document.getElementById("res-perihal"),   // Sesuai HTML: res-perihal
    name: document.getElementById("res-name"),         // Sesuai HTML: res-name
    nim: document.getElementById("res-nim"),           // Sesuai HTML: res-nim
    prodi: document.getElementById("res-prodi"),       // Sesuai HTML: res-prodi
    ta: document.getElementById("res-ta"),             // Sesuai HTML: res-ta
};
const signersContainer = document.getElementById("signers-container");

// ==============================================================================
// 🔀 VIEW SWITCHER
// ==============================================================================
function showView(viewName) {
    Object.keys(views).forEach(key => {
        if (views[key]) views[key].classList.add("hidden");
    });
    if (views[viewName]) {
        views[viewName].classList.remove("hidden");
    }
    // Inisialisasi ulang Lucide Icons jika ada komponen baru yang muncul
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==============================================================================
// 📥 LOAD DATABASE ONLINE
// ==============================================================================
async function loadDatabase() {
    showView("loading");
    try {
        const response = await fetch(`${CONFIG.databaseUrl}?t=${new Date().getTime()}`);
        if (!response.ok) throw new Error(`Gagal memuat database.`);
        documentDatabase = await response.json();
        console.log("📊 Sinkronisasi Database Berhasil.");
        checkUrlParameter();
    } catch (error) {
        console.error("❌ Error Database:", error);
        showView("error");
    }
}

// ==============================================================================
// 🔍 CORE VERIFICATION LOGIC
// ==============================================================================
function verifyDocument(id) {
    if (!id) return;
    
    const cleanId = id.trim().toUpperCase();
    
    // Pencarian Key secara Case-Insensitive
    const docKey = Object.keys(documentDatabase).find(
        key => key.trim().toUpperCase() === cleanId
    );

    if (docKey && documentDatabase[docKey]) {
        const data = documentDatabase[docKey];
        
        // Data Binding ke Elemen HTML Baru
        if (dataFields.nomor) dataFields.nomor.textContent = data.nomor || "-";
        if (dataFields.perihal) dataFields.perihal.textContent = data.perihal || "-";
        if (dataFields.name) dataFields.name.textContent = data.name || "-";
        if (dataFields.nim) dataFields.nim.textContent = docKey || "-";
        if (dataFields.prodi) dataFields.prodi.textContent = data.activity || "-"; 
        if (dataFields.ta) dataFields.ta.textContent = data.ta || "-";

        // Render Elemen Penandatangan secara dinamis (Flat & Tanpa Jabatan)
        signersContainer.innerHTML = "";
        if (data.signers && Array.isArray(data.signers) && data.signers.length > 0) {
            data.signers.forEach((signer) => {
                const signerName = signer.name || "-";
                signersContainer.innerHTML += `
                    <div class="font-semibold text-slate-100" style="font-size: 0.95rem;">${signerName}</div>
                `;
            });
        } else {
            // Fallback nama Pejabat murni jika array penandatangan kosong
            signersContainer.innerHTML = `
                <div class="font-semibold text-slate-100" style="font-size: 0.95rem;">Ahmad Jubaedi, SKM, MKM</div>
            `;
        }

        stopScanner();
        showView("success");
    } else {
        stopScanner();
        showView("error");
    }
}

// ==============================================================================
// 📷 QR CODE SCANNER OPERATIONS
// ==============================================================================
function startScanner() {
    if (html5QrcodeScanner) return;

    scannerContainer.classList.remove("hidden");
    html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", // Sesuai HTML baru: qr-reader
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true
        },
        false
    );
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
            scannerContainer.classList.add("hidden");
        }).catch(err => {
            console.error(err);
            html5QrcodeScanner = null;
        });
    }
}

function onScanSuccess(decodedText) {
    try {
        if (decodedText.includes("?id=")) {
            const urlParams = new URLSearchParams(decodedText.split("?")[1]);
            const idParam = urlParams.get("id");
            if (idParam) {
                verifyDocument(idParam);
                return;
            }
        }
    } catch (e) {
        console.error(e);
    }
    verifyDocument(decodedText);
}

function onScanFailure(error) {
    // Diabaikan untuk efisiensi scanning loop
}

function checkUrlParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
        verifyDocument(id);
    } else {
        showView("scan");
    }
}

// ==============================================================================
// 🎛️ INITIALIZATION & EVENT LISTENERS
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Jalankan pemuatan database pertama kali
    loadDatabase();

    // Inisialisasi awal icon Lucide SVG
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Event Tombol Cari Manual
    if (btnVerifyManual) {
        btnVerifyManual.addEventListener("click", () => {
            verifyDocument(inputManualId.value.trim());
        });
    }

    if (inputManualId) {
        inputManualId.addEventListener("keypress", (e) => {
            if (e.key === "Enter") verifyDocument(inputManualId.value.trim());
        });
    }

    // Event Aktivasi Scanner Kamera
    if (btnStartScan) {
        btnStartScan.addEventListener("click", startScanner);
    }

    if (btnCloseScanner) {
        btnCloseScanner.addEventListener("click", stopScanner);
    }

    // Event Handler untuk seluruh tombol kelas 'btn-back' (Kembali ke Awal)
    document.querySelectorAll(".btn-back").forEach(btn => {
        btn.addEventListener("click", () => {
            if (inputManualId) inputManualId.value = "";
            window.history.replaceState({}, document.title, window.location.pathname);
            stopScanner();
            showView("scan");
        });
    });
});
