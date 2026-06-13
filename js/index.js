var allBooks = {};

db.ref("knjige").once("value", function(snapshot) {
    allBooks = snapshot.val() || {};
    renderBooks(allBooks);
});

function highlight(text, query) {
    if (!query) return text;
    var regex = new RegExp("(" + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ")", "gi");
    return text.replace(regex, "<mark>$1</mark>");
}

function renderBooks(books) {
    var container = document.getElementById("books-container");
    var titleQuery = document.getElementById("search-title").value.trim().toLowerCase();
    var genreQuery = document.getElementById("search-genre").value.trim().toLowerCase();

    var entries = Object.entries(books).filter(function(entry) {
        var book = entry[1];
        var matchTitle = !titleQuery || book.naziv.toLowerCase().includes(titleQuery);
        var matchGenre = !genreQuery || (book.zanr || "").toLowerCase().includes(genreQuery);
        return matchTitle && matchGenre;
    });

    if (entries.length === 0) {
        container.innerHTML = "<p>Nema rezultata pretrage.</p>";
        return;
    }

    container.innerHTML = "";

    entries.forEach(function(entry) {
        var id = entry[0];
        var book = entry[1];

        var title = highlight(book.naziv, titleQuery);
        var genre = highlight(book.zanr || "", genreQuery);
        var img = book.slike && book.slike[0]
            ? "<img src='" + book.slike[0] + "' alt='" + book.naziv + "' class='book-thumb'>"
            : "";

        var card = document.createElement("div");
        card.classList.add("book-card");
        card.innerHTML = img + `
            <div class="book-card-info">
                <h3>${title}</h3>
                <p><b>Žanr:</b> ${genre}</p>
                <p><b>Cena:</b> ${book.cena ? book.cena + " RSD" : "N/A"}</p>
                <p>${(book.opis || "").substring(0, 120)}...</p>
                <a href="book.html?id=${id}" class="btn-link">Vidi više</a>
            </div>`;

        container.appendChild(card);
    });
}

document.getElementById("btn-search").onclick = function() {
    renderBooks(allBooks);
};

document.getElementById("btn-clear").onclick = function() {
    document.getElementById("search-title").value = "";
    document.getElementById("search-genre").value = "";
    renderBooks(allBooks);
};

document.getElementById("search-title").addEventListener("keyup", function(e) {
    if (e.key === "Enter") renderBooks(allBooks);
});

document.getElementById("search-genre").addEventListener("keyup", function(e) {
    if (e.key === "Enter") renderBooks(allBooks);
});