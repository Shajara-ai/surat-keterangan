// ==============================================================================
// 🌐 CONFIGURATION & GLOBAL VARIABLES
// ==============================================================================
const CONFIG = {
    databaseUrl: "database.json", // File database.json di root GitHub Pages
    autoTimeoutUrl: 3000 // Jeda waktu otomatis beralih halaman jika diperlukan
};

let documentDatabase = {};
let html5QrcodeScanner = null;

// ==============================================================================
// 🛠️ DOM ELEMENTS
// ==============================================================================
const views = {
    loading: document.getElementById("view-loading"),
    scan: document.getElementById("view-scan"),
    success: document.getElementById("view-success"),
    error: document.getElementById("view-error")
};

const inputManualId = document.getElementById("input-manual-id");
const btnVerifyManual = document.getElementById("btn-verify-manual");
const btnBackFromSuccess = document.getElementById("btn-back-success");
const btnBackFromError = document.getElementById("btn-back-error");
const errorMessageEl = document.getElementById("error-message");

// Elements untuk success data binding
const dataFields = {
    nomor: document.getElementById("data-nomor"),
    perihal: document.getElementById("data-perihal"),
    name: document.getElementById("data-name"),
    role: document.getElementById("data-role"),
    activity: document.getElementById("data-activity"),
    ta: document.getElementById("data-ta"),
    date: document.getElementById("data-date")
};
const signersContainer = document.getElementById("signers-container");

// ==============================================================================
// 🔀 VIEW SWITCHER MURNI
// ==============================================================================
function showView(viewName) {
    Object.keys(views).forEach(key => {
        if (views[key]) {
            views[key].classList.add("hidden");
        }
    });
    if (views[viewName]) {
        views[viewName].classList.remove("hidden");
    }
}

// ==============================================================================
// 📥 DATA FETCHING (LOAD DATABASE)
// ==============================================================================
async function loadDatabase() {
    showView("loading");
    try {
        // Ambil data database.json dengan cache-busting agar selalu fresh dari server
        const response = await fetch(`${CONFIG.databaseUrl}?t=${new Date().getTime()}`);
        if (!response.ok) {
            throw new Error(`Gagal memuat database online. Status: ${response.status}`);
        }
        documentDatabase = await response.json();
        console.log("📊 Database online berhasil disinkronkan:", Object.keys(documentDatabase).length, "data termuat.");
        
        // Periksa parameter ID di URL Web (?id=NIM)
        checkUrlParameter();
    } catch (error) {
        console.error("❌ Error Database:", error);
        showErrorPage("Gagal sinkronisasi data dengan server cloud Git. Silakan muat ulang halaman.");
    }
}

// ==============================================================================
// 🔍 CORE VERIFICATION LOGIC
// ==============================================================================
function verifyDocument(id) {
    if (!id) return;
    
    const cleanId = id.trim().toUpperCase();
    
    // Cari KEY (NIM) di database secara Case-Insensitive
    const docKey = Object.keys(documentDatabase).find(
        key => key.trim().toUpperCase() === cleanId
    );

    if (docKey && documentDatabase[docKey]) {
        const data = documentDatabase[docKey];
        
        // 1. Data Binding ke Komponen UI DOM
        dataFields.nomor.textContent = data.nomor || "-";
        dataFields.perihal.textContent = data.perihal || "-";
        dataFields.name.textContent = data.name || "-";
        dataFields.role.textContent = data.role || "-";
        dataFields.activity.textContent = data.activity || "-";
        dataFields.ta.textContent = data.ta || "-";
        dataFields.date.textContent = data.date || "-";

        // 2. Render Elemen Penandatangan secara dinamis (Flat & Bersih tanpa kotak)
        signersContainer.innerHTML = "";
        if (data.signers && Array.isArray(data.signers) && data.signers.length > 0) {
            data.signers.forEach((signer) => {
                const signerName = signer.name || "-";
                const labelRole = signer.role || "";
                
                let htmlContent = `<div class="font-semibold text-slate-100">${signerName}</div>`;
                if (labelRole.trim() !== "") {
                    htmlContent += `<div class="text-sm text-slate-400 mt-0.5">${labelRole}</div>`;
                }
                signersContainer.innerHTML += htmlContent;
            });
        } else {
            // Fallback murni hanya nama Pejabat jika array penandatangan di JSON kosong
            signersContainer.innerHTML = `
                <div class="font-semibold text-slate-100">Ahmad Jubaedi, SKM, MKM</div>
            `;
        }

        // 3. Matikan kamera scanner jika aktif sebelum pindah halaman
        stopScanner();
        
        // 4. Langsung beralih ke layar sukses verifikasi
        showView("success");
    } else {
        stopScanner();
        showErrorPage(`Dokumen dengan nomor identitas/NIM "${cleanId}" tidak terdaftar di sistem FIKes.`);
    }
}

function showErrorPage(message) {
    errorMessageEl.textContent = message;
    showView("error");
}

// ==============================================================================
// 📷 QR CODE SCANNER (HTML5-QRCODE)
// ==============================================================================
function startScanner() {
    if (html5QrcodeScanner) return;

    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader", 
        { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        /* verbose= */ false
    );
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
        }).catch(err => {
            console.error("Gagal mematikan modul kamera scanner:", err);
            html5QrcodeScanner = null;
        });
    }
}

function onScanSuccess(decodedText, decodedResult) {
    console.log(`🎯 QR Terdeteksi: ${decodedText}`);
    
    // Logika ekstrak ID jika hasil scan berupa link URL penuh (?id=NIM)
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
        console.error("Gagal melakukan parsing URL QR Code:", e);
    }

    // Jika isi QR murni teks NIM langsung, eksekusi langsung
    verifyDocument(decodedText);
}

function onScanFailure(error) {
    // Diabaikan saja agar tidak membanjiri log konsol saat mencari kode QR
}

// ==============================================================================
// 🔗 URL PARAMETER CHECKER
// ==============================================================================
function checkUrlParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    
    if (id) {
        verifyDocument(id);
    } else {
        // Jika tidak ada parameter ID di URL, tampilkan halaman scan utama
        showView("scan");
        startScanner();
    }
}

// ==============================================================================
// 🎛️ EVENT LISTENERS INTERFACES
// ==============================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Load data utama saat aplikasi pertama kali dibuka
    loadDatabase();

    // Event input manual via tombol verifikasi teks
    btnVerifyManual.addEventListener("click", () => {
        const manualId = inputManualId.value.trim();
        if (manualId) {
            verifyDocument(manualId);
        }
    });

    // Deteksi tombol enter pada keyboard di input manual
    inputManualId.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const manualId = inputManualId.value.trim();
            if (manualId) verifyDocument(manualId);
        }
    });

    // Tombol kembali ke sistem utama dari halaman sukses
    btnBackFromSuccess.addEventListener("click", () => {
        inputManualId.value = "";
        // Bersihkan parameter ID di address bar browser tanpa memuat ulang halaman
        window.history.replaceState({}, document.title, window.location.pathname);
        showView("scan");
        startScanner();
    });

    // Tombol kembali ke sistem utama dari halaman error
    btnBackFromError.addEventListener("click", () => {
        inputManualId.value = "";
        window.history.replaceState({}, document.title, window.location.pathname);
        showView("scan");
        startScanner();
    });
});
