const tableBody = document.getElementById("authors-table-body");

const addForm = document.getElementById("add-author-form");
const editForm = document.getElementById("edit-author-form");

const addModal = document.getElementById("add-modal");
const editModal = document.getElementById("edit-modal");

const fieldLabels = {
    ime: "Име",
    prezime: "Презиме",
    datumRodjenja: "Датум рођења",
    status: "Статус",
    brojOsvojenihNagrada: "Број освојених награда",
    brojProdatihPrimeraka: "Број продатих копија",
    kontaktTelefonMenadzera: "Телефон менаџера",
    slike: "Слика",
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
        slike: form.elements["image"].value ? [form.elements["image"].value] : [],
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
    form.elements["image"].value = author.slike?.[0] || "";
    form.elements["bio"].value = author.biografija;
}

function deleteAuthor(id) {
    if (confirm("Да ли сте сигурни да желите да обришете овог аутора?")) {
        db.ref("autori/" + id).remove()
            .then(() => {
                showToast("Аутор успешно обрисан!");
                loadAuthors();
            });
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
        "slike",
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
    const phoneRegex = /^\+381\s\d{2}\s\d{3}-\d{4}$/;

    if (!nameRegex.test(author.ime.trim())) {
        showToast("Име мора да садржи само слова.", "error");
        return false;
    }

    if (
        author.prezime.trim() !== "" &&
        !nameRegex.test(author.prezime.trim())
    ) {
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
                fillForm(editForm, author);
                editForm.setAttribute("data-edit-id", id);
                editModal.style.display = "flex";
                document.body.classList.add("modal-open");
            };

            tableBody.appendChild(row);
        }
    });
}

addForm.querySelector("button").onclick = () => {

    const author = getFormData(addForm);

    if (!validateRequiredFields(author)) return;
    if (!validateAuthor(author)) return;

    db.ref("autori").push(author)
        .then(() => {
            addForm.reset();
            addModal.style.display = "none";
            document.body.classList.remove("modal-open");
            showToast("Аутор успешно додат!");
            loadAuthors();
        })
        .catch(err => {
            console.error(err);
            showToast("Грешка при додавању аутора.", "error");
        });
};

editForm.querySelector("button").onclick = () => {
    const id = editForm.getAttribute("data-edit-id");

    const updated = getFormData(editForm);

    if (!validateRequiredFields(updated)) return;
    if (!validateAuthor(updated)) return;

    db.ref("autori/" + id).update(updated)
        .then(() => {
            editForm.removeAttribute("data-edit-id");
            editForm.reset();
            editModal.style.display = "none";
            document.body.classList.remove("modal-open");
            showToast("Аутор успешно измењен!");
            loadAuthors();
        })
        .catch(err => console.error(err));
};

loadAuthors();

const openAddBtn = document.getElementById("open-add");

openAddBtn.onclick = () => {
    addModal.style.display = "flex";
    document.body.classList.add("modal-open");
};

window.onclick = (e) => {
    if (e.target === addModal) {
        addModal.style.display = "none";
        document.body.classList.remove("modal-open");
    }

    if (e.target === editModal) {
        editModal.style.display = "none";
        document.body.classList.remove("modal-open");
    }
};