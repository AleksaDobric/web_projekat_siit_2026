import { db } from "./firebase-config.js";
import { ref, get, push, set } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";


document.addEventListener("DOMContentLoaded", () => {
    const modalHTML = `
  <div id="auth-modal-overlay" class="modal-overlay hidden">
    <div class="modal-box">
      <button class="modal-close" id="modal-close-btn">✕</button>

      <!-- LOGIN -->
      <div id="tab-login">
        <h2>Prijava</h2>
        <div class="tab-switch">
          <button class="tab-btn active" onclick="switchTab('login')">Prijava</button>
          <button class="tab-btn" onclick="switchTab('register')">Registracija</button>
        </div>
        <form id="login-form" novalidate>
          <label>Korisničko ime</label>
          <input type="text" id="login-username" placeholder="Unesite korisničko ime">
          <span class="field-error" id="err-login-username"></span>

          <label>Lozinka</label>
          <input type="password" id="login-password" placeholder="Unesite lozinku">
          <span class="field-error" id="err-login-password"></span>

          <span class="field-error" id="err-login-general"></span>
          <button type="submit" class="btn-primary">Prijavi se</button>
        </form>
      </div>

      <!-- REGISTER -->
      <div id="tab-register" class="hidden">
        <h2>Registracija</h2>
        <div class="tab-switch">
          <button class="tab-btn" onclick="switchTab('login')">Prijava</button>
          <button class="tab-btn active" onclick="switchTab('register')">Registracija</button>
        </div>
        <form id="register-form" novalidate>
          <label>Korisničko ime *</label>
          <input type="text" id="reg-username" placeholder="Korisničko ime">
          <span class="field-error" id="err-reg-username"></span>

          <label>Lozinka *</label>
          <input type="password" id="reg-password" placeholder="Min. 6 karaktera">
          <span class="field-error" id="err-reg-password"></span>

          <label>Ime *</label>
          <input type="text" id="reg-ime" placeholder="Ime">
          <span class="field-error" id="err-reg-ime"></span>

          <label>Prezime *</label>
          <input type="text" id="reg-prezime" placeholder="Prezime">
          <span class="field-error" id="err-reg-prezime"></span>

          <label>Email *</label>
          <input type="email" id="reg-email" placeholder="email@primer.com">
          <span class="field-error" id="err-reg-email"></span>

          <label>Datum rođenja</label>
          <input type="date" id="reg-datum">
          <span class="field-error" id="err-reg-datum"></span>

          <label>Adresa</label>
          <input type="text" id="reg-adresa" placeholder="Grad, ulica...">

          <label>Zanimanje</label>
          <input type="text" id="reg-zanimanje" placeholder="Npr. Student">

          <span class="field-error" id="err-reg-general"></span>
          <button type="submit" class="btn-primary">Registruj se</button>
        </form>
      </div>
    </div>
  </div>`;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    
    updateNavAuth();

    document.getElementById("modal-close-btn").addEventListener("click", closeModal);
    document.getElementById("auth-modal-overlay").addEventListener("click", (e) => {
        if (e.target.id === "auth-modal-overlay") closeModal();
    });

    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("register-form").addEventListener("submit", handleRegister);
});


window.switchTab = function(tab) {
    document.getElementById("tab-login").classList.toggle("hidden", tab !== "login");
    document.getElementById("tab-register").classList.toggle("hidden", tab !== "register");
    document.querySelectorAll(".tab-btn").forEach((b, i) => {
        b.classList.toggle("active", (tab === "login" && i === 0) || (tab === "register" && i === 1));
    });
};


window.openLoginModal = function() {
    switchTab("login");
    document.getElementById("auth-modal-overlay").classList.remove("hidden");
};
window.openRegisterModal = function() {
    switchTab("register");
    document.getElementById("auth-modal-overlay").classList.remove("hidden");
};
function closeModal() {
    document.getElementById("auth-modal-overlay").classList.add("hidden");
    clearErrors();
}

function clearErrors() {
    document.querySelectorAll(".field-error").forEach(el => el.textContent = "");
}


export function getLoggedInUser() {
    const id = localStorage.getItem("loggedUserId");
    if (!id) return null;
    return { id };
}
export function getLoggedInUserId() {
    return localStorage.getItem("loggedUserId");
}


