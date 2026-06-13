import { db } from "./firebase-config.js";
import "./auth.js";
import { ref, get, push, set, remove, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const ISBN_REGEX = /^(978|979)-?\d{1,5}-?\d{1,7}-?\d{1,6}-?\d$/;

let allAuthors = {};
let pendingDeleteId = null;

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove("show"), 2500);
}

async function loadAuthors() {
    const snap = await get(ref(db, "autori"));
    if (!snap.exists()) return;
    allAuthors = snap.val();
    const options = Object.entries(allAuthors)
        .map(([id, a]) => `<option value="${id}">${a.ime} ${a.prezime}</option>`)
        .join("");
    document.getElementById("add-autor").insertAdjacentHTML("beforeend", options);
    document.getElementById("edit-autor").insertAdjacentHTML("beforeend", options);
}

async function loadBooks() {
    const snap = await get(ref(db, "knjige"));
    const container = document.getElementById("books-table-container");
    if (!snap.exists()) {
        container.innerHTML = "<p>Nema knjiga.</p>";
        return;
    }
    const books = snap.val();
    const rows = Object.entries(books).map(([id, b]) => {
        const authorName = b.idAutora && allAuthors[b.idAutora]
            ? `${allAuthors[b.idAutora].ime} ${allAuthors[b.idAutora].prezime}`
            : "N/A";
        return `
      <tr>
        <td><a href="book.html?id=${id}">${b.naziv}</a></td>
        <td>${b.zanr || "N/A"}</td>
        <td>${b.cena ? b.cena + " RSD" : "N/A"}</td>
        <td>${b.isbn || "N/A"}</td>
        <td>${authorName}</td>
        <td>
          <button class="btn-edit btn-secondary" data-id="${id}">Izmeni</button>
          <button class="btn-delete btn-danger" data-id="${id}">Obriši</button>
        </td>
      </tr>`;
    }).join("");

    container.innerHTML = `
    <table>
      <thead><tr>
        <th>Naziv</th><th>Žanr</th><th>Cena</th><th>ISBN</th><th>Autor</th><th>Akcije</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;

    container.querySelectorAll(".btn-edit").forEach(btn =>
        btn.addEventListener("click", () => openEdit(btn.dataset.id, snap.val()[btn.dataset.id]))
    );
    container.querySelectorAll(".btn-delete").forEach(btn =>
        btn.addEventListener("click", () => openDeleteModal(btn.dataset.id))
    );
}

function validateBook(prefix) {
    let valid = true;
    const clearErr = id => document.getElementById(id).textContent = "";
    const setErr = (id, msg) => { document.getElementById(id).textContent = msg; valid = false; };

    ["naziv", "opis", "zanr", "cena", "strana", "isbn"].forEach(f => clearErr(`err-${prefix}-${f}`));

    const naziv = document.getElementById(`${prefix}-naziv`).value.trim();
    const opis = document.getElementById(`${prefix}-opis`).value.trim();
    const zanr = document.getElementById(`${prefix}-zanr`).value.trim();
    const cena = document.getElementById(`${prefix}-cena`).value;
    const strana = document.getElementById(`${prefix}-strana`).value;
    const isbn = document.getElementById(`${prefix}-isbn`).value.trim();

    if (!naziv) setErr(`err-${prefix}-naziv`, "Naziv je obavezan.");
    if (!opis) setErr(`err-${prefix}-opis`, "Opis je obavezan.");
    if (!zanr) setErr(`err-${prefix}-zanr`, "Žanr je obavezan.");
    if (!cena || Number(cena) < 0) setErr(`err-${prefix}-cena`, "Cena mora biti pozitivan broj.");
    if (!strana || Number(strana) < 1) setErr(`err-${prefix}-strana`, "Broj strana mora biti veći od 0.");
    if (!isbn || !ISBN_REGEX.test(isbn)) setErr(`err-${prefix}-isbn`, "ISBN mora biti 13 cifara u formatu 978-... ili 979-...");

    return valid;
}

function getBookData(prefix) {
    const slikeRaw = document.getElementById(`${prefix}-slike`).value.trim();
    return {
        naziv: document.getElementById(`${prefix}-naziv`).value.trim(),
        opis: document.getElementById(`${prefix}-opis`).value.trim(),
        zanr: document.getElementById(`${prefix}-zanr`).value.trim(),
        format: document.getElementById(`${prefix}-format`).value.trim(),
        cena: Number(document.getElementById(`${prefix}-cena`).value),
        brojStrana: Number(document.getElementById(`${prefix}-strana`).value),
        isbn: document.getElementById(`${prefix}-isbn`).value.trim(),
        idAutora: document.getElementById(`${prefix}-autor`).value || "",
        slike: slikeRaw ? slikeRaw.split("\n").map(s => s.trim()).filter(Boolean) : []
    };
}

function openEdit(id, book) {
    const section = document.getElementById("edit-section");
    section.classList.remove("hidden");
    section.scrollIntoView({ behavior: "smooth" });

    document.getElementById("edit-id").value = id;
    document.getElementById("edit-naziv").value = book.naziv || "";
    document.getElementById("edit-opis").value = book.opis || "";
    document.getElementById("edit-zanr").value = book.zanr || "";
    document.getElementById("edit-format").value = book.format || "";
    document.getElementById("edit-cena").value = book.cena || "";
    document.getElementById("edit-strana").value = book.brojStrana || "";
    document.getElementById("edit-isbn").value = book.isbn || "";
    document.getElementById("edit-autor").value = book.idAutora || "";
    document.getElementById("edit-slike").value = book.slike ? book.slike.join("\n") : "";
}

function openDeleteModal(id) {
    pendingDeleteId = id;
    document.getElementById("delete-modal-overlay").classList.remove("hidden");
}

// ── Event listeners ──
document.getElementById("add-book-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateBook("add")) return;
    const data = getBookData("add");
    const newRef = push(ref(db, "knjige"));
    await set(newRef, data);
    document.getElementById("add-book-form").reset();
    document.getElementById("err-add-general").textContent = "";
    showToast("Knjiga je uspešno dodata!");
    loadBooks();
});

document.getElementById("btn-cancel-edit").addEventListener("click", () => {
    document.getElementById("edit-section").classList.add("hidden");
});

document.getElementById("edit-book-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateBook("edit")) return;
    const id = document.getElementById("edit-id").value;
    const data = getBookData("edit");
    await update(ref(db, `knjige/${id}`), data);
    document.getElementById("edit-section").classList.add("hidden");
    showToast("Knjiga je uspešno izmenjena!");
    loadBooks();
});

document.getElementById("btn-confirm-delete").addEventListener("click", async () => {
    if (pendingDeleteId) {
        await remove(ref(db, `knjige/${pendingDeleteId}`));
        pendingDeleteId = null;
    }
    document.getElementById("delete-modal-overlay").classList.add("hidden");
    showToast("Knjiga je uspešno obrisana!", "error");
    loadBooks();
});

document.getElementById("btn-cancel-delete").addEventListener("click", () => {
    pendingDeleteId = null;
    document.getElementById("delete-modal-overlay").classList.add("hidden");
});

// ── Init ──
await loadAuthors();
await loadBooks();