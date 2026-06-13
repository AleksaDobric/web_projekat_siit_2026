import { db } from "./firebase-config.js";
import "./auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

let allBooks = {};

async function loadBooks() {
    const snapshot = await get(ref(db, "knjige"));
    if (!snapshot.exists()) {
        document.getElementById("books-container").innerHTML = "<p>Nema knjiga u bazi.</p>";
        return;
    }
    allBooks = snapshot.val();
    renderBooks(allBooks);
}

function renderBooks(books) {
    const container = document.getElementById("books-container");
    const titleQuery = document.getElementById("search-title").value.trim().toLowerCase();
    const genreQuery = document.getElementById("search-genre").value.trim().toLowerCase();

    const entries = Object.entries(books).filter(([id, book]) => {
        const matchTitle = !titleQuery || book.naziv.toLowerCase().includes(titleQuery);
        const matchGenre = !genreQuery || (book.zanr || "").toLowerCase().includes(genreQuery);
        return matchTitle && matchGenre;
    });

    if (entries.length === 0) {
        container.innerHTML = "<p>Nema rezultata pretrage.</p>";
        return;
    }

    container.innerHTML = entries.map(([id, book]) => {
        const title = highlight(book.naziv, titleQuery);
        const genre = highlight(book.zanr || "", genreQuery);
        const img = book.slike && book.slike[0]
            ? `<img src="${book.slike[0]}" alt="${book.naziv}" class="book-thumb">`
            : "";
        return `
      <div class="book-card">
        ${img}
        <div class="book-card-info">
          <h3>${title}</h3>
          <p><b>Žanr:</b> ${genre}</p>
          <p><b>Cena:</b> ${book.cena ? book.cena + " RSD" : "N/A"}</p>
          <p>${(book.opis || "").substring(0, 120)}...</p>
          <a href="book.html?id=${id}" class="btn-link">Vidi više</a>
        </div>
      </div>`;
    }).join("");
}

function highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, "gi");
    return text.replace(regex, '<mark>$1</mark>');
}

document.getElementById("btn-search").addEventListener("click", () => renderBooks(allBooks));
document.getElementById("btn-clear").addEventListener("click", () => {
    document.getElementById("search-title").value = "";
    document.getElementById("search-genre").value = "";
    renderBooks(allBooks);
});
document.getElementById("search-title").addEventListener("keyup", (e) => {
    if (e.key === "Enter") renderBooks(allBooks);
});
document.getElementById("search-genre").addEventListener("keyup", (e) => {
    if (e.key === "Enter") renderBooks(allBooks);
});

loadBooks();