const tableBody = document.getElementById("authors-table-body");
const form = document.querySelectorAll("form")[1];

const fieldLabels = {
    ime: "Име",
    prezime: "Презиме",
    datumRodjenja: "Датум рођења",
    status: "Статус",
    brojOsvojenihNagrada: "Број освојених награда",
    brojProdatihPrimeraka: "Број продатих копија",
    kontaktTelefonMenadzera: "Телефон менаџера",
    biografija: "Биографија"
};

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function getFormData(form) {
    return {
        ime: form.elements["name"].value,
        prezime: form.elements["surname"].value,
        datumRodjenja: form.elements["date"].value,
        status: form.elements["status"].value,
        brojOsvojenihNagrada: form.elements["awards"].value,
        brojProdatihPrimeraka: form.elements["sold"].value,
        kontaktTelefonMenadzera: form.elements["phone"].value,
        biografija: form.elements["bio"].value
    };
}

function fillForm(form, author) {
    form.elements["name"].value = author.ime;
    form.elements["surname"].value = author.prezime;
    form.elements["date"].value = author.datumRodjenja;
    form.elements["status"].value = author.status;
    form.elements["awards"].value = author.brojOsvojenihNagrada;
    form.elements["sold"].value = author.brojProdatihPrimeraka;
    form.elements["phone"].value = author.kontaktTelefonMenadzera;
    form.elements["bio"].value = author.biografija;
}

function scrollToForm(form) {
    window.scrollTo({
        top: form.offsetTop - 60,
        behavior: "smooth"
    });
}

function deleteAuthor(id) {
    if (confirm("Да ли сте сигурни да желите да обришете овог аутора?")) {
        db.ref("autori/" + id).remove().then(loadAuthors);
    }
}

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

function validateRequiredFields(author) {
    const requiredFields = [
        "ime",
        "datumRodjenja",
        "status",
        "brojOsvojenihNagrada",
        "brojProdatihPrimeraka",
        "kontaktTelefonMenadzera",
        "biografija"
    ];

    for (let field of requiredFields) {
        if (!author[field] || author[field].toString().trim() === "") {
            showToast(`Поље "${fieldLabels[field]}" не сме бити празно.`, "error");
            return false;
        }
    }

    return true;
}

function validateAuthor(author) {
    const nameRegex = /^[\p{L}\s]+$/u;
    const phoneRegex = /^\+?[0-9\s-]+$/;

    if (!nameRegex.test(author.ime.trim())) {
        showToast("Име мора да садржи само слова.", "error");
        return false;
    }

    if (!nameRegex.test(author.prezime.trim())) {
        showToast("Презиме мора да садржи само слова.", "error");
        return false;
    }

    if (author.brojOsvojenihNagrada < 0) {
        showToast("Број освојених награда не може бити негативан.", "error");
        return false;
    }

    if (author.brojProdatihPrimeraka < 0) {
        showToast("Број продатих примерака не може бити негативан.", "error");
        return false;
    }

    if (!phoneRegex.test(author.kontaktTelefonMenadzera.trim())) {
        showToast("Неисправан број телефона.", "error");
        return false;
    }

    return true;
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

            row.querySelector(".delete-btn").onclick = () => deleteAuthor(id);

            row.querySelector(".edit-btn").onclick = () => {
                fillForm(form, author);
                form.setAttribute("data-edit-id", id);
                scrollToForm(form);
            };

            tableBody.appendChild(row);
        }
    });
}

form.querySelector("button").onclick = () => {
    const id = form.getAttribute("data-edit-id");

    const updated = getFormData(form);

    if (!validateRequiredFields(updated)) return;
    if (!validateAuthor(updated)) return;

    db.ref("autori/" + id).update(updated)
        .then(() => {
            form.removeAttribute("data-edit-id");
            form.reset();
            showToast("Аутор успешно измењен!");
            loadAuthors();
        })
        .catch(err => console.error(err));
};

loadAuthors();