function updateNavAuth() {
    const userId = localStorage.getItem("loggedUserId");
    const userName = localStorage.getItem("loggedUserName");
    const nav = document.querySelector("nav");
    if (!nav) return;

    nav.querySelectorAll(".nav-auth").forEach(el => el.remove());

    const spacer = document.createElement("span");
    spacer.style.flex = "1";
    spacer.classList.add("nav-auth");
    nav.appendChild(spacer);

    if (userId) {
        const span = document.createElement("span");
        span.classList.add("nav-auth", "nav-user");
        span.innerHTML = `<b>👤 ${userName || "Korisnik"}</b>`;
        nav.appendChild(span);

        const btn = document.createElement("button");
        btn.classList.add("nav-auth", "btn-nav-logout");
        btn.textContent = "Odjavi se";
        btn.onclick = () => {
            localStorage.removeItem("loggedUserId");
            localStorage.removeItem("loggedUserName");
            location.reload();
        };
        nav.appendChild(btn);
    } else {
        const b1 = document.createElement("button");
        b1.classList.add("nav-auth", "btn-nav");
        b1.textContent = "Prijava";
        b1.onclick = () => window.openLoginModal();

        const b2 = document.createElement("button");
        b2.classList.add("nav-auth", "btn-nav");
        b2.textContent = "Registracija";
        b2.onclick = () => window.openRegisterModal();

        nav.appendChild(b1);
        nav.appendChild(b2);
    }
}


async function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();
    let valid = true;

    if (!username) {
        document.getElementById("err-login-username").textContent = "Unesite korisničko ime.";
        valid = false;
    }
    if (!password) {
        document.getElementById("err-login-password").textContent = "Unesite lozinku.";
        valid = false;
    }
    if (!valid) return;

    const snapshot = await get(ref(db, "korisnici"));
    if (!snapshot.exists()) {
        document.getElementById("err-login-general").textContent = "Pogrešno korisničko ime ili lozinka.";
        return;
    }

    let found = null;
    snapshot.forEach(child => {
        const u = child.val();
        if (u.korisnickoIme === username && u.lozinka === password) {
            found = { id: child.key, ...u };
        }
    });

    if (!found) {
        document.getElementById("err-login-general").textContent = "Pogrešno korisničko ime ili lozinka.";
        return;
    }

    localStorage.setItem("loggedUserId", found.id);
    localStorage.setItem("loggedUserName", found.korisnickoIme);
    closeModal();
    location.reload();
}


async function handleRegister(e) {
    e.preventDefault();
    clearErrors();

    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value.trim();
    const ime = document.getElementById("reg-ime").value.trim();
    const prezime = document.getElementById("reg-prezime").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const datum = document.getElementById("reg-datum").value;
    const adresa = document.getElementById("reg-adresa").value.trim();
    const zanimanje = document.getElementById("reg-zanimanje").value.trim();

    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!username || username.length < 3) {
        document.getElementById("err-reg-username").textContent = "Korisničko ime mora imati bar 3 karaktera.";
        valid = false;
    }
    if (!password || password.length < 6) {
        document.getElementById("err-reg-password").textContent = "Lozinka mora imati bar 6 karaktera.";
        valid = false;
    }
    if (!ime) {
        document.getElementById("err-reg-ime").textContent = "Ime je obavezno.";
        valid = false;
    }
    if (!prezime) {
        document.getElementById("err-reg-prezime").textContent = "Prezime je obavezno.";
        valid = false;
    }
    if (!email || !emailRegex.test(email)) {
        document.getElementById("err-reg-email").textContent = "Unesite ispravan email.";
        valid = false;
    }
    if (!valid) return;

    
    const snapshot = await get(ref(db, "korisnici"));
    if (snapshot.exists()) {
        let taken = false;
        snapshot.forEach(child => {
            if (child.val().korisnickoIme === username) taken = true;
        });
        if (taken) {
            document.getElementById("err-reg-username").textContent = "Korisničko ime je već zauzeto.";
            return;
        }
    }

    const newRef = push(ref(db, "korisnici"));
    await set(newRef, {
        korisnickoIme: username,
        lozinka: password,
        ime, prezime, email,
        datumRodjenja: datum || "",
        adresa: adresa || "",
        zanimanje: zanimanje || ""
    });

    localStorage.setItem("loggedUserId", newRef.key);
    localStorage.setItem("loggedUserName", username);
    closeModal();
    location.reload();
}