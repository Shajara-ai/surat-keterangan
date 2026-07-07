document.addEventListener("DOMContentLoaded", () => {
    // 1. Ambil parameter '?id=...' (NIM) dari URL browser hasil scan QR
    const urlParams = new URLSearchParams(window.location.search);
    const certId = urlParams.get('id');

    // Elemen HTML penampung status dan data
    const loadingEl = document.getElementById("loading");
    const successView = document.getElementById("view-success");
    const failedView = document.getElementById("view-failed");

    // Jika tidak ada ID di URL, langsung tampilkan status tidak valid
    if (!certId) {
        if (loadingEl) loadingEl.classList.add("hidden");
        if (failedView) failedView.classList.remove("hidden");
        return;
    }

    // 2. Ambil data secara real-time dari database.json
    // Ditambahkan parameter nocache agar browser HP tidak menyimpan memori lama (selalu ambil data terbaru)
    fetch('database.json?nocache=' + new Date().getTime())
        .then(response => {
            if (!response.ok) {
                throw new Error("Gagal memuat database.");
            }
            return response.json();
        })
        .then(data => {
            if (loadingEl) loadingEl.classList.add("hidden");
            
            // 3. Cari data berdasarkan NIM (menghindari masalah spasi tak sengaja)
            const targetKey = Object.keys(data).find(key => key.trim().toLowerCase() === certId.trim().toLowerCase());
            
            if (targetKey) {
                const mhs = data[targetKey];
                
                // 4. Masukkan data ke elemen HTML sesuai variabel camelCase database Anda
                document.getElementById("res-nama").textContent = mhs.nama || "-";
                document.getElementById("res-nim").textContent = mhs.nim || "-";
                document.getElementById("res-prodi").textContent = mhs.programStudi || "-";
                document.getElementById("res-semester").textContent = mhs.jenisKelas || "-"; // Menampilkan tipe kelas (Reguler/Nonreg)
                document.getElementById("res-id").textContent = mhs.nomorSurat || "-"; // Menampilkan Nomor Surat
                
                // Tampilkan container sukses (Dokumen Asli)
                if (successView) successView.classList.remove("hidden");
            } else {
                // Jika NIM tidak ditemukan di dalam database.json
                if (failedView) failedView.classList.remove("hidden");
            }
        })
        .catch(err => {
            console.error("Error:", err);
            if (loadingEl) loadingEl.classList.add("hidden");
            if (failedView) failedView.classList.remove("hidden");
        });
});
