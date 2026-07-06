document.addEventListener("DOMContentLoaded", function () {
    // Ambil parameter '?id=' dari URL browser
    const urlParams = new URLSearchParams(window.location.search);
    const idMahasiswa = urlParams.get('id');

    const loader = document.getElementById("loader");
    const statusValid = document.getElementById("status-valid");
    const statusInvalid = document.getElementById("status-invalid");

    // Jika parameter ID kosong langsung lempar ke status invalid
    if (!idMahasiswa) {
        loader.classList.add("hidden");
        statusInvalid.classList.remove("hidden");
        return;
    }

    // --- SESUAIKAN URL DI BAWAH INI DENGAN REPO GITHUB ANDA ---
    // Gunakan URL mentah (raw.githubusercontent) agar bypass cache dan selalu realtime
    const GITHUB_USERNAME = "Shajara-ai";
    const REPO_NAME = "surat-keterangan";
    const BRANCH = "main";
    
    const jsonUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}/database.json?nocache=` + new Date().getTime();

    // Mengambil data dari database.json di repositori GitHub (Bebas Cache)
    fetch(jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error("Gagal memuat basis data dari GitHub.");
            return response.json();
        })
        .then(data => {
            loader.classList.add("hidden");
            
            // Periksa apakah ID/NIM mahasiswa terdaftar di database
            if (data && data[idMahasiswa]) {
                const mhs = data[idMahasiswa];
                
                // Distribusikan data teks ke elemen HTML terkait
                document.getElementById("view-nama").innerText = mhs.nama;
                document.getElementById("view-nim").innerText = mhs.nim;
                document.getElementById("view-prodi").innerText = mhs.programStudi;
                document.getElementById("view-kelas").innerText = mhs.jenisKelas;
                document.getElementById("view-status").innerText = mhs.statusAktif;
                document.getElementById("view-nosurat").innerText = mhs.nomorSurat;
                document.getElementById("view-tglsurat").innerText = mhs.tanggalSurat;

                // Tampilkan container valid
                statusValid.classList.remove("hidden");
            } else {
                // Tampilkan container jika data mahasiswa tidak ada
                statusInvalid.classList.remove("hidden");
            }
        })
        .catch(error => {
            console.error("Error Verification System:", error);
            loader.classList.add("hidden");
            statusInvalid.classList.remove("hidden");
        });
});
