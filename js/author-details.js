async function loadAuthorRatings(authorId) {
    const [ratingsSnap, usersSnap] = await Promise.all([
        db.ref("ocene").once("value"),
        db.ref("korisnici").once("value")
    ]);

    const users = usersSnap.val() || {};
    const ratings = [];

    let sum = 0;
    let count = 0;

    ratingsSnap.forEach(child => {
        const r = child.val();

        if (r.idAutora === authorId) {
            const user = users[r.idKorisnika];

            ratings.push({
                ...r,
                username: user ? user.korisnickoIme : "Непознат корисник"
            });

            sum += Number(r.vrednost);
            count++;
        }
    });

    const avg = count ? (sum / count).toFixed(2) : 0;

    document.getElementById("author-rating").textContent =
        count
            ? `${avg} / 5 ⭐ (${count} ocena)`
            : "Нема оцена.";

    const list = document.getElementById("ratings-list");

    if (ratings.length === 0) {
        list.innerHTML = "<p>Још нema оцена.</p>";
        return;
    }

    list.innerHTML = ratings.map(r => `
        <div class="author-rating-card">
            <p><b>${r.username}</b>: ⭐ ${r.vrednost} / 5</p>
            <small>${r.datum}</small>
        </div>
    `).join("");
}

let selectedRating = 0;

function renderRatingSystem(authorId) {
    const userId = localStorage.getItem("loggedUserId");
    const section = document.getElementById("rating-section");

    if (!section) return;

    if (!userId) {
        section.innerHTML = `
            <div class="author-rating-box">
                <h3>Оцени аутора</h3>

                <p>
                    Да бисте оценили аутора,
                    <button
                        class="btn-link-inline"
                        onclick="window.openLoginModal()">
                        пријавите се
                    </button>.
                </p>
            </div>
        `;

        return;
    }

        section.innerHTML = `
            <div class="author-rating-box">
                <h3>Оцени аутора</h3>

                <div id="stars">
                    ${[1,2,3,4,5].map(n => `
                        <span class="star" data-value="${n}">★</span>
                    `).join("")}
                </div>

                <button id="submit-rating" class="btn-primary">
                    Пошаљи оцену
                </button>
            </div>
        `;
}

function setupStars(authorId) {
    const stars = document.querySelectorAll(".star");

    stars.forEach(star => {
        star.addEventListener("click", () => {
            selectedRating = Number(star.dataset.value);

            stars.forEach(s => {
                s.classList.remove("active");

                if (Number(s.dataset.value) <= selectedRating) {
                    s.classList.add("active");
                }
            });
        });
    });

    document.getElementById("submit-rating").onclick = async () => {
        const userId = localStorage.getItem("loggedUserId");

        if (!selectedRating) return;

        const newRef = db.ref("ocene").push();

        await newRef.set({
            vrednost: selectedRating,
            datum: new Date().toISOString().split("T")[0],
            idAutora: authorId,
            idKorisnika: userId
        });

        selectedRating = 0;

        loadAuthorRatings(authorId);
    };
}

document.addEventListener("DOMContentLoaded", () => {

    const params = new URLSearchParams(window.location.search);
    const authorId = params.get("id");

    const container = document.getElementById("author-container");

    db.ref(`autori/${authorId}`).once("value", async (snapshot) => {
        const author = snapshot.val();

        if (!author) {
            container.innerHTML = "<p>Autor nije pronađen</p>";
            return;
        }

        // slike
        const images = document.getElementById("author-images");
        images.innerHTML = (author.slike || [])
            .map(img => `<img src="${img}" class="author-img">`)
            .join("");

        document.getElementById("author-name").textContent =
            `${author.ime} ${author.prezime}`;

        document.getElementById("author-bio").textContent =
            author.biografija;

        document.getElementById("author-status").textContent =
            author.status;

        document.getElementById("author-awards").textContent =
            author.brojOsvojenihNagrada;

        document.getElementById("author-sold").textContent =
            author.brojProdatihPrimeraka;

        await loadAuthorRatings(authorId);

        renderRatingSystem(authorId);
        setupStars(authorId);

        loadAuthorRatings(authorId);
    });

});