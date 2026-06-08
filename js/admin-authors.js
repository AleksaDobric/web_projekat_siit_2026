const tableBody = document.getElementById("authors-table-body");

db.ref("autori").once("value", (snapshot) => {
    const data = snapshot.val();

    tableBody.innerHTML = "";

    for (let id in data) {
        const author = data[id];

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${author.ime}</td>
            <td>${author.prezime}</td>
            <td>${author.datumRodjenja || ""}</td>
            <td>${author.status || ""}</td>
            <td>${author.brojOsvojenihNagrada || 0}</td>
            <td>${author.brojProdatihPrimeraka || 0}</td>
            <td>${author.kontaktTelefonMenadzera || ""}</td>
            <td>
                <button>Edit</button>
                <button>Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    }
});