const tableBody = document.getElementById("authors-table-body");
const form = document.querySelectorAll("form")[1];


function formatDate(dateStr) {
    if (!dateStr) return "";

    if (dateStr.startsWith("-")) {
        const year = Math.abs(parseInt(dateStr));
        return `${year}. п.н.е.`;
    }

    const d = new Date(dateStr);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();

    return `${day}.${month}.${year}.`;
}


function getStatusClass(status) {
    if (status === "Активан") return "active";
    if (status === "У пензији") return "retired";
    if (status === "Преминуо") return "deceased";
    return "";
}


function loadAuthors() {
    db.ref("autori").once("value", (snapshot) => {
        const data = snapshot.val();
        tableBody.innerHTML = "";

        for (let id in data) {
            const author = data[id];

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${author.ime}</td>
                <td>${author.prezime}</td>
                <td>${formatDate(author.datumRodjenja)}</td>
                <td>
                    <span class="status status-${getStatusClass(author.status)}">
                        ${author.status}
                    </span>
                </td>
                <td>${Number(author.brojOsvojenihNagrada || 0).toLocaleString("de-DE")}</td>
                <td>${Number(author.brojProdatihPrimeraka || 0).toLocaleString("de-DE")}</td>
                <td>${author.kontaktTelefonMenadzera || ""}</td>
                <td>
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </td>
            `;

            row.querySelector(".delete-btn").onclick = () => {
                if (confirm("Obrisati autora?")) {
                    db.ref("autori/" + id).remove().then(loadAuthors);
                }
            };

            row.querySelector(".edit-btn").onclick = () => {
                form.name.value = author.ime;
                form.surname.value = author.prezime;
                form.date.value = author.datumRodjenja;
                form.status.value = author.status;
                form.awards.value = author.brojOsvojenihNagrada;
                form.sold.value = author.brojProdatihPrimeraka;
                form.phone.value = author.kontaktTelefonMenadzera;
                form.bio.value = author.biografija;

                form.setAttribute("data-edit-id", id);
            };

            tableBody.appendChild(row);
        }
    });
}

form.querySelector("button").onclick = () => {
    const id = form.getAttribute("data-edit-id");

    const updated = {
        ime: form.name.value,
        prezime: form.surname.value,
        datumRodjenja: form.date.value,
        status: form.status.value,
        brojOsvojenihNagrada: form.awards.value,
        brojProdatihPrimeraka: form.sold.value,
        kontaktTelefonMenadzera: form.phone.value,
        biografija: form.bio.value
    };

    if (id) {
        db.ref("autori/" + id).update(updated).then(() => {
            form.removeAttribute("data-edit-id");
            loadAuthors();
        });
    }
};

loadAuthors();