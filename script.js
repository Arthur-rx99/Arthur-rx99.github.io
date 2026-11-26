// ===== Fond interactif du haut de page : un scan réseau =====
// Chaque point est une machine du réseau. La souris est le scanner : les machines
// proches s'allument, affichent leur IP et un port ouvert, puis restent « découvertes »
// quelques secondes. Sans souris (mobile), le scanner se promène tout seul.
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const hero = document.getElementById("accueil");
const VERT = "52, 211, 153";
const PORTS = ["21/tcp ftp", "22/tcp ssh", "80/tcp http", "443/tcp https", "445/tcp smb", "3306/tcp mysql", "8080/tcp http-alt"];
const PORTEE = 110;     // rayon du scanner en px
const ETIQUETTE = 75;   // distance sous laquelle l'IP s'affiche
const calme = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let hotes = [];
let echos = [];
let largeur = 0, hauteur = 0, ratio = 1;
const scanner = { x: 0, y: 0, cibleX: 0, cibleY: 0, angle: 0 };
let sourisActive = false;
let dernierEcho = 0;

function initFond() {
  ratio = Math.min(window.devicePixelRatio || 1, 2);
  largeur = hero.offsetWidth;
  hauteur = hero.offsetHeight;
  canvas.width = largeur * ratio;
  canvas.height = hauteur * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // Une grille légèrement désordonnée : on dirait une carte réseau, pas un quadrillage
  const pas = largeur < 600 ? 70 : 88;
  hotes = [];
  let n = 2;
  for (let y = pas / 2; y < hauteur; y += pas) {
    for (let x = pas / 2; x < largeur; x += pas) {
      if (Math.random() < 0.18) continue; // quelques trous
      hotes.push({
        x: x + (Math.random() - 0.5) * pas * 0.6,
        y: y + (Math.random() - 0.5) * pas * 0.6,
        ip: `192.168.56.${n++ % 254 || 1}`,
        port: PORTS[Math.floor(Math.random() * PORTS.length)],
        vu: 0, // 1 = vient d'être scanné, redescend doucement à 0
      });
    }
  }
  scanner.x = scanner.cibleX = largeur * 0.7;
  scanner.y = scanner.cibleY = hauteur * 0.45;
}

