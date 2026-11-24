// ===== Fond animé du haut de page uniquement =====
// Des symboles "cyber" en contour flottent doucement, avec un léger effet de profondeur à la souris.
const canvas = document.getElementById("hero-canvas");
const ctx = canvas.getContext("2d");
const hero = document.getElementById("accueil");
const VERT = "52, 211, 153";
const textes = ["</>", ">_", "{ }", "01", "#!", "$"];
const formes = ["cadenas", "bouclier", "cle"];
let symboles = [];
let souris = { x: 0, y: 0 };

function creerSymbole() {
  const estTexte = Math.random() < 0.5;
  return {
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    taille: 16 + Math.random() * 22,
    profondeur: 0.3 + Math.random() * 0.7,       // plus proche = plus visible et plus réactif
    vy: -(0.08 + Math.random() * 0.22),
    angle: Math.random() * Math.PI * 2,
    rotation: (Math.random() - 0.5) * 0.004,
    texte: estTexte ? textes[Math.floor(Math.random() * textes.length)] : null,
    forme: estTexte ? null : formes[Math.floor(Math.random() * formes.length)],
  };
}

function initFond() {
  canvas.width = hero.offsetWidth;
  canvas.height = hero.offsetHeight;
  const nombre = Math.round((canvas.width * canvas.height) / 38000);
  symboles = Array.from({ length: Math.min(nombre, 40) }, creerSymbole);
}

function dessinerForme(forme, t) {
  ctx.beginPath();
  if (forme === "cadenas") {
    ctx.rect(-t * 0.5, -t * 0.05, t, t * 0.7);
    ctx.moveTo(-t * 0.3, -t * 0.05);
    ctx.arc(0, -t * 0.05, t * 0.3, Math.PI, 0);
  } else if (forme === "bouclier") {
    ctx.moveTo(0, -t * 0.6);
    ctx.lineTo(t * 0.5, -t * 0.4);
    ctx.quadraticCurveTo(t * 0.5, t * 0.3, 0, t * 0.6);
    ctx.quadraticCurveTo(-t * 0.5, t * 0.3, -t * 0.5, -t * 0.4);
    ctx.closePath();
  } else {
    ctx.arc(-t * 0.3, 0, t * 0.22, 0, Math.PI * 2);
    ctx.moveTo(-t * 0.08, 0);
    ctx.lineTo(t * 0.55, 0);
    ctx.moveTo(t * 0.35, 0);
    ctx.lineTo(t * 0.35, t * 0.18);
    ctx.moveTo(t * 0.5, 0);
    ctx.lineTo(t * 0.5, t * 0.14);
  }
  ctx.stroke();
}

