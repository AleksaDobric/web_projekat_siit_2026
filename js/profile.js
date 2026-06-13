var userId = getLoggedInUserId();
var content = document.getElementById("profile-content");

if (!userId) {
    content.innerHTML = "<p>Niste prijavljeni.</p><button class='btn-primary' onclick='openLoginModal()'>Prijavite se</button>";
} else {
    loadProfile();
}

function loadProfile() {
    db.ref("korisnici/" + userId).once("value", function(userSnap) {
        var u = userSnap.val();

        if (!u) {
            content.innerHTML = "<p>Korisnik nije pronađen.</p>";
            return;
        }

        db.ref("recenzije").once("value", function(reviewsSnap) {
            db.ref("knjige").once("value", function(booksSnap) {
                db.ref("ocene").once("value", function(ratingsSnap) {
                    db.ref("autori").once("value", function(authorsSnap) {

                        var books = booksSnap.val() || {};
                        var authors = authorsSnap.val() || {};

                        // RECENZIJE
                        var myReviews = [];

                        reviewsSnap.forEach(function(child) {
                            var r = child.val();

                            if (r.idKorisnika === userId) {
                                var book = books[r.idKnjige];

                                myReviews.push({
                                    tekst: r.tekst,
                                    datum: r.datum,
                                    bookId: r.idKnjige,
                                    bookName: book ? book.naziv : "Nepoznata knjiga"
                                });
                            }
                        });

                        var reviewsHTML = "";

                        if (myReviews.length === 0) {
                            reviewsHTML = "<p>Još nema recenzija.</p>";
                        } else {
                            myReviews.forEach(function(r) {
                                reviewsHTML += `
                                    <div class="review-card">
                                        <p>${r.tekst}</p>
                                        <small>
                                            ${r.datum} –
                                            <a href="book.html?id=${r.bookId}">
                                                ${r.bookName}
                                            </a>
                                        </small>
                                    </div>
                                `;
                            });
                        }

                        // OCENE
                        var myRatings = [];

                        ratingsSnap.forEach(function(child) {
                            var r = child.val();

                            if (r.idKorisnika === userId) {
                                var author = authors[r.idAutora];

                                myRatings.push({
                                    vrednost: r.vrednost,
                                    datum: r.datum,
                                    authorId: r.idAutora,
                                    authorName: author
                                        ? author.ime + " " + author.prezime
                                        : "Nepoznat autor"
                                });
                            }
                        });

                        var ratingsHTML = "";

                        if (myRatings.length === 0) {
                            ratingsHTML = "<p>Još nema ocena.</p>";
                        } else {
                            myRatings.forEach(function(r) {
                                ratingsHTML += `
                                    <div class="rating-card">
                                        <p>⭐ ${r.vrednost} / 5</p>
                                        <small>
                                            ${r.datum} –
                                            <a href="author-details.html?id=${r.authorId}">
                                                ${r.authorName}
                                            </a>
                                        </small>
                                    </div>
                                `;
                            });
                        }

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
                                ${ratingsHTML}
                            </section>
                        `;
                    });
                });
            });
        });
    });
}