function dessinerFond(t) {
  ctx.clearRect(0, 0, largeur, hauteur);

  // Sans souris, le scanner suit une boucle lente
  if (!sourisActive) {
    scanner.cibleX = largeur * (0.62 + 0.25 * Math.sin(t / 5200));
    scanner.cibleY = hauteur * (0.48 + 0.3 * Math.sin(t / 3700));
  }
  scanner.x += (scanner.cibleX - scanner.x) * 0.08;
  scanner.y += (scanner.cibleY - scanner.y) * 0.08;
  scanner.angle = (t / 900) % (Math.PI * 2);

  // Balayage radar (secteur qui tourne)
  ctx.save();
  ctx.translate(scanner.x, scanner.y);
  ctx.rotate(scanner.angle);
  const balayage = ctx.createLinearGradient(0, 0, PORTEE, 0);
  balayage.addColorStop(0, `rgba(${VERT}, 0.16)`);
  balayage.addColorStop(1, `rgba(${VERT}, 0)`);
  ctx.fillStyle = balayage;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, PORTEE, -0.45, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Cercle de portée en pointillés
  ctx.setLineDash([3, 6]);
  ctx.strokeStyle = `rgba(${VERT}, 0.22)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(scanner.x, scanner.y, PORTEE, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Machines
  ctx.font = '500 11px "JetBrains Mono", monospace';
  ctx.textBaseline = "middle";
  for (const h of hotes) {
    const d = Math.hypot(h.x - scanner.x, h.y - scanner.y);
    if (d < PORTEE) {
      h.vu = 1;
      // liaison scanner → machine
      ctx.strokeStyle = `rgba(${VERT}, ${0.35 * (1 - d / PORTEE)})`;
      ctx.beginPath();
      ctx.moveTo(scanner.x, scanner.y);
      ctx.lineTo(h.x, h.y);
      ctx.stroke();
    } else {
      h.vu = Math.max(0, h.vu - 0.006);
    }

    const a = 0.16 + h.vu * 0.7;
    ctx.fillStyle = `rgba(${VERT}, ${a})`;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 1.6 + h.vu * 1.6, 0, Math.PI * 2);
    ctx.fill();

    if (h.vu > 0.4) { // petit carré autour des machines découvertes
      ctx.strokeStyle = `rgba(${VERT}, ${(h.vu - 0.4) * 0.8})`;
      ctx.strokeRect(h.x - 6, h.y - 6, 12, 12);
    }
    if (d < ETIQUETTE) {
      const alpha = 1 - d / ETIQUETTE;
      ctx.fillStyle = `rgba(240, 247, 243, ${0.85 * alpha})`;
      ctx.fillText(h.ip, h.x + 11, h.y - 6);
      ctx.fillStyle = `rgba(${VERT}, ${0.9 * alpha})`;
      ctx.fillText(`${h.port} open`, h.x + 11, h.y + 8);
    }
  }

  // Un « ping » part de temps en temps d'une machine au hasard
  if (t - dernierEcho > 900 && hotes.length) {
    dernierEcho = t;
    const h = hotes[Math.floor(Math.random() * hotes.length)];
    echos.push({ x: h.x, y: h.y, r: 0 });
  }
  echos = echos.filter((e) => e.r < 60);
  for (const e of echos) {
    e.r += 0.8;
    ctx.strokeStyle = `rgba(${VERT}, ${0.4 * (1 - e.r / 60)})`;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Le scanner lui-même : une petite croix de visée
  ctx.strokeStyle = `rgba(${VERT}, 0.8)`;
  ctx.beginPath();
  ctx.moveTo(scanner.x - 8, scanner.y); ctx.lineTo(scanner.x - 3, scanner.y);
  ctx.moveTo(scanner.x + 3, scanner.y); ctx.lineTo(scanner.x + 8, scanner.y);
  ctx.moveTo(scanner.x, scanner.y - 8); ctx.lineTo(scanner.x, scanner.y - 3);
  ctx.moveTo(scanner.x, scanner.y + 3); ctx.lineTo(scanner.x, scanner.y + 8);
  ctx.stroke();

  if (!calme) requestAnimationFrame(dessinerFond);
}

hero.addEventListener("pointermove", (e) => {
  if (e.pointerType !== "mouse") return;
  const r = hero.getBoundingClientRect();
  scanner.cibleX = e.clientX - r.left;
  scanner.cibleY = e.clientY - r.top;
  sourisActive = true;
});
hero.addEventListener("pointerleave", () => { sourisActive = false; });
window.addEventListener("resize", initFond);
initFond();
requestAnimationFrame(dessinerFond);

// ===== Atouts : un petit terminal à onglets =====
const atouts = document.getElementById("atouts");
if (atouts) {
  const onglets = [...atouts.querySelectorAll(".atout-tab")];
  const barre = atouts.querySelector(".atouts-progress span");
  let actif = 0, minuteur = null, auto = !calme;
  const DUREE = 6000;

  function afficher(i, focus = false) {
    actif = (i + onglets.length) % onglets.length;
    onglets.forEach((o, n) => {
      const choisi = n === actif;
      o.setAttribute("aria-selected", choisi);
      o.tabIndex = choisi ? 0 : -1;
      document.getElementById(o.getAttribute("aria-controls")).hidden = !choisi;
    });
    if (focus) onglets[actif].focus();
    // relance l'animation de la commande tapée
    const cmd = document.querySelector(`#${onglets[actif].getAttribute("aria-controls")} .atout-cmd`);
    cmd.classList.remove("tape"); void cmd.offsetWidth; cmd.classList.add("tape");
    relancer();
  }
  function relancer() {
    clearTimeout(minuteur);
    barre.style.transition = "none"; barre.style.transform = "scaleX(0)";
    if (!auto) return;
    void barre.offsetWidth;
    barre.style.transition = `transform ${DUREE}ms linear`; barre.style.transform = "scaleX(1)";
    minuteur = setTimeout(() => afficher(actif + 1), DUREE);
  }
  onglets.forEach((o, n) => o.addEventListener("click", () => { auto = false; afficher(n); }));
  atouts.querySelector(".atouts-list").addEventListener("keydown", (e) => {
    const sens = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (sens) { e.preventDefault(); auto = false; afficher(actif + sens, true); }
  });
  // Défilement automatique seulement quand le bloc est visible
  new IntersectionObserver(([e]) => { if (e.isIntersecting) relancer(); else clearTimeout(minuteur); }, { threshold: 0.4 }).observe(atouts);
}

