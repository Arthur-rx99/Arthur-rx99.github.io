// ===== Page de garde : date d'édition du rapport =====
const edition = document.getElementById("edition");
if (edition) edition.textContent = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

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
