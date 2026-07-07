document.addEventListener("DOMContentLoaded", () => {
    // 1. Ambil parameter '?id=...' dari URL browser
    const urlParams = new URLSearchParams(window.location.search);
    const certId = urlParams.get('id');

    // Elemen HTML yang akan dimanipulasi
    const loadingEl = document.getElementById("loading");
    const successView = document.getElementById("view-success");
    const failedView = document.getElementById("view-failed");

    // Jika tidak ada ID di URL, langsung tampilkan pesan error
    if (!certId) {
        if (loadingEl) loadingEl.classList.add("hidden");
        if (failedView) failedView.classList.remove("hidden");
        return;
    }

    // 2. Ambil data secara real-time dari database.json di GitHub Pages
    fetch('database.json?nocache=' + new Date().getTime()) // Trik ?nocache agar browser selalu ambil data terbaru
        .then(response => {
            if (!response.ok) {
                throw new Error("Gagal memuat database.");
            }
            return response.json();
        })
        .then(data => {
            if (loadingEl) loadingEl.classList.add("hidden");
            
            # 3. Cari data berdasarkan nomor surat (menghindari masalah spasi)
            const targetKey = Object.keys(data).find(key => key.trim().toLowerCase() === certId.trim().toLowerCase());
            
            if (targetKey) {
                const mhs = data[targetKey];
                
                // Masukkan data mahasiswa ke elemen HTML masing-masing
                document.getElementById("res-nama").textContent = mhs.name;
                document.getElementById("res-nim").textContent = mhs.nim;
                document.getElementById("res-prodi").textContent = mhs.prodi;
                document.getElementById("res-semester").textContent = mhs.semester;
                document.getElementById("res-id").textContent = targetKey;
                
                // Tampilkan container sukses
                if (successView) successView.classList.remove("hidden");
            } else {
                // Jika nomor surat tidak ditemukan di json
                if (failedView) failedView.classList.remove("hidden");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            if (loadingEl) loadingEl.classList.add("hidden");
            if (failedView) failedView.classList.remove("hidden");
        });
});
