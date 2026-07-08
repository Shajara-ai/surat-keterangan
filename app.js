// DOM Elements Mapping
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

// Fungsi Navigasi Antar Tampilan (View)
function showView(viewName) {
    Object.keys(views).forEach(key => {
        if (views[key]) views[key].classList.add('hidden');
    });
    if (views[viewName]) {
        views[viewName].classList.remove('hidden');
    }
}

// Logika Inti Verifikasi & Format Penggabungan String Data
function verifyDocument(id) {
    if (!id) return;
    
    showView("loading");
    
    // Memberikan delay efek transisi loading premium (600ms)
    setTimeout(() => {
        const cleanId = id.trim().toUpperCase();
        
        // Pencarian Key secara Case-Insensitive (NIM)
        const docKey = Object.keys(documentDatabase).find(
            key => key.trim().toUpperCase() === cleanId
        );

        if (docKey && documentDatabase[docKey]) {
            const data = documentDatabase[docKey];
            
            // 1. Logika Penggabungan Otomatis Nomor Surat Lengkap
            let nomorLengkap = data.nomor || "-";
            if (data.nomor && data.kode && data.bulan) {
                // Digabung menjadi format: 2909/FIKes-UF/BAAK/Ket-Mhsw/VII/2026
                nomorLengkap = `${data.nomor}/${data.kode}/${data.bulan}/2026`;
            } else if (data.nomor && data.nomor.includes("/")) {
                nomorLengkap = data.nomor;
            }
            
            // 2. Data Binding ke Komponen Halaman Web
            if (dataFields.name) dataFields.name.textContent = data.name || "-";
            if (dataFields.nim) dataFields.nim.textContent = docKey || "-";
            if (dataFields.prodi) dataFields.prodi.textContent = data.activity || "-"; // Memetakan "Program Studi..."
            if (dataFields.perihal) dataFields.perihal.textContent = data.perihal || "-";
            if (dataFields.ta) dataFields.ta.textContent = data.ta || "-";
            if (dataFields.nomor) dataFields.nomor.textContent = nomorLengkap;

            // 3. Render Elemen Penandatangan Polos/Flat Tanpa Box
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

            if (typeof stopScanner === "function") stopScanner();
            showView("success");
        } else {
            if (typeof stopScanner === "function") stopScanner();
            showView("error");
        }
    }, 600);
}

// Event Listener tombol cari manual
if (btnSearch && searchInput) {
    btnSearch.addEventListener('click', () => {
        const targetId = searchInput.value;
        if (targetId.trim() !== "") {
            verifyDocument(targetId);
        }
    });

    // Jalankan pencarian jika tombol Enter ditekan di dalam input
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const targetId = searchInput.value;
            if (targetId.trim() !== "") {
                verifyDocument(targetId);
            }
        }
    });
}

// Event Listener tombol kembali / reset ulang pencarian
btnBackList.forEach(btn => {
    btn.addEventListener('click', () => {
        if (searchInput) searchInput.value = "";
        showView("search");
        if (typeof startScanner === "function") startScanner();
    });
});
