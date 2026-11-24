// ===== Terminal interactif : on tape des commandes pour explorer le portfolio =====
(() => {
  const btn = document.getElementById("term-ouvrir");
  const fenetre = document.getElementById("term");
  const sortie = document.getElementById("term-sortie");
  const saisie = document.getElementById("term-saisie");
  const form = document.getElementById("term-form");
  if (!btn || !fenetre) return;

  const historique = [];
  let pos = 0;
  let premiereFois = true;

  const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lien = (url, texte) => `<a href="${url}" target="_blank" rel="noopener">${texte}</a>`;
  const v = (t) => `<span class="t-vert">${t}</span>`;
  const g = (t) => `<span class="t-gris">${t}</span>`;
  // commande cliquable : un clic la lance, comme si on l'avait tapée
  const c = (cmd, txt = cmd) => `<button type="button" class="t-cmd" data-cmd="${cmd}">${txt}</button>`;

  // ----- Mode guidé : les étapes à suivre pour découvrir le profil -----
  const ETAPES = [
    ["whoami", "pour savoir qui je suis"],
    ["ls", "pour lister mes fichiers"],
    ["cat about.txt", "pour lire ma présentation"],
    ["cat competences.txt", "pour voir mes compétences"],
    ["projets", "pour voir mes projets"],
    ["cat parcours.txt", "pour mon parcours"],
    ["contact", "pour savoir comment me joindre"],
    ["cv", "pour télécharger mon CV"],
  ];
  let etape = -1; // -1 = guide inactif
  const consigne = () => {
    const [cmd, but] = ETAPES[etape];
    return `<span class="t-guide">→ Étape ${etape + 1}/${ETAPES.length} : tape ${c(cmd)} ${but}</span>`;
  };

  const FICHIERS = {
    "about.txt": () => [
      `Arthur Roux, 23 ans, étudiant en ${v("BTS SIO")} à MyDigitalSchool Paris.`,
      `Objectif : me spécialiser en ${v("cybersécurité")} et devenir ${v("pentester")}.`,
      "Avant l'informatique : plusieurs années en hôtellerie de luxe",
      "(Fouquet's, Hôtel du Louvre, Dublin). Anglais C1, espagnol B1.",
      `${g("Statut :")} recherche d'alternance · Courbevoie (92)`,
    ],
    "competences.txt": () => [
      `${v("cyber")}      Kali Linux, Nmap, Metasploit, CTF et labs`,
      `${v("systèmes")}   Linux, Ubuntu, VirtualBox, Cisco, Bash`,
      `${v("dev")}        HTML, CSS, JavaScript, Python, Git, GitHub`,
      `${v("ia")}         automatisation de tâches avec l'IA`,
      `${v("humain")}     sang-froid, sens du service, travail en équipe`,
    ],
    "parcours.txt": () => [
      `${v("2024 →")}  BTS SIO · MyDigitalSchool Paris`,
      `${g("avant")}   Fouquet's ★★★★★ · Hôtel du Louvre ★★★★★`,
      `        The Church Café (Dublin) · Restaurant Amazonia`,
      `${g("tape")}    ${v("cd parcours")} pour voir le détail sur la page`,
    ],
    "contact.txt": () => [
      `${g("email")}     ${lien("mailto:arthurroux99@gmail.com", "arthurroux99@gmail.com")}`,
      `${g("linkedin")}  ${lien("https://www.linkedin.com/in/arthurroux", "linkedin.com/in/arthurroux")}`,
      `${g("github")}    ${lien("https://github.com/Arthur-rx99", "github.com/Arthur-rx99")}`,
    ],
  };
  const PROJETS = [
    ["lab-cyber", "Lab de cybersécurité (Kali, Nmap, Metasploit)", "https://github.com/Arthur-rx99/lab-pentest-kali"],
    ["restauration", "Portfolio restauration", "https://arthur-rx99.github.io/projets/restauration/"],
    ["curry", "Site Stephen Curry · Biographie", "https://arthur-rx99.github.io/projets/stephen-curry/"],
    ["chez-bun", "Chez Bun (burgers)", "https://arthur-rx99.github.io/projets/chez-bun/"],
  ];
  const SECTIONS = { accueil: "accueil", apropos: "apropos", about: "apropos", competences: "competences", projets: "projets", parcours: "parcours", loisirs: "loisirs", contact: "contact" };

  const COMMANDES = {
    help: () => [
      "Commandes disponibles (tu peux aussi cliquer dessus) :",
      `  ${c("guide")}            visite guidée, étape par étape`,
      `  ${c("whoami")}           qui je suis`,
      `  ${c("ls")}               lister les fichiers`,
      `  ${v("cat")} ${g("<fichier>")}    lire un fichier (ex. ${c("cat about.txt")})`,
      `  ${c("projets")}          mes projets, avec les liens`,
      `  ${v("open")} ${g("<projet>")}    ouvrir un projet (ex. ${c("open curry")})`,
      `  ${v("cd")} ${g("<section>")}     aller à une section (ex. ${c("cd contact")})`,
      `  ${c("cv")}               télécharger mon CV`,
      `  ${c("contact")}          me joindre`,
      `  ${c("clear")}            effacer l'écran · ${c("exit")} fermer`,
      g("Astuces : Tab complète, ↑ ↓ rappellent les commandes. Il y a aussi des commandes cachées…"),
    ],
    guide: () => {
      etape = 0;
      return [
        "Visite guidée : je te dis quoi taper, tu tapes la commande puis Entrée.",
        g("(Tu peux aussi cliquer sur la commande en vert. Tape « stop » pour quitter le guide.)"),
        "", consigne(),
      ];
    },
    stop: () => { etape = -1; return ["Guide arrêté. Tape " + c("help") + " pour voir toutes les commandes."]; },
    whoami: () => [`arthur · 23 ans · ${v("futur pentester")} · en recherche d'alternance`],
    ls: (args) => {
      if (args[0] && args[0].replace(/\/$/, "") === "projets") return COMMANDES.projets();
      return [`${v("projets/")}  about.txt  competences.txt  parcours.txt  contact.txt  cv.pdf`];
    },
    cat: (args) => {
      const f = args[0];
      if (!f) return ["usage : cat <fichier>"];
      if (f === "cv.pdf") return ["Fichier binaire. Essaie plutôt " + v("cv") + " pour le télécharger."];
      if (f === "/etc/shadow" || f === "/etc/passwd") return ["Bien essayé 😏 Permission refusée."];
      if (f === "flag.txt") return ["Pas si vite. Les vrais pentesters cherchent ailleurs…"];
      return FICHIERS[f] ? FICHIERS[f]() : [`cat: ${esc(f)}: fichier introuvable (tape ${v("ls")})`];
    },
    projets: () => [
      ...PROJETS.map(([id, nom, url]) => `${v(id.padEnd(14, " "))}${nom} · ${lien(url, "voir")}`),
      g(`Ouvre-en un avec ${v("open <projet>")}`),
    ],
    open: (args) => {
      const p = PROJETS.find(([id]) => id === args[0]);
      if (!p) return [`open: projet inconnu. Choix : ${PROJETS.map(([id]) => id).join(", ")}`];
      window.open(p[2], "_blank", "noopener");
      return [`Ouverture de ${v(p[1])} dans un nouvel onglet…`];
    },
    cd: (args) => {
      const cible = SECTIONS[(args[0] || "").replace(/\/$/, "")];
      if (!cible) return [`cd: sections : ${Object.keys(SECTIONS).filter((k) => k !== "about").join(", ")}`];
      fermer();
      document.getElementById(cible).scrollIntoView({ behavior: "smooth" });
      return [];
    },
    cv: () => {
      const a = document.createElement("a");
      a.href = "cv-arthur-roux.pdf"; a.download = "CV-Arthur-Roux.pdf";
      document.body.appendChild(a); a.click(); a.remove();
      return [`Téléchargement de ${v("CV-Arthur-Roux.pdf")}… ✓`];
    },
    contact: () => FICHIERS["contact.txt"](),
    github: () => { window.open("https://github.com/Arthur-rx99", "_blank", "noopener"); return ["Ouverture de GitHub…"]; },
    linkedin: () => { window.open("https://www.linkedin.com/in/arthurroux", "_blank", "noopener"); return ["Ouverture de LinkedIn…"]; },
    date: () => [new Date().toLocaleString("fr-FR")],
    echo: (args) => [esc(args.join(" "))],
    history: () => historique.map((c, i) => `${g(String(i + 1).padStart(3, " "))}  ${esc(c)}`),
    pwd: () => ["/home/arthur/portfolio"],
    clear: () => { sortie.innerHTML = ""; return []; },
    exit: () => { fermer(); return []; },
    // ----- commandes cachées -----
    sudo: () => ["arthur n'est pas dans le fichier sudoers. Cet incident sera signalé. 🚨", g("…mais tu as le bon réflexe.")],
    nmap: () => [
      "Starting Nmap scan on arthur-rx99.github.io",
      "PORT     STATE  SERVICE",
      `22/tcp   ${v("open")}   curiosité`,
      `80/tcp   ${v("open")}   motivation`,
      `443/tcp  ${v("open")}   alternance`,
      `1337/tcp ${v("open")}   pentest`,
      "Nmap done: 1 candidat trouvé, très prometteur.",
    ],
    hack: () => ["Accès refusé. Mais tu peux me recruter, c'est plus simple. → " + v("contact")],
    "rm": (args) => (args.join(" ").includes("-rf") ? ["Nice try. Ce portfolio est en lecture seule 🛡️"] : ["rm: opération non permise"]),
    snake: () => { lancerSnake(); return []; },
  };
  const NOMS = Object.keys(COMMANDES).filter((n) => !["sudo", "nmap", "hack", "rm", "snake"].includes(n));

  // ----- Easter egg : un Snake en ASCII, joué directement dans le terminal -----
  let jeu = null; // partie en cours (null = pas de jeu)
  const RECORD = "snake-record";
  const lireRecord = () => { try { return +localStorage.getItem(RECORD) || 0; } catch { return 0; } };
  const ecrireRecord = (n) => { try { localStorage.setItem(RECORD, n); } catch {} };
  const tactile = matchMedia("(pointer: coarse)").matches;

  function lancerSnake() {
    // Taille de la grille selon la place dispo (1 case = 2 caractères, pour qu'elle soit carrée)
    const mesure = document.createElement("span");
    mesure.textContent = "MMMMMMMMMM";
    sortie.appendChild(mesure);
    const cw = mesure.getBoundingClientRect().width / 10;
    const fs = parseFloat(getComputedStyle(sortie).fontSize) || 14;
    mesure.remove();
    const limite = (n, min, max) => Math.max(min, Math.min(max, n));
    const cols = limite(Math.floor((sortie.clientWidth - 50) / cw / 2), 10, 22);
    // hauteur dispo − marges − 3 lignes de texte (score, aide) − pad tactile, puis − 2 pour les bords
    const libre = sortie.clientHeight - 30 - 3 * fs * 1.6 - (tactile ? 160 : 0);
    const rows = limite(Math.floor(libre / (fs * 1.15)) - 1, 8, 16);

    const el = document.createElement("div");
    el.className = "snake";
    el.innerHTML = `<div class="snake-info"></div><pre class="snake-grille" aria-label="Jeu Snake"></pre>
      <div class="snake-aide">${tactile ? "glisse sur la grille ou utilise les flèches" : "← ↑ → ↓ ou ZQSD · espace pause · échap quitter"}</div>
      ${tactile ? `<div class="snake-pad">
        <button type="button" data-dir="haut" aria-label="Haut">▲</button>
        <button type="button" data-dir="gauche" aria-label="Gauche">◀</button>
        <button type="button" data-action="pause" aria-label="Pause">❚❚</button>
        <button type="button" data-dir="droite" aria-label="Droite">▶</button>
        <button type="button" data-dir="bas" aria-label="Bas">▼</button>
        <button type="button" data-action="quitter" class="snake-quitter" aria-label="Quitter">✕</button>
      </div>` : ""}`;
    sortie.appendChild(el);
    form.hidden = true;
    saisie.blur();

    const DIRS = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
    const info = el.querySelector(".snake-info");
    const grille = el.querySelector(".snake-grille");

    jeu = { el, cols, rows, record: lireRecord() };
    const nouvellePartie = () => {
      const x = Math.floor(cols / 2), y = Math.floor(rows / 2);
      Object.assign(jeu, {
        corps: [[x, y], [x - 1, y], [x - 2, y]],
        dir: [1, 0], file: [], score: 0, vitesse: 140,
        etat: "jeu", nouveauRecord: false,
      });
      placerPomme();
      dessiner();
      relancer();
    };
    const placerPomme = () => {
      const libres = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
        if (!jeu.corps.some(([a, b]) => a === x && b === y)) libres.push([x, y]);
      jeu.pomme = libres[Math.floor(Math.random() * libres.length)];
    };
    const relancer = () => { clearInterval(jeu.timer); jeu.timer = setInterval(tour, jeu.vitesse); };

    function tour() {
      if (jeu.etat !== "jeu") return;
      if (jeu.file.length) jeu.dir = jeu.file.shift();
      const [hx, hy] = jeu.corps[0];
      const tete = [hx + jeu.dir[0], hy + jeu.dir[1]];
      const mange = jeu.pomme && tete[0] === jeu.pomme[0] && tete[1] === jeu.pomme[1];
      const corps = mange ? jeu.corps : jeu.corps.slice(0, -1); // la queue avance, sauf si on mange
      if (tete[0] < 0 || tete[1] < 0 || tete[0] >= cols || tete[1] >= rows || corps.some(([a, b]) => a === tete[0] && b === tete[1])) {
        jeu.etat = "fin";
        clearInterval(jeu.timer);
        if (jeu.score > jeu.record) { jeu.record = jeu.score; jeu.nouveauRecord = true; ecrireRecord(jeu.score); }
        dessiner();
        return;
      }
      jeu.corps = [tete, ...corps];
      if (mange) {
        jeu.score++;
        placerPomme();
        if (jeu.vitesse > 70) { jeu.vitesse -= 4; relancer(); } // ça accélère un peu à chaque pomme
      }
      dessiner();
    }

    function dessiner() {
      const cases = Array.from({ length: rows }, () => Array(cols).fill(`<span class="snake-vide"> ·</span>`));
      if (jeu.pomme) cases[jeu.pomme[1]][jeu.pomme[0]] = `<span class="snake-pomme">&lt;&gt;</span>`;
      jeu.corps.forEach(([x, y], i) => { cases[y][x] = i ? `<span class="snake-corps">▓▓</span>` : `<span class="snake-tete">██</span>`; });
      const texte = cases.map((l) => l.join("")).join("\n");
      // Message au centre de la grille (pause / game over)
      const msg = jeu.etat === "pause" ? ["PAUSE", tactile ? "touche ❚❚ pour reprendre" : "espace pour reprendre"]
        : jeu.etat === "fin" ? ["GAME OVER", jeu.nouveauRecord ? "★ nouveau record ★" : `score : ${jeu.score}`, tactile ? "touche la grille pour rejouer" : "entrée pour rejouer · échap quitter"]
        : null;
      grille.innerHTML = texte;
      grille.classList.toggle("snake-voile", !!msg);
      if (msg) grille.insertAdjacentHTML("beforeend", `<span class="snake-msg">${msg.map((m, i) => i ? `<small>${m}</small>` : `<b>${m}</b>`).join("")}</span>`);
      info.innerHTML = `${v("snake")} ${g("·")} score ${v(String(jeu.score).padStart(3, "0"))} ${g("·")} record ${v(String(jeu.record).padStart(3, "0"))}`;
      sortie.scrollTop = sortie.scrollHeight;
    }

    // Changement de direction (on refuse le demi-tour sur soi-même)
    jeu.tourner = (nom) => {
      if (jeu.etat === "fin") return;
      if (jeu.etat === "pause") jeu.etat = "jeu";
      const d = DIRS[nom];
      const derniere = jeu.file[jeu.file.length - 1] || jeu.dir;
      if (d[0] === -derniere[0] && d[1] === -derniere[1]) return;
      if (d[0] === derniere[0] && d[1] === derniere[1]) return;
      if (jeu.file.length < 3) jeu.file.push(d);
    };
    jeu.pause = () => {
      if (jeu.etat === "fin") return;
      jeu.etat = jeu.etat === "pause" ? "jeu" : "pause";
      dessiner();
    };
    jeu.rejouer = nouvellePartie;

    // Tactile : glisser sur la grille, ou les boutons du pad
    let depart = null;
    grille.addEventListener("touchstart", (e) => { depart = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
    grille.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    grille.addEventListener("touchend", (e) => {
      if (!depart) return;
      const dx = e.changedTouches[0].clientX - depart[0], dy = e.changedTouches[0].clientY - depart[1];
      depart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { if (jeu.etat === "fin") nouvellePartie(); return; }
      jeu.tourner(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "droite" : "gauche") : (dy > 0 ? "bas" : "haut"));
    });
    grille.addEventListener("click", () => { if (!tactile && jeu.etat === "fin") nouvellePartie(); });
    el.querySelectorAll(".snake-pad button").forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (b.dataset.dir) jeu.tourner(b.dataset.dir);
      else if (b.dataset.action === "pause") jeu.pause();
      else quitterSnake();
    }));

    nouvellePartie();
  }

  function quitterSnake() {
    if (!jeu) return;
    clearInterval(jeu.timer);
    const { el, score, record } = jeu;
    jeu = null;
    el.remove();
    afficher([`${g("snake terminé ·")} score ${v(score)} ${g("·")} record ${v(record)}`, ""]);
    form.hidden = false;
    if (!fenetre.hidden) saisie.focus();
  }

  // Clavier pendant la partie : flèches, ZQSD (AZERTY) ou WASD (QWERTY), selon la position physique des touches
  const TOUCHES = {
    ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite",
    KeyW: "haut", KeyS: "bas", KeyA: "gauche", KeyD: "droite",
  };
  document.addEventListener("keydown", (e) => {
    if (!jeu || e.ctrlKey || e.metaKey || e.altKey) return;
    const dir = TOUCHES[e.key] || TOUCHES[e.code];
    if (dir) jeu.tourner(dir);
    else if (e.key === " " || e.key === "p") jeu.pause();
    else if (e.key === "Enter" && jeu.etat === "fin") jeu.rejouer();
    else if (e.key === "Escape" || e.key === "q") quitterSnake();
    else return;
    e.preventDefault();
    e.stopImmediatePropagation();
  }, true);
  document.addEventListener("visibilitychange", () => { if (document.hidden && jeu && jeu.etat === "jeu") jeu.pause(); });

  // Commande la plus proche (distance de Levenshtein ≤ 2)
  function suggestion(mot) {
    const dist = (a, b) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return d[a.length][b.length];
    };
    let meilleur = null, min = 3;
    for (const n of NOMS) { const x = dist(mot, n); if (x < min) { min = x; meilleur = n; } }
    return meilleur;
  }

  function afficher(lignes) {
    lignes.forEach((l) => {
      const p = document.createElement("div");
      p.className = "t-ligne";
      p.innerHTML = l || "&nbsp;";
      sortie.appendChild(p);
    });
    sortie.scrollTop = sortie.scrollHeight;
  }

  function executer(brut) {
    const ligne = brut.trim();
    afficher([`<span class="t-prompt">arthur@portfolio:~$</span> ${esc(ligne)}`]);
    if (!ligne) return;
    historique.push(ligne); pos = historique.length;
    const [cmd, ...args] = ligne.split(/\s+/);
    const fn = COMMANDES[cmd.toLowerCase()];
    if (fn) afficher(fn(args));
    else {
      const proche = suggestion(cmd.toLowerCase());
      afficher([`${esc(cmd)} : commande introuvable.` + (proche ? ` Tu voulais dire ${c(proche)} ?` : "") + ` Tape ${c("help")} pour la liste.`]);
    }
    // Mode guidé : passe à l'étape suivante si la bonne commande a été tapée
    if (etape >= 0 && !["guide", "stop"].includes(cmd.toLowerCase())) {
      if (ligne.toLowerCase() === ETAPES[etape][0]) {
        etape++;
        if (etape === ETAPES.length) {
          etape = -1;
          afficher(["", `<span class="t-guide">✓ Visite terminée, bravo ! Tu sais maintenant utiliser un terminal 😉</span>`,
            g("Pour aller plus loin : ") + c("help") + g(", ou cherche les commandes cachées…")]);
        } else afficher(["", consigne()]);
      } else afficher(["", g("Pas tout à fait. ") + consigne()]);
    }
  }

  function ouvrir() {
    fenetre.hidden = false;
    document.body.classList.add("term-actif");
    btn.setAttribute("aria-expanded", "true");
    if (premiereFois) {
      premiereFois = false;
      afficher([
        `Bienvenue sur le terminal d'Arthur ${g("(v1.0)")}`,
        `Jamais utilisé de terminal ? Tape ${c("guide")} pour une visite guidée.`,
        `Sinon, tape ${c("help")} pour voir toutes les commandes.`,
        "",
      ]);
    }
    setTimeout(() => saisie.focus(), 30);
  }
  function fermer() {
    quitterSnake();
    fenetre.hidden = true;
    document.body.classList.remove("term-actif");
    btn.setAttribute("aria-expanded", "false");
    btn.focus({ preventScroll: true });
  }

  btn.addEventListener("click", () => (fenetre.hidden ? ouvrir() : fermer()));
  document.querySelectorAll("[data-term-ouvrir]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); ouvrir(); }));
  fenetre.querySelector(".term-fermer").addEventListener("click", fermer);
  fenetre.addEventListener("click", (e) => { if (e.target === fenetre) fermer(); });
  sortie.addEventListener("click", (e) => {
    if (jeu) return; // pendant le Snake, les clics restent dans le jeu
    const bouton = e.target.closest(".t-cmd");
    if (bouton) { executer(bouton.dataset.cmd); saisie.focus(); return; }
    if (!getSelection().toString()) saisie.focus();
  });

  form.addEventListener("submit", (e) => { e.preventDefault(); executer(saisie.value); saisie.value = ""; });

  saisie.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp" && pos > 0) { e.preventDefault(); saisie.value = historique[--pos]; }
    else if (e.key === "ArrowDown") { e.preventDefault(); pos = Math.min(pos + 1, historique.length); saisie.value = historique[pos] || ""; }
    else if (e.key === "Tab") {
      e.preventDefault();
      const parts = saisie.value.split(" ");
      const dernier = parts[parts.length - 1];
      const choix = parts.length === 1 ? NOMS
        : parts[0] === "cat" ? [...Object.keys(FICHIERS), "cv.pdf"]
        : parts[0] === "open" ? PROJETS.map(([id]) => id)
        : parts[0] === "cd" ? Object.keys(SECTIONS) : [];
      const ok = choix.filter((c) => c.startsWith(dernier));
      if (ok.length === 1) { parts[parts.length - 1] = ok[0]; saisie.value = parts.join(" ") + (parts.length === 1 ? " " : ""); }
      else if (ok.length > 1) afficher([`<span class="t-prompt">arthur@portfolio:~$</span> ${esc(saisie.value)}`, ok.join("  ")]);
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); COMMANDES.clear(); }
  });

  // Raccourcis : Échap ferme, ² ou ` ou Ctrl+K ouvre
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !fenetre.hidden) { fermer(); return; }
    const champ = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (!champ && (e.key === "²" || e.key === "`"))) {
      e.preventDefault();
      fenetre.hidden ? ouvrir() : fermer();
    }
  });
})();