function animerFond() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const s of symboles) {
    s.y += s.vy * s.profondeur;
    s.angle += s.rotation;
    if (s.y < -50) { Object.assign(s, creerSymbole(), { y: canvas.height + 40 }); }

    const decalX = souris.x * 25 * s.profondeur;
    const decalY = souris.y * 25 * s.profondeur;

    ctx.save();
    ctx.translate(s.x + decalX, s.y + decalY);
    ctx.rotate(s.angle);
    const alpha = 0.08 + s.profondeur * 0.22;
    ctx.strokeStyle = ctx.fillStyle = `rgba(${VERT}, ${alpha})`;
    ctx.lineWidth = 1.4;
    if (s.texte) {
      ctx.font = `600 ${s.taille}px "JetBrains Mono", monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.texte, 0, 0);
    } else {
      dessinerForme(s.forme, s.taille * 1.3);
    }
    ctx.restore();
  }

  requestAnimationFrame(animerFond);
}

hero.addEventListener("mousemove", (e) => {
  const r = hero.getBoundingClientRect();
  souris.x = (e.clientX - r.left) / r.width - 0.5;
  souris.y = (e.clientY - r.top) / r.height - 0.5;
});
window.addEventListener("resize", initFond);
initFond();
animerFond();


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

// ===== Formulaire : ouvre la messagerie avec le message pré-rempli =====
document.getElementById("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const sujet = encodeURIComponent("Contact portfolio - " + f.nom.value);
  const corps = encodeURIComponent(f.message.value + "\n\n" + f.nom.value + " (" + f.email.value + ")");
  window.location.href = `mailto:arthurroux99@gmail.com?subject=${sujet}&body=${corps}`;
});

document.getElementById("year").textContent = new Date().getFullYear();

// ===== Barre de progression de lecture =====
const progress = document.getElementById("progress");
const majProgress = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
window.addEventListener("scroll", majProgress, { passive: true });
majProgress();

// ===== Machine à écrire dans le hero =====
const typed = document.getElementById("typed");
const roles = ["Futur pentester", "Développeur web", "Ex-barman médaillé", "Anglophone C1"];
const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (typed && !reduit) {
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));
  (async () => {
    let r = 0;
    await pause(2600);
    while (true) {
      const mot = roles[r];
      for (let i = mot.length; i >= 0; i--) { typed.textContent = mot.slice(0, i); await pause(35); }
      r = (r + 1) % roles.length;
      const suivant = roles[r];
      await pause(250);
      for (let i = 1; i <= suivant.length; i++) { typed.textContent = suivant.slice(0, i); await pause(70); }
      await pause(2200);
    }
  })();
}

// ===== Palette de commandes (Ctrl+K) =====
const palette = document.getElementById("palette");
const paletteQ = document.getElementById("palette-q");
const paletteList = document.getElementById("palette-list");
const commandes = [
  { label: "En ce moment", hint: "§01", href: "#maintenant" },
  { label: "À propos", hint: "§02", href: "#apropos" },
  { label: "Projets", hint: "§03", href: "#projets" },
  { label: "Parcours", hint: "§04", href: "#parcours" },
  { label: "Outils", hint: "§05", href: "#outils" },
  { label: "Contact", hint: "§06", href: "#contact" },
  { label: "Télécharger mon CV", hint: "pdf", href: "cv-arthur-roux.pdf", blank: true },
  { label: "GitHub", hint: "lien", href: "https://github.com/Arthur-rx99", blank: true },
  { label: "LinkedIn", hint: "lien", href: "https://www.linkedin.com/in/arthurroux", blank: true },
  { label: "Copier mon email", hint: "copie", action: () => navigator.clipboard && navigator.clipboard.writeText("arthurroux99@gmail.com") },
];
let resultats = commandes, choix = 0;

function rendrePalette() {
  const q = paletteQ.value.trim().toLowerCase();
  resultats = commandes.filter((c) => c.label.toLowerCase().includes(q) || c.hint.includes(q));
  choix = Math.min(choix, Math.max(resultats.length - 1, 0));
  paletteList.innerHTML = "";
  resultats.forEach((c, n) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", n === choix);
    li.innerHTML = `<span></span><em></em>`;
    li.firstChild.textContent = c.label;
    li.lastChild.textContent = c.hint;
    li.addEventListener("mouseenter", () => { choix = n; rendrePalette(); });
    li.addEventListener("click", () => executer(c));
    paletteList.appendChild(li);
  });
  if (!resultats.length) paletteList.innerHTML = '<li class="vide">Aucun résultat</li>';
}
function ouvrirPalette() {
  palette.hidden = false;
  paletteQ.value = "";
  choix = 0;
  rendrePalette();
  paletteQ.focus();
}
function fermerPalette() { palette.hidden = true; }
function executer(c) {
  fermerPalette();
  if (c.action) return c.action();
  if (c.blank) return window.open(c.href, "_blank", "noopener");
  location.hash = c.href;
}
document.getElementById("open-palette").addEventListener("click", ouvrirPalette);
paletteQ.addEventListener("input", () => { choix = 0; rendrePalette(); });
palette.addEventListener("click", (e) => { if (e.target === palette) fermerPalette(); });
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    palette.hidden ? ouvrirPalette() : fermerPalette();
    return;
  }
  if (palette.hidden) return;
  if (e.key === "Escape") fermerPalette();
  if (e.key === "ArrowDown") { e.preventDefault(); choix = (choix + 1) % resultats.length; rendrePalette(); }
  if (e.key === "ArrowUp") { e.preventDefault(); choix = (choix - 1 + resultats.length) % resultats.length; rendrePalette(); }
  if (e.key === "Enter" && resultats[choix]) executer(resultats[choix]);
});
