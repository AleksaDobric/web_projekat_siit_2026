let allAuthors = {};
const container = document.getElementById("authors-container");

db.ref("autori").once("value", (snapshot) => {
    allAuthors = snapshot.val() || {};
    renderAuthors(allAuthors);
});

function highlight(text, query) {
    if (!query) return text;

    const regex = new RegExp(
        `(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
        "gi"
    );

    return text.replace(regex, "<mark>$1</mark>");
}

function renderAuthors(authors) {

    const nameQuery =
        document.getElementById("search-name").value
            .trim()
            .toLowerCase();

    const statusQuery =
        document.getElementById("search-status").value
            .trim()
            .toLowerCase();

    container.innerHTML = "";

    const entries = Object.entries(authors).filter(([id, author]) => {

        const fullName =
            `${author.ime || ""} ${author.prezime || ""}`.toLowerCase();

        const matchName =
            !nameQuery || fullName.includes(nameQuery);

        const matchStatus =
            !statusQuery ||
            (author.status || "").toLowerCase() === statusQuery;

        return matchName && matchStatus;
    });

    if (entries.length === 0) {
        container.innerHTML = "<p>Нема резултата претраге.</p>";
        return;
    }

    entries.forEach(([id, author]) => {

        const card = document.createElement("div");
        card.classList.add("author-card");

        const fullName =
            `${author.ime || ""} ${author.prezime || ""}`;

        card.innerHTML = `
            <img src="${author.slike?.[0] || ''}" alt="author">

            <div>
                <h3>${highlight(fullName, nameQuery)}</h3>

                <p>
                    ${(author.biografija || "").substring(0, 120)}...
                </p>
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href =
                `author-details.html?id=${id}`;
        });

        container.appendChild(card);
    });
}

document.getElementById("btn-search")
    .addEventListener("click", () => {
        renderAuthors(allAuthors);
    });

document.getElementById("btn-clear")
    .addEventListener("click", () => {

        document.getElementById("search-name").value = "";
        document.getElementById("search-status").value = "";

        renderAuthors(allAuthors);
    });

document.getElementById("search-name")
    .addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            renderAuthors(allAuthors);
        }
    });