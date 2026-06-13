const container = document.getElementById("authors-container");

db.ref("autori").once("value", (snapshot) => {
    const data = snapshot.val();

    container.innerHTML = "";

    for (let id in data) {
        const author = data[id];

        const card = document.createElement("div");
        card.classList.add("author-card");

        card.innerHTML = `
            <img src="${author.slike?.[0] || ''}" alt="author">
            <div>
                <h3>${author.ime} ${author.prezime}</h3>
                <p>${author.biografija?.substring(0, 120)}...</p>
            </div>
        `;

        card.addEventListener("click", () => {
            window.location.href = `author-details.html?id=${id}`;
        });

        container.appendChild(card);
    }
});