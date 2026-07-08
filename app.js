// FUNGSI VERIFIKASI UTAMA (VERSI BERSIH TANPA HASH)
    function verifyCertificate(id) {
        if (!certificateDatabase) { showView("failed"); return; }
        const cleanId = id.trim().toUpperCase();
        const certKey = Object.keys(certificateDatabase).find(key => key.trim().toUpperCase() === cleanId);

        if (certKey && certificateDatabase[certKey]) {
            const data = certificateDatabase[certKey];
            
            // 1. Ambil Selector Elemen HTML Baru
            const resName = document.getElementById("res-name");
            const resId = document.getElementById("res-id");
            const resProdi = document.getElementById("res-prodi");
            const resSemester = document.getElementById("res-semester");
            const resDate = document.getElementById("res-date");
            const resNomorSurat = document.getElementById("res-nomor-surat");
            const resPenandatangan = document.getElementById("res-penandatangan");

            // 2. Isi Data Nama, NIM, dan Tanggal Terbit
            if (resName) resName.textContent = data.name ? data.name.toUpperCase() : "-";
            if (resId) resId.textContent = certKey;
            if (resDate) resDate.textContent = data.date || "-";
            
            // 3. Gabungkan Nomor Surat Resmi (Default pakai contoh format Anda jika kolom nomor di excel kosong)
            const nomorUrut = data.nomor || "042";
            if (resNomorSurat) resNomorSurat.textContent = `${nomorUrut}/FIKes-UF/BAAK/Ket-Mhsw/IV/2026`;

            // 4. Set Nama Dekan Baru secara Langsung
            if (resPenandatangan) {
                resPenandatangan.innerHTML = `Ahmad Jubaedi, SKM, MKM<br><small style="color: #64748b; font-weight: 400;">(Dekan FIKES - UF)</small>`;
            }

            // 5. Memecah Isi Kolom Teks Aktivitas dari Excel secara Pintar
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