// Photo de profil absente : on la retire pour laisser les initiales (remplace l'ancien onerror en ligne, bloqué par la CSP)
const photo = document.querySelector(".avatar img");
if (photo) {
  const retirer = () => photo.remove();
  if (photo.complete && !photo.naturalWidth) retirer(); else photo.addEventListener("error", retirer);
}

// ===== Navigation : fond au scroll, menu mobile, lien actif =====
const nav = document.getElementById("nav");
const burger = document.getElementById("burger");
const menu = document.getElementById("menu");
const liens = menu.querySelectorAll("a");

window.addEventListener("scroll", () => nav.classList.toggle("scrolled", window.scrollY > 50));

burger.addEventListener("click", () => {
  burger.classList.toggle("open");
  menu.classList.toggle("open");
});
liens.forEach((a) => a.addEventListener("click", () => {
  burger.classList.remove("open");
  menu.classList.remove("open");
}));

const sections = document.querySelectorAll("section[id]");
const obsNav = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      liens.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    }
  });
}, { rootMargin: "-50% 0px -50% 0px" });
sections.forEach((s) => obsNav.observe(s));

// ===== Apparition des éléments au scroll =====
const obsReveal = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      obsReveal.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => obsReveal.observe(el));

// ===== Filtres des projets =====
document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    document.querySelectorAll(".project").forEach((p) => {
      p.classList.toggle("hidden", f !== "all" && p.dataset.cat !== f);
    });
  });
});

