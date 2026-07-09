document.addEventListener("DOMContentLoaded", () => {
    const loadingEl = document.getElementById("status-loading");
    const invalidEl = document.getElementById("status-invalid");
    const cardEl = document.getElementById("verification-card");

    // Tangkap parameter '?id=' dari URL browser
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get("id");

    // Jika tidak ada ID di URL langsung anggap invalid
    if (!docId) {
        loadingEl.classList.add("hidden");
        invalidEl.classList.remove("hidden");
        return;
    }

    // Ambil data lokal database.json (berada di folder root yang sama)
    fetch("database.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Gagal memuat database berkas.");
            }
            return response.json();
        })
        .then(data => {
            // Cari kecocokan data berdasarkan kunci (NIM)
            if (data && data[docId]) {
                const docData = data[docId];

                // Pasang teks ke elemen HTML
                document.getElementById("doc-perihal").innerText = docData.perihal || "Surat Keterangan";
                document.getElementById("doc-nomor").innerText = docData.nomor || "-";
                document.getElementById("doc-name").innerText = docData.name || "-";
                document.getElementById("doc-nim").innerText = docId;
                document.getElementById("doc-role").innerText = docData.role || "Mahasiswa";
                document.getElementById("doc-date").innerText = docData.date || "-";
                
                // Mendukung rendering tag HTML <i> atau <br> dari string python
                document.getElementById("doc-activity").innerHTML = docData.activity || "-";

                // Memproses daftar penandatangan secara dinamis
                const signersListContainer = document.getElementById("signers-list");
                signersListContainer.innerHTML = ""; // bersihkan template bawaan

                if (docData.signers && docData.signers.length > 0) {
                    docData.signers.forEach(signer => {
                        const signerDiv = document.createElement("div");
                        signerDiv.className = "signer-item";
                        signerDiv.innerHTML = `
                            <p class="signer-name">${signer.name}</p>
                            <p class="signer-role">${signer.role}</p>
                        `;
                        signersListContainer.appendChild(signerDiv);
                    });
                } else {
                    signersListContainer.innerHTML = "<p class='signer-role'>Tidak ada data penandatangan tercatat.</p>";
                }

                // Tampilkan kartu hasil verifikasi asli
                loadingEl.classList.add("hidden");
                cardEl.classList.remove("hidden");
            } else {
                // Dokumen tidak ditemukan di JSON
                loadingEl.classList.add("hidden");
                invalidEl.classList.remove("hidden");
            }
        })
        .catch(error => {
            console.error("Error System:", error);
            loadingEl.classList.add("hidden");
            invalidEl.classList.remove("hidden");
        });
});
