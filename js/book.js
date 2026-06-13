var params = new URLSearchParams(window.location.search);
var bookId = params.get("id");
var main = document.getElementById("book-main");

if (!bookId) {
    main.innerHTML = "<p>Knjiga nije pronađena.</p>";
} else {
    loadBook();
}

function loadBook() {
    db.ref("knjige/" + bookId).once("value", function(snapshot) {
        var book = snapshot.val();

        if (!book) {
            main.innerHTML = "<p>Knjiga nije pronađena u bazi.</p>";
            return;
        }

        var imagesHTML = "";
        if (book.slike && book.slike.length) {
            imagesHTML = "<div class='book-images'>";
            book.slike.forEach(function(url) {
                imagesHTML += "<img src='" + url + "' alt='" + book.naziv + "' class='book-detail-img'>";
            });
            imagesHTML += "</div>";
        }

        main.innerHTML = `
            <h2>${book.naziv}</h2>
            ${imagesHTML}
            <p id="author-link-area"></p>
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

        if (book.idAutora) {
            db.ref("autori/" + book.idAutora).once("value", function(authorSnap) {
                var author = authorSnap.val();
                if (author) {
                    document.getElementById("author-link-area").innerHTML =
                        "<b>Autor:</b> <a href='author-details.html?id=" + book.idAutora + "'>" + author.ime + " " + author.prezime + "</a>";
                }
            });
        }

        renderReviewForm();
        loadReviews();
    });
}

function renderReviewForm() {
    var area = document.getElementById("review-form-area");
    var userId = getLoggedInUserId();

    if (!userId) {
        area.innerHTML = "<p><em>Da biste ostavili recenziju, <button class='btn-link-inline' onclick='openLoginModal()'>prijavite se</button>.</em></p>";
        return;
    }

    area.innerHTML = `
        <textarea id="review-text" placeholder="Napišite recenziju..." rows="4"></textarea>
        <span class="field-error" id="err-review"></span>
        <button id="btn-submit-review" class="btn-primary">Pošalji recenziju</button>
    `;

    document.getElementById("btn-submit-review").onclick = function() {
        submitReview();
    };
}

function submitReview() {
    var userId = getLoggedInUserId();
    var text = document.getElementById("review-text").value.trim();
    var errEl = document.getElementById("err-review");
    errEl.textContent = "";

    if (!text || text.length < 5) {
        errEl.textContent = "Recenzija mora imati bar 5 karaktera.";
        return;
    }

    db.ref("recenzije").push({
        tekst: text,
        datum: new Date().toISOString().split("T")[0],
        idKnjige: bookId,
        idKorisnika: userId
    }).then(function() {
        document.getElementById("review-text").value = "";
        loadReviews();
    });
}

function loadReviews() {
    var listEl = document.getElementById("reviews-list");

    db.ref("recenzije").once("value", function(reviewsSnap) {
        db.ref("korisnici").once("value", function(usersSnap) {
            var users = usersSnap.val() || {};
            var items = [];

            reviewsSnap.forEach(function(child) {
                var r = child.val();
                if (r.idKnjige === bookId) {
                    var user = users[r.idKorisnika];
                    items.push({
                        tekst: r.tekst,
                        datum: r.datum,
                        username: user ? user.korisnickoIme : "Nepoznat korisnik"
                    });
                }
            });

            if (items.length === 0) {
                listEl.innerHTML = "<p>Još nema recenzija za ovu knjigu.</p>";
                return;
            }

            listEl.innerHTML = items.map(function(r) {
                return "<div class='review-card'><p><b>" + r.username + ":</b> " + r.tekst + "</p><small>" + r.datum + "</small></div>";
            }).join("");
        });
    });
}