// ===== Formulaire : envoi direct dans la boîte mail via Web3Forms (sans quitter la page) =====
const ADRESSE = "arthurroux99@gmail.com";
// Clé d'accès Web3Forms : elle n'est pas secrète, elle indique seulement à quelle boîte livrer les messages
const CLE_WEB3FORMS = "eeddf5d7-c28f-4f42-b63a-cb88801dbc75";
const formulaire = document.getElementById("form");
const statut = document.getElementById("form-statut");
const UN_JOUR = 24 * 60 * 60 * 1000;
const CLE_ENVOIS = "portfolio-envois";
function lireEnvois() {
  try { return JSON.parse(localStorage.getItem(CLE_ENVOIS)) || {}; } catch { return {}; }
}
function attenteRestante(email) {
  const envois = lireEnvois();
  const dernier = Math.max(envois.navigateur || 0, envois[email.trim().toLowerCase()] || 0);
  return Math.max(0, dernier + UN_JOUR - Date.now());
}
function noterEnvoi(email) {
  const envois = lireEnvois();
  const maintenant = Date.now();
  // on ne garde que les envois de moins de 24 h
  for (const k of Object.keys(envois)) if (maintenant - envois[k] > UN_JOUR) delete envois[k];
  envois.navigateur = maintenant;
  envois[email.trim().toLowerCase()] = maintenant;
  try { localStorage.setItem(CLE_ENVOIS, JSON.stringify(envois)); } catch { /* stockage indisponible */ }
}
formulaire.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  if (f.botcheck.value) return; // robot
  // Anti-spam : un message par jour et par visiteur (navigateur + adresse e-mail)
  const restant = attenteRestante(f.email.value);
  if (restant > 0) {
    const minutes = Math.ceil(restant / 60000), h = Math.floor(minutes / 60), m = minutes % 60;
    statut.className = "form-statut erreur";
    statut.textContent = `Vous avez déjà envoyé un message aujourd'hui. Réessayez dans ${[h && h + " h", m && m + " min"].filter(Boolean).join(" ")}.`;
    return;
  }
  // Captcha (hCaptcha via Web3Forms) : le jeton est vérifié par leur serveur, un script ne peut pas s'en passer
  const jeton = f.querySelector('[name="h-captcha-response"]');
  if (f.querySelector(".h-captcha") && (!jeton || !jeton.value)) {
    statut.className = "form-statut erreur";
    statut.textContent = "Coche la case « Je suis humain » avant d'envoyer.";
    return;
  }
  const bouton = f.querySelector("button[type=submit]");
  bouton.disabled = true;
  statut.className = "form-statut";
  statut.textContent = "$ envoi en cours…";
  let delai, patience;
  try {
    // Délai maximum : au-delà de 20 s, on propose le plan B plutôt que de laisser attendre
    const ctrl = new AbortController();
    delai = setTimeout(() => ctrl.abort(), 20000);
    patience = setTimeout(() => { statut.textContent = "$ envoi en cours… cela peut prendre quelques secondes"; }, 4000);
    if (CLE_WEB3FORMS === "A_REMPLACER") throw new Error("clé manquante");
    const rep = await fetch("https://api.web3forms.com/submit", {
      signal: ctrl.signal,
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CLE_WEB3FORMS,
        subject: "Contact portfolio - " + f.nom.value,
        from_name: "Portfolio Arthur Roux",
        name: f.nom.value, email: f.email.value, message: f.message.value,
        botcheck: "",
        "h-captcha-response": jeton ? jeton.value : "",
      }),
    });
    clearTimeout(patience);
    const res = await rep.json().catch(() => ({}));
    if (!rep.ok || String(res.success) !== "true") throw new Error(res.message || "échec");
    noterEnvoi(f.email.value);
    statut.classList.add("ok");
    statut.textContent = "Message envoyé, merci ! Je vous réponds rapidement.";
    f.reset();
  } catch (err) {
    // Plan B : ouvrir la messagerie du visiteur avec le message pré-rempli
    statut.classList.add("erreur");
    const sujet = encodeURIComponent("Contact portfolio - " + f.nom.value);
    const corps = encodeURIComponent(f.message.value + "\n\n" + f.nom.value + " (" + f.email.value + ")");
    statut.innerHTML = `L'envoi n'a pas marché. <a href="mailto:${ADRESSE}?subject=${sujet}&body=${corps}">Écrivez-moi directement par mail</a>.`;
  } finally {
    clearTimeout(delai); clearTimeout(patience);
    bouton.disabled = false;
    if (window.hcaptcha) try { window.hcaptcha.reset(); } catch { /* captcha pas encore chargé */ }
  }
});

document.getElementById("year").textContent = new Date().getFullYear();

// ===== Bandeaux de logos qui défilent de droite à gauche =====
// On duplique les logos pour que la boucle soit continue (les copies sont masquées aux lecteurs d'écran).
document.querySelectorAll(".marquee-track").forEach((track) => {
  const originaux = [...track.children];
  const marquee = track.parentElement;
  // Remplir au moins deux fois la largeur visible, puis doubler le tout
  let tours = 0;
  while (track.scrollWidth < marquee.offsetWidth * 2 && tours++ < 10) {
    originaux.forEach((li) => {
      const copie = li.cloneNode(true);
      copie.setAttribute("aria-hidden", "true");
      track.appendChild(copie);
    });
  }
  [...track.children].forEach((li) => {
    const copie = li.cloneNode(true);
    copie.setAttribute("aria-hidden", "true");
    track.appendChild(copie);
  });
  // Vitesse constante quel que soit le nombre de logos (~45 px par seconde)
  track.style.animationDuration = `${track.scrollWidth / 2 / 45}s`;
});
