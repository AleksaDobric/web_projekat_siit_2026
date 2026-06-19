var ISBN_REGEX = /^(978|979)-?\d{1,5}-?\d{1,7}-?\d{1,6}-?\d$/;
var allAuthors = {};
var pendingDeleteId = null;

function showToast(message, type) {
    type = type || "success";
    var toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = "toast " + type + " show";
    setTimeout(function() {
        toast.classList.remove("show");
    }, 2500);
}

function loadAuthors() {
    db.ref("autori").once("value", function(snapshot) {
        allAuthors = snapshot.val() || {};

        var options = "";
        for (var id in allAuthors) {
            var a = allAuthors[id];
            options += "<option value='" + id + "'>" + a.ime + " " + a.prezime + "</option>";
        }

        document.getElementById("add-autor").insertAdjacentHTML("beforeend", options);
        document.getElementById("edit-autor").insertAdjacentHTML("beforeend", options);

        loadBooks();
    });
}

function loadBooks() {
    db.ref("knjige").once("value", function(snapshot) {
        var container = document.getElementById("books-table-container");
        var books = snapshot.val();

        if (!books) {
            container.innerHTML = "<p>Nema knjiga.</p>";
            return;
        }

        var rows = "";
        for (var id in books) {
            var b = books[id];
            var authorName = b.idAutora && allAuthors[b.idAutora]
                ? allAuthors[b.idAutora].ime + " " + allAuthors[b.idAutora].prezime
                : "N/A";

            rows += `
                <tr>
                    <td><a href="book.html?id=${id}">${b.naziv}</a></td>
                    <td>${b.zanr || "N/A"}</td>
                    <td>${b.cena ? b.cena + " RSD" : "N/A"}</td>
                    <td>${b.isbn || "N/A"}</td>
                    <td>${authorName}</td>
                    <td>
                        <button class="btn-secondary" onclick="openEdit('${id}')">Izmeni</button>
                        <button class="btn-danger" onclick="openDeleteModal('${id}')">Obriši</button>
                    </td>
                </tr>`;
        }

        container.innerHTML = `
            <div class="table-wrapper">    
                <table>
                    <thead><tr>
                        <th>Naziv</th><th>Žanr</th><th>Cena</th><th>ISBN</th><th>Autor</th><th>Akcije</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>`;
    });
}

function validateBook(prefix) {
    var valid = true;

    var fields = ["naziv", "opis", "zanr", "cena", "strana", "isbn"];
    fields.forEach(function(f) {
        document.getElementById("err-" + prefix + "-" + f).textContent = "";
    });

    var naziv = document.getElementById(prefix + "-naziv").value.trim();
    var opis = document.getElementById(prefix + "-opis").value.trim();
    var zanr = document.getElementById(prefix + "-zanr").value.trim();
    var cena = document.getElementById(prefix + "-cena").value;
    var strana = document.getElementById(prefix + "-strana").value;
    var isbn = document.getElementById(prefix + "-isbn").value.trim();

    if (!naziv) { document.getElementById("err-" + prefix + "-naziv").textContent = "Naziv je obavezan."; valid = false; }
    if (!opis) { document.getElementById("err-" + prefix + "-opis").textContent = "Opis je obavezan."; valid = false; }
    if (!zanr) { document.getElementById("err-" + prefix + "-zanr").textContent = "Žanr je obavezan."; valid = false; }
    if (!cena || Number(cena) < 0) { document.getElementById("err-" + prefix + "-cena").textContent = "Cena mora biti pozitivan broj."; valid = false; }
    if (!strana || Number(strana) < 1) { document.getElementById("err-" + prefix + "-strana").textContent = "Broj strana mora biti veći od 0."; valid = false; }
    if (!isbn || !ISBN_REGEX.test(isbn)) { document.getElementById("err-" + prefix + "-isbn").textContent = "ISBN mora biti 13 cifara u formatu 978-... ili 979-..."; valid = false; }

    return valid;
}

function getBookData(prefix) {
    var slikeRaw = document.getElementById(prefix + "-slike").value.trim();
    return {
        naziv: document.getElementById(prefix + "-naziv").value.trim(),
        opis: document.getElementById(prefix + "-opis").value.trim(),
        zanr: document.getElementById(prefix + "-zanr").value.trim(),
        format: document.getElementById(prefix + "-format").value.trim(),
        cena: Number(document.getElementById(prefix + "-cena").value),
        brojStrana: Number(document.getElementById(prefix + "-strana").value),
        isbn: document.getElementById(prefix + "-isbn").value.trim(),
        idAutora: document.getElementById(prefix + "-autor").value || "",
        slike: slikeRaw ? slikeRaw.split("\n").map(function(s) { return s.trim(); }).filter(Boolean) : []
    };
}

function openEdit(id) {
    db.ref("knjige/" + id).once("value", function(snapshot) {
        var book = snapshot.val();
        if (!book) return;

        var section = document.getElementById("edit-section");
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
    });
}

function openDeleteModal(id) {
    pendingDeleteId = id;
    document.getElementById("delete-modal-overlay").classList.remove("hidden");
}

document.getElementById("add-book-form").onsubmit = function(e) {
    e.preventDefault();
    if (!validateBook("add")) return;

    var data = getBookData("add");
    db.ref("knjige").push(data).then(function() {
        document.getElementById("add-book-form").reset();
        showToast("Knjiga je uspešno dodata!");
        loadBooks();
    });
};

document.getElementById("btn-cancel-edit").onclick = function() {
    document.getElementById("edit-section").classList.add("hidden");
};

document.getElementById("edit-book-form").onsubmit = function(e) {
    e.preventDefault();
    if (!validateBook("edit")) return;

    var id = document.getElementById("edit-id").value;
    var data = getBookData("edit");

    db.ref("knjige/" + id).update(data).then(function() {
        document.getElementById("edit-section").classList.add("hidden");
        showToast("Knjiga je uspešno izmenjena!");
        loadBooks();
    });
};

document.getElementById("btn-confirm-delete").onclick = function() {
    if (pendingDeleteId) {
        db.ref("knjige/" + pendingDeleteId).remove().then(function() {
            pendingDeleteId = null;
            document.getElementById("delete-modal-overlay").classList.add("hidden");
            showToast("Knjiga je uspešno obrisana!", "error");
            loadBooks();
        });
    }
};

document.getElementById("btn-cancel-delete").onclick = function() {
    pendingDeleteId = null;
    document.getElementById("delete-modal-overlay").classList.add("hidden");
};

loadAuthors();