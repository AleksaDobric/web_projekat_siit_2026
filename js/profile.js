import { db } from "./firebase-config.js";
import { getLoggedInUserId } from "./auth.js";
import "./auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const content = document.getElementById("profile-content");
const userId = getLoggedInUserId();

if (!userId) {
    content.innerHTML = `
    <p>Niste prijavljeni.</p>
    <button class="btn-primary" onclick="window.openLoginModal()">Prijavite se</button>`;
} else {
    loadProfile();
}

async function loadProfile() {
    const [userSnap, reviewsSnap, booksSnap] = await Promise.all([
        get(ref(db, `korisnici/${userId}`)),
        get(ref(db, "recenzije")),
        get(ref(db, "knjige"))
    ]);

    if (!userSnap.exists()) {
        content.innerHTML = "<p>Korisnik nije pronađen.</p>";
        return;
    }

    const u = userSnap.val();
    const books = booksSnap.exists() ? booksSnap.val() : {};

    const myReviews = [];
    if (reviewsSnap.exists()) {
        reviewsSnap.forEach(child => {
            const r = child.val();
            if (r.idKorisnika === userId) {
                const book = books[r.idKnjige];
                myReviews.push({
                    tekst: r.tekst,
                    datum: r.datum,
                    bookId: r.idKnjige,
                    bookName: book ? book.naziv : "Nepoznata knjiga"
                });
            }
        });
    }

    const reviewsHTML = myReviews.length
        ? myReviews.map(r => `
        <div class="review-card">
          <p>${r.tekst}</p>
          <small>${r.datum} – <a href="book.html?id=${r.bookId}">${r.bookName}</a></small>
        </div>`).join("")
        : "<p>Još nema recenzija.</p>";

    content.innerHTML = `
    <section class="profile-info">
      <h2>Osnovne informacije</h2>
      <p><b>Korisničko ime:</b> ${u.korisnickoIme}</p>
      <p><b>Ime:</b> ${u.ime}</p>
      <p><b>Prezime:</b> ${u.prezime}</p>
      <p><b>Email:</b> ${u.email}</p>
      <p><b>Datum rođenja:</b> ${u.datumRodjenja || "N/A"}</p>
      <p><b>Adresa:</b> ${u.adresa || "N/A"}</p>
      <p><b>Zanimanje:</b> ${u.zanimanje || "N/A"}</p>
    </section>

    <hr>

    <section>
      <h2>Moje recenzije</h2>
      ${reviewsHTML}
    </section>

    <hr>

    <section id="my-ratings-section">
      <h2>Moje ocene</h2>
      <p><em>-</em></p>
    </section>
  `;
}