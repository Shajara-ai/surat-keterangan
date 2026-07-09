// ==============================================================================
// 🏢 1. DOM ELEMENTS MAPPING & VARIABLE INITIALIZATION
// ==============================================================================
const views = {
    search: document.getElementById('view-search'),
    loading: document.getElementById('view-loading'),
    success: document.getElementById('view-result-success'),
    error: document.getElementById('view-result-error')
};

const dataFields = {
    name: document.getElementById('res-name'),
    nim: document.getElementById('res-nim'),
    prodi: document.getElementById('res-prodi'),
    perihal: document.getElementById('res-perihal'),
    ta: document.getElementById('res-ta'),
    nomor: document.getElementById('res-id')
};

const signersContainer = document.getElementById('signers-container');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const btnBackList = document.querySelectorAll('.btn-back');
const btnToggleCamera = document.getElementById('btn-toggle-camera');

let html5QrcodeScanner = null;
let currentCameraId = null;
let availableCameras = [];

// ==============================================================================
// 🕹️ 2. VIEW CONTROLLER (NAVIGASI TAMPILAN)
// ==============================================================================
function showView(viewName) {
    Object.keys(views).forEach(key => {
        if (views[key]) views[key].classList.add('hidden');
    });
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
}

// ==============================================================================
// 🔍 3. CORE VERIFICATION LOGIC (VERIFIKASI DATA)
// ==============================================================================
function verifyDocument(id) {
    if (!id) return;
    
    showView("loading");
    
    // Delay kelancaran UI transisi premium (600ms)
    setTimeout(() => {
        const cleanId = id.trim().toUpperCase();
        
        // Pencarian Key NIM secara Case-Insensitive di database.js
        const docKey = Object.keys(documentDatabase).find(
            key => key.trim().toUpperCase() === cleanId
        );

        if (docKey && documentDatabase[docKey]) {
            const data = documentDatabase[docKey];
            
            // Logika Penyusunan Format Nomor Surat Panjang secara Dinamis
            let nomorLengkap = data.nomor || "-";
            if (data.nomor && data.kode && data.bulan) {
                nomorLengkap = `${data.nomor}/${data.kode}/${data.bulan}/2026`;
            } else if (data.nomor && data.nomor.includes("/")) {
                nomorLengkap = data.nomor;
            }
            
            // Data Binding ke Elemen Tampilan Hasil Dokumen
            if (dataFields.name) dataFields.name.textContent = data.name || "-";
            if (dataFields.nim) dataFields.nim.textContent = docKey || "-";
            if (dataFields.prodi) dataFields.prodi.textContent = data.activity || "-"; 
            if (dataFields.perihal) dataFields.perihal.textContent = data.perihal || "-";
            if (dataFields.ta) dataFields.ta.textContent = data.ta || "-";
            if (dataFields.nomor) dataFields.nomor.textContent = nomorLengkap;

            // Render Tanda Tangan Flat (Polos Tanpa Box Menumpuk)
            signersContainer.innerHTML = "";
            if (data.signers && Array.isArray(data.signers) && data.signers.length > 0) {
                data.signers.forEach((signer) => {
                    const signerName = signer.name || "-";
                    signersContainer.innerHTML += `
                        <div style="font-size: 0.95rem; font-weight: 600; color: #f8fafc; padding: 2px 0;">${signerName}</div>
                    `;
                });
            } else {
                signersContainer.innerHTML = `
                    <div style="font-size: 0.95rem; font-weight: 600; color: #f8fafc; padding: 2px 0;">Ahmad Jubaedi, SKM, MKM</div>
                `;
            }

            stopScanner();
            showView("success");
        } else {
            stopScanner();
            showView("error");
        }
    }, 600);
}

// ==============================================================================
// 📷 4. QR CODE CAMERA SCANNER ENGINE (HTML5-QRCODE)
// ==============================================================================
function startScanner() {
    if (!document.getElementById('qr-reader')) return;

    Html5Qrcode.getCameras().then(cameras => {
        availableCameras = cameras;
        if (cameras && cameras.length > 0) {
            // Pilih kamera belakang jika tersedia, jika tidak pilih kamera pertama
            const backCamera = cameras.find(cam => cam.label.toLowerCase().includes('back') || cam.label.toLowerCase().includes('environment'));
            currentCameraId = backCamera ? backCamera.id : cameras[0].id;
            
            initQrReader(currentCameraId);
        } else {
            console.warn("-> [SCANNER] Kamera tidak terdeteksi pada perangkat.");
        }
    }).catch(err => {
        console.error("-> [SCANNER] Gagal memuat daftar kamera.", err);
    });
}

function initQrReader(cameraId) {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => {
            mountQrReader(cameraId);
        }).catch(() => {
            mountQrReader(cameraId);
        });
    } else {
        mountQrReader(cameraId);
    }
}

function mountQrReader(cameraId) {
    html5QrcodeScanner = new Html5Qrcode("qr-reader");
    html5QrcodeScanner.start(
        cameraId,
        {
            fps: 15,
            qrbox: (width, height) => {
                const minEdge = Math.min(width, height);
                const size = Math.floor(minEdge * 0.65);
                return { width: size, height: size };
            }
        },
        (decodedText) => {
            // Callback ketika QR Code sukses terbaca
            if (decodedText) {
                // Ekstrak NIM dari teks QR jika berbentuk URL/Link utuh
                let scannedId = decodedText;
                if (decodedText.includes("id=")) {
                    const urlParams = new URLSearchParams(decodedText.split('?')[1]);
                    scannedId = urlParams.get('id') || decodedText;
                } else if (decodedText.includes("/")) {
                    scannedId = decodedText.substring(decodedText.lastIndexOf("/") + 1);
                }
                verifyDocument(scannedId);
            }
        },
        (errorMessage) => {
            // Abaikan verbose scan log agar performa tetap ringan
        }
    ).catch(err => {
        console.error("-> [SCANNER] Gagal memulai instansiasi modul kamera.", err);
    });
}

function stopScanner() {
    if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
        html5QrcodeScanner.stop().catch(err => console.warn("-> [SCANNER] Gagal menghentikan kamera.", err));
    }
}

// Fitur Ganti Kamera (Switch Camera Toggle)
if (btnToggleCamera) {
    btnToggleCamera.addEventListener('click', () => {
        if (availableCameras.length > 1) {
            const currentIndex = availableCameras.findIndex(cam => cam.id === currentCameraId);
            const nextIndex = (currentIndex + 1) % availableCameras.length;
            currentCameraId = availableCameras[nextIndex].id;
            initQrReader(currentCameraId);
        }
    });
}

// ==============================================================================
// ⌨️ 5. MANUAL SEARCH & BUTTON EVENT LISTENERS
// ==============================================================================
if (btnSearch && searchInput) {
    btnSearch.addEventListener('click', () => {
        if (searchInput.value.trim() !== "") verifyDocument(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && searchInput.value.trim() !== "") {
            verifyDocument(searchInput.value);
        }
    });
}

btnBackList.forEach(btn => {
    btn.addEventListener('click', () => {
        if (searchInput) searchInput.value = "";
        showView("search");
        startScanner();
    });
});

// Inisialisasi awal saat halaman web selesai dimuat murni
document.addEventListener("DOMContentLoaded", () => {
    startScanner();
});
