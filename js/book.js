import { db } from "./firebase-config.js";
import { getLoggedInUserId } from "./auth.js";
import "./auth.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const params = new URLSearchParams(location.search);
const bookId = params.get("id");
const main = document.getElementById("book-main");

if (!bookId) {
    main.innerHTML = "<p>Knjiga nije pronađena.</p>";
} else {
    loadBook();
}

async function loadBook() {
    const bookSnap = await get(ref(db, `knjige/${bookId}`));
    if (!bookSnap.exists()) {
        main.innerHTML = "<p>Knjiga nije pronađena u bazi.</p>";
        return;
    }
    const book = bookSnap.val();

    let authorHTML = "";
    if (book.idAutora) {
        const authorSnap = await get(ref(db, `autori/${book.idAutora}`));
        if (authorSnap.exists()) {
            const a = authorSnap.val();
            authorHTML = `<p><b>Autor:</b> <a href="author-details.html?id=${book.idAutora}">${a.ime} ${a.prezime}</a></p>`;
        }
    }

    const imagesHTML = book.slike && book.slike.length
        ? `<div class="book-images">${book.slike.map(url => `<img src="${url}" alt="${book.naziv}" class="book-detail-img">`).join("")}</div>`
        : "";

    main.innerHTML = `
    <h2>${book.naziv}</h2>
    ${imagesHTML}
    ${authorHTML}
    <p>${book.opis || ""}</p>
    <p><b>Žanr:</b> ${book.zanr || "N/A"}</p>
    <p><b>Format:</b> ${book.format || "N/A"}</p>
    <p><b>Cena:</b> ${book.cena ? book.cena + " RSD" : "N/A"}</p>
    <p><b>Broj strana:</b> ${book.brojStrana || "N/A"}</p>
    <p><b>ISBN:</b> ${book.isbn || "N/A"}</p>

    <hr>
    <h3>Ostavi recenziju</h3>
    <div id="review-form-area"></div>

    <hr>
    <h3>Recenzije</h3>
    <div id="reviews-list"><p>Učitavanje recenzija...</p></div>
  `;

    renderReviewForm();
    loadReviews();
}

function renderReviewForm() {
    const area = document.getElementById("review-form-area");
    const userId = getLoggedInUserId();
    if (!userId) {
        area.innerHTML = `<p><em>Da biste ostavili recenziju, <button class="btn-link-inline" onclick="window.openLoginModal()">prijavite se</button>.</em></p>`;
        return;
    }
    area.innerHTML = `
    <textarea id="review-text" placeholder="Napišite recenziju..." rows="4"></textarea>
    <span class="field-error" id="err-review"></span>
    <button id="btn-submit-review" class="btn-primary">Pošalji recenziju</button>
  `;
    document.getElementById("btn-submit-review").addEventListener("click", submitReview);
}

async function submitReview() {
    const userId = getLoggedInUserId();
    const text = document.getElementById("review-text").value.trim();
    const errEl = document.getElementById("err-review");
    errEl.textContent = "";

    if (!text || text.length < 5) {
        errEl.textContent = "Recenzija mora imati bar 5 karaktera.";
        return;
    }

    const newRef = push(ref(db, "recenzije"));
    await set(newRef, {
        tekst: text,
        datum: new Date().toISOString().split("T")[0],
        idKnjige: bookId,
        idKorisnika: userId
    });

    document.getElementById("review-text").value = "";
    loadReviews();
}

async function loadReviews() {
    const listEl = document.getElementById("reviews-list");
    const [reviewsSnap, usersSnap] = await Promise.all([
        get(ref(db, "recenzije")),
        get(ref(db, "korisnici"))
    ]);

    if (!reviewsSnap.exists()) {
        listEl.innerHTML = "<p>Još nema recenzija.</p>";
        return;
    }

    const users = usersSnap.exists() ? usersSnap.val() : {};
    const items = [];

    reviewsSnap.forEach(child => {
        const r = child.val();
        if (r.idKnjige === bookId) {
            const user = users[r.idKorisnika];
            const username = user ? user.korisnickoIme : "Nepoznat korisnik";
            items.push({ ...r, username });
        }
    });

    if (items.length === 0) {
        listEl.innerHTML = "<p>Još nema recenzija za ovu knjigu.</p>";
        return;
    }

    listEl.innerHTML = items.map(r => `
    <div class="review-card">
      <p><b>${r.username}:</b> ${r.tekst}</p>
      <small>${r.datum}</small>
    </div>
  `).join("");
}