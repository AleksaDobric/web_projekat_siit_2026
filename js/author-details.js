const container = document.getElementById("author-container");
const params = new URLSearchParams(window.location.search);
const authorId = params.get("id");

db.ref(`autori/${authorId}`).once("value", (snapshot) => {
    const author = snapshot.val();

    if (!author) {
        container.innerHTML = "<p>Autor nije pronađen</p>";
        return;
    }

    container.innerHTML = `
        <div class="author-profile">
            <img src="${author.slike?.[0] || ''}" style="width:120px;border-radius:50%;">
            
            <h2>${author.ime} ${author.prezime}</h2>

            <p>${author.biografija}</p>

            <p><b>Status:</b> ${author.status}</p>
            <p><b>Nagrade:</b> ${author.brojOsvojenihNagrada}</p>
            <p><b>Prodate knjige:</b> ${author.brojProdatihPrimeraka}</p>
        </div>
    `;
});