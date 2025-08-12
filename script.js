// ======= Konfigurasi =======
const PASSWORD = "tcr2025"; // Ganti password login sesuai kebutuhan
const API_URL = "https://script.google.com/macros/s/AKfycbwIh7PWcTplTYoqTFlTf0usIyB4fZaOwx9TQjQpyA-kDRfblS7AtuRLw-Xz-vNDoYww/exec"; // URL dari Apps Script deploy

// ======= Login =======
document.addEventListener("DOMContentLoaded", () => {
  const loginPage = document.getElementById("login-page");
  const dashboard = document.getElementById("dashboard");
  const loginBtn = document.getElementById("login-btn");
  const passwordInput = document.getElementById("password");

  loginBtn.addEventListener("click", () => {
    if (passwordInput.value === PASSWORD) {
      loginPage.style.display = "none";
      dashboard.style.display = "block";
      loadData();
    } else {
      alert("Password salah!");
    }
  });
});

// ======= Ambil Data dari Google Sheet =======
async function loadData() {
  try {
    const res = await fetch(API_URL + "?action=getData");
    const data = await res.json();
    renderTable(data);
    updateSummary(data);
  } catch (err) {
    console.error(err);
    alert("Gagal memuat data");
  }
}

// ======= Render Tabel =======
function renderTable(data) {
  const tableBody = document.querySelector("#data-table tbody");
  tableBody.innerHTML = "";

  data.forEach((row, index) => {
    let tr = document.createElement("tr");

    row.forEach((cell, colIndex) => {
      let td = document.createElement("td");
      td.textContent = cell;

      // Kolom yang boleh diedit: status, nama staff, nama pengambil, no hp pengambil, no id card pengambil, keterangan
      if ([5, 6, 7, 8, 9, 10].includes(colIndex)) {
        td.contentEditable = true;
        td.addEventListener("blur", () => {
          saveEdit(index, colIndex, td.textContent);
        });
      }

      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  });

  // Fitur Pencarian
  document.getElementById("search").addEventListener("input", function () {
    const keyword = this.value.toLowerCase();
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach(row => {
      const cells = row.querySelectorAll("td");
      const match = [...cells].some((cell, idx) => {
        return (idx === 1 || idx === 2 || idx === 4) && cell.textContent.toLowerCase().includes(keyword);
      });
      row.style.display = match ? "" : "none";
    });
  });
}

// ======= Simpan Edit =======
async function saveEdit(rowIndex, colIndex, value) {
  try {
    await fetch(API_URL + "?action=updateCell", {
      method: "POST",
      body: JSON.stringify({ row: rowIndex + 2, col: colIndex + 1, value }),
      headers: { "Content-Type": "application/json" }
    });
    loadData(); // reload untuk update stok
  } catch (err) {
    console.error(err);
    alert("Gagal menyimpan perubahan");
  }
}

// ======= Hitung Ringkasan Stok =======
function updateSummary(data) {
  let stok = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 };
  let belumDiambil = { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 };

  data.forEach(row => {
    let size = row[3].toUpperCase();
    let status = row[5].toLowerCase();

    if (stok[size] !== undefined) {
      stok[size] += 1;
      if (status !== "diambil") {
        belumDiambil[size] += 1;
      }
    }
  });

  // Update ke HTML
  for (let size in stok) {
    document.getElementById(`stok-${size}`).textContent = stok[size];
    document.getElementById(`belum-${size}`).textContent = belumDiambil[size];
  }

  // Total
  document.getElementById("total-stok").textContent =
    Object.values(stok).reduce((a, b) => a + b, 0);
  document.getElementById("total-belum").textContent =
    Object.values(belumDiambil).reduce((a, b) => a + b, 0);
}
