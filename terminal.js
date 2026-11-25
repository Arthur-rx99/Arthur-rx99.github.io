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
  // ----- Chasse aux flags (mini CTF facile) -----
  // On ne garde ici que l'empreinte SHA-256 de chaque flag : lire ce fichier ne donne pas les réponses
  const FLAGS = [
    ["204431dd782bce21b319b8a6cbbd71849f239741cecdd9294b98f44705a1a4ce", "Les développeurs oublient parfois des choses dans le code source de la page (Ctrl+U)."],
    ["2a7d63681296f0963e6623acade91972f88e2920584299a315157ee829b850bb", "Les développeurs discutent dans la console du navigateur (F12, onglet Console)."],
    ["5edf270441a0a14d7bee2aeb3eabaf0a2c2e8857381cf2c865ff285eb94d2aa8", "Les robots des moteurs de recherche ont leur propre fichier de consignes (/robots.txt)."],
    ["133a41f34660cd8d63933c429a2099c9a665b556a1fa00e6ad7c0637bc61834f", "Sous Linux, les fichiers cachés commencent par un point. Liste-les avec ls -a."],
    ["3a060fd263c7e7a2cecf86f48ab43dd0812c327c2adc33cc643adb109a213d49", "Tape snake dans le terminal pour lancer le jeu, puis fais 10 points."],
  ];
  const CLE_FLAGS = "ctf-flags";
  const lireFlags = () => { try { return JSON.parse(localStorage.getItem(CLE_FLAGS)) || []; } catch { return []; } };
  const ecrireFlags = (l) => { try { localStorage.setItem(CLE_FLAGS, JSON.stringify(l)); } catch {} };
  const trouves = new Set(lireFlags());
  const progression = () => {
    const n = trouves.size, total = FLAGS.length;
    return `${v("█".repeat(n))}${g("░".repeat(total - n))}  ${v(n)}/${total} flags trouvés`;
  };
  async function empreinte(texte) {
    const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
    return [...new Uint8Array(octets)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function soumettre(flag) {
    if (!flag) return afficher([`usage : submit FLAG{...}`]);
    if (!window.crypto || !crypto.subtle) return afficher(["Vérification impossible sur cette page (il faut https)."]);
    const h = await empreinte(flag.trim());
    const i = FLAGS.findIndex(([x]) => x === h);
    if (i < 0) return afficher([`✗ ${esc(flag)} n'est pas un flag valide. Continue de chercher 🔍`]);
    if (trouves.has(i)) return afficher([`Tu as déjà trouvé ce flag 😉`, progression()]);
    trouves.add(i); ecrireFlags([...trouves]);
    const lignes = [`${v(`✓ Flag n°${i + 1} validé !`)} Bien joué.`, progression()];
    if (trouves.size === FLAGS.length) lignes.push("",
      `<span class="t-guide">🏆 Bravo, tu as trouvé les ${FLAGS.length} flags ! Tu as l'âme d'un pentester.</span>`,
      `Ça te dirait de travailler avec quelqu'un qui aime ça autant que toi ? → ${c("contact")}`);
    afficher(lignes);
  }

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
      `  ${c("ctf")}              chasse aux flags : ${FLAGS.length} flags cachés sur le site`,
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
      const cache = args.some((a) => /^-\w*a/.test(a));
      const dossier = args.find((a) => !a.startsWith("-"));
      if (dossier && dossier.replace(/\/$/, "") === "projets") return COMMANDES.projets();
      return [`${cache ? `${g(".")}  ${g("..")}  ${v(".secret")}  ` : ""}${v("projets/")}  about.txt  competences.txt  parcours.txt  contact.txt  cv.pdf`];
    },
    cat: (args) => {
      const f = args[0];
      if (!f) return ["usage : cat <fichier>"];
      if (f === "cv.pdf") return ["Fichier binaire. Essaie plutôt " + v("cv") + " pour le télécharger."];
      if (f === "/etc/shadow" || f === "/etc/passwd") return ["Bien essayé 😏 Permission refusée."];
      if (f === "flag.txt") return ["Pas si vite. Les vrais pentesters cherchent ailleurs… Tape " + c("ctf") + " pour la chasse aux flags."];
      if (f === ".secret") return [
        "RkxBR3tmMWNoMTNyX2M0Y2gzfQ==",
        g("Hmm, ça ne ressemble pas à du français. Ce == à la fin, c'est typique du base64…"),
        g("Essaie : ") + v("base64 -d &lt;texte&gt;"),
      ];
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
    ctf: () => [
      `${v("Chasse aux flags")} ${g("· un mini CTF pour les curieux")}`,
      `${FLAGS.length} flags de la forme ${v("FLAG{...}")} sont cachés sur ce site. Trouve-les et valide-les avec ${v("submit FLAG{...}")}.`,
      "",
      ...FLAGS.map(([, indice], i) => `${trouves.has(i) ? v("✓") : g("○")} ${g(`${i + 1}.`)} ${indice}`),
      "",
      progression(),
      g("Ta progression reste enregistrée dans ce navigateur."),
    ],
    submit: (args) => { soumettre(args.join(" ")); return []; },
    base64: (args) => {
      const texte = args.filter((a) => a !== "-d" && a !== "--decode").join("");
      if (!args.includes("-d") && !args.includes("--decode")) return [texte ? esc(btoa(unescape(encodeURIComponent(texte)))) : "usage : base64 -d <texte>"];
      try { return [esc(decodeURIComponent(escape(atob(texte))))]; } catch { return ["base64: entrée invalide"]; }
    },
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

  // ----- Easter egg : un Snake joué sur un vieux moniteur cathodique -----
  let jeu = null; // partie en cours (null = pas de jeu)
  const RECORD = "snake-record";
  const lireRecord = () => { try { return +localStorage.getItem(RECORD) || 0; } catch { return 0; } };
  const ecrireRecord = (n) => { try { localStorage.setItem(RECORD, n); } catch {} };
  const tactile = matchMedia("(pointer: coarse)").matches;
  const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Le clavier posé devant l'écran : [code de la touche, largeur, étiquette]
  // Les touches du jeu (ZQSD et flèches) sont marquées, et s'allument quand on appuie dessus
  const RANGEES = [
    [["Backquote"], ["Digit1"], ["Digit2"], ["Digit3"], ["Digit4"], ["Digit5"], ["Digit6"], ["Digit7"], ["Digit8"], ["Digit9"], ["Digit0"], ["Minus"], ["Equal"], ["Backspace", 2]],
    [["Tab", 1.5], ["KeyQ"], ["KeyW", 1, "Z"], ["KeyE"], ["KeyR"], ["KeyT"], ["KeyY"], ["KeyU"], ["KeyI"], ["KeyO"], ["KeyP"], ["BracketLeft"], ["BracketRight"], ["Enter", 1.5]],
    [["CapsLock", 1.75], ["KeyA", 1, "Q"], ["KeyS", 1, "S"], ["KeyD", 1, "D"], ["KeyF"], ["KeyG"], ["KeyH"], ["KeyJ"], ["KeyK"], ["KeyL"], ["Semicolon"], ["Quote"], ["Backslash", 2.25]],
    [["ShiftLeft", 2.25], ["KeyZ"], ["KeyX"], ["KeyC"], ["KeyV"], ["KeyB"], ["KeyN"], ["KeyM"], ["Comma"], ["Period"], ["Slash"], ["ShiftRight", 2.75]],
    [["ControlLeft", 1.5], ["MetaLeft", 1.25], ["AltLeft", 1.25], ["Space", 6.25], ["AltRight", 1.25], ["ContextMenu", 1.25], ["ControlRight", 1.5]],
  ];
  const JEU_TOUCHES = ["KeyW", "KeyA", "KeyS", "KeyD", "Space", "Escape"];
  const touche = ([code, w = 1, txt = ""]) =>
    `<span class="kb-t${JEU_TOUCHES.includes(code) || txt ? " kb-jeu" : ""}" data-k="${code}" style="--w:${w}">${txt}</span>`;
  const clavierHTML = () => `
    <div class="kb-principal">${RANGEES.map((r) => `<div class="kb-rang">${r.map(touche).join("")}</div>`).join("")}</div>
    <div class="kb-fleches">
      <span></span>${touche(["ArrowUp", 1, "↑"])}<span></span>
      ${touche(["ArrowLeft", 1, "←"])}${touche(["ArrowDown", 1, "↓"])}${touche(["ArrowRight", 1, "→"])}
    </div>`;

  // Le titre en lettres ASCII, affiché quand l'écran s'allume
  const TITRE = [
    " ___ _  _   _   _  _____ ",
    "/ __| \\| | /_\\ | |/ / __|",
    "\\__ \\ .` |/ _ \\| ' <| _| ",
    "|___/_|\\_/_/ \\_\\_|\\_\\___|",
  ].join("\n");

  function lancerSnake() {
    // La scène : on s'approche d'un bureau avec un vieux moniteur, l'écran s'allume, le Snake se lance dedans
    const scene = document.createElement("div");
    scene.className = "crt-scene" + (tactile ? " crt-tactile" : "");
    scene.setAttribute("role", "dialog");
    scene.setAttribute("aria-label", "Jeu Snake");
    scene.innerHTML = `
      <div class="crt-monde">
        <div class="crt-cadre">
          <div class="crt">
            <span class="crt-vis" style="top:2.4%;left:2.2%"></span><span class="crt-vis" style="top:2.4%;right:2.2%"></span>
            <span class="crt-aeration" aria-hidden="true"></span>
            <div class="crt-ecran">
              <div class="crt-contenu">
                <div class="snake-hud"></div>
                <canvas class="snake-canvas" aria-label="Grille du Snake"></canvas>
                <div class="snake-aide">${tactile ? "glisse sur l'écran ou utilise les flèches" : "← ↑ → ↓ ou ZQSD · espace pause · échap quitter"}</div>
                <div class="snake-ecran-msg" aria-live="polite"></div>
              </div>
            </div>
            <div class="crt-facade">
              <span class="crt-marque">AR-80<small>monochrome display</small></span>
              <span class="crt-boutons" aria-hidden="true">
                <i class="crt-molette" style="--r:-40deg"></i><i class="crt-molette" style="--r:25deg"></i>
                <b class="crt-power"></b><span class="crt-led"></span>
              </span>
            </div>
          </div>
          <div class="crt-pied" aria-hidden="true"></div>
        </div>
        ${tactile ? "" : `<div class="crt-clavier" aria-hidden="true">${clavierHTML()}</div>`}
      </div>
      ${tactile ? `<div class="snake-pad">
        <button type="button" data-dir="haut" aria-label="Haut">▲</button>
        <button type="button" data-dir="gauche" aria-label="Gauche">◀</button>
        <button type="button" data-action="pause" aria-label="Pause">❚❚</button>
        <button type="button" data-dir="droite" aria-label="Droite">▶</button>
        <button type="button" data-dir="bas" aria-label="Bas">▼</button>
        <button type="button" data-action="quitter" class="snake-quitter" aria-label="Quitter">✕</button>
      </div>` : ""}`;
    document.body.appendChild(scene);
    saisie.blur();

    // Taille de la grille selon la taille de l'écran (les mesures ignorent l'animation d'arrivée)
    const ecran = scene.querySelector(".crt-contenu");
    const hud = scene.querySelector(".snake-hud");
    const aide = scene.querySelector(".snake-aide");
    const msg = scene.querySelector(".snake-ecran-msg");
    const canvas = scene.querySelector(".snake-canvas");
    const ctx = canvas.getContext("2d");
    const limite = (n, min, max) => Math.max(min, Math.min(max, n));
    ecran.style.fontSize = limite(Math.round(ecran.clientWidth / 40), 10, 16) + "px";
    hud.innerHTML = "&nbsp;";
    const style = getComputedStyle(ecran);
    const dispoL = ecran.clientWidth - parseFloat(style.paddingLeft) * 2;
    const dispoH = ecran.clientHeight - parseFloat(style.paddingTop) * 2 - hud.offsetHeight - aide.offsetHeight - 16;
    const cell = Math.floor(Math.min(dispoL / (tactile ? 16 : 24), dispoH / 11));
    const cols = limite(Math.floor(dispoL / cell), 10, 30);
    const rows = limite(Math.floor(dispoH / cell), 8, 20);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = cols * cell + "px";
    canvas.style.height = rows * cell + "px";
    canvas.width = cols * cell * dpr;
    canvas.height = rows * cell * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const DIRS = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
    jeu = { el: scene, cols, rows, record: lireRecord(), intro: true, score: 0, particules: [], etat: "titre" };

    const initialiser = () => {
      const x = Math.floor(cols / 2), y = Math.floor(rows / 2);
      Object.assign(jeu, {
        corps: [[x, y], [x - 1, y], [x - 2, y]],
        queuePrec: [x - 3, y], dir: [1, 0], file: [], score: 0, vitesse: 140,
        nouveauRecord: false, dernierTour: performance.now(), mort: 0,
      });
      placerPomme();
    };
    const nouvellePartie = () => {
      initialiser();
      jeu.etat = "jeu";
      afficherHud();
      afficherMessage();
      relancer();
    };
    const placerPomme = () => {
      const libres = [];
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++)
        if (!jeu.corps.some(([a, b]) => a === x && b === y)) libres.push([x, y]);
      jeu.pomme = libres[Math.floor(Math.random() * libres.length)];
      jeu.pommeNee = performance.now();
      canvas.dataset.pomme = jeu.pomme.join(",");
    };
    const relancer = () => { clearInterval(jeu.timer); jeu.timer = setInterval(tour, jeu.vitesse); };

    function tour() {
      if (!jeu || jeu.etat !== "jeu") return;
      if (jeu.file.length) jeu.dir = jeu.file.shift();
      const [hx, hy] = jeu.corps[0];
      const tete = [hx + jeu.dir[0], hy + jeu.dir[1]];
      const mange = tete[0] === jeu.pomme[0] && tete[1] === jeu.pomme[1];
      const corps = mange ? jeu.corps : jeu.corps.slice(0, -1); // la queue avance, sauf si on mange
      if (tete[0] < 0 || tete[1] < 0 || tete[0] >= cols || tete[1] >= rows || corps.some(([a, b]) => a === tete[0] && b === tete[1])) {
        jeu.etat = "fin";
        jeu.mort = performance.now();
        clearInterval(jeu.timer);
        if (jeu.score > jeu.record) { jeu.record = jeu.score; jeu.nouveauRecord = true; ecrireRecord(jeu.score); }
        if (!reduit) { ecran.classList.remove("secousse"); void ecran.offsetWidth; ecran.classList.add("secousse"); }
        afficherHud();
        afficherMessage();
        return;
      }
      jeu.queuePrec = mange ? null : jeu.corps[jeu.corps.length - 1];
      jeu.corps = [tete, ...corps];
      jeu.dernierTour = performance.now();
      canvas.dataset.tete = tete.join(",");
      if (mange) {
        jeu.score++;
        if (jeu.score >= 10) jeu.flag = true;
        eclater(jeu.pomme);
        placerPomme();
        afficherHud(true);
        if (jeu.vitesse > 70) { jeu.vitesse -= 4; relancer(); } // ça accélère un peu à chaque pomme
      }
    }

    // Petite explosion de pixels quand on mange une pomme
    function eclater([x, y]) {
      if (reduit) return;
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI * 2 * i) / 16 + Math.random() * 0.4, v = 0.04 + Math.random() * 0.08;
        jeu.particules.push({ x: (x + 0.5) * cell, y: (y + 0.5) * cell, vx: Math.cos(a) * v * cell, vy: Math.sin(a) * v * cell, vie: 1, rouge: i % 3 === 0 });
      }
    }

    function afficherHud(bump) {
      const n = (x) => String(x).padStart(3, "0");
      hud.innerHTML = `<span>SNAKE</span><span>score <b class="${bump ? "bump" : ""}">${n(jeu.score)}</b></span><span>record <b>${n(jeu.record)}</b></span>`;
    }
    function afficherMessage() {
      const touche2 = tactile ? "touche l'écran" : "appuie sur une touche";
      const e = jeu.etat;
      msg.className = "snake-ecran-msg" + (e === "jeu" ? "" : " visible");
      msg.innerHTML = e === "titre" ? `<pre class="snake-titre">${esc(TITRE)}</pre>
          <p class="snake-clignote">▶ ${touche2} pour jouer</p>
          <small>record : ${jeu.record} · mange 10 pommes pour un flag 🚩</small>`
        : e === "pause" ? `<b>PAUSE</b><small>${tactile ? "touche ❚❚ pour reprendre" : "espace pour reprendre"}</small>`
        : e === "fin" ? `<b>GAME OVER</b><small>${jeu.nouveauRecord ? "★ nouveau record ★" : `score : ${jeu.score}`}</small>
          ${jeu.score >= 10 ? "<small>🚩 flag débloqué, quitte pour le voir</small>" : ""}
          <p class="snake-clignote">${tactile ? "touche l'écran pour rejouer" : "entrée pour rejouer · échap quitter"}</p>`
        : "";
    }

    // ----- Dessin, image par image : traînée du phosphore, serpent fluide, pomme qui pulse -----
    const centre = ([x, y]) => [(x + 0.5) * cell, (y + 0.5) * cell];
    const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    const melange = (t) => { // du vert clair (tête) au vert profond (queue)
      const a = [124, 245, 198], b = [12, 104, 72];
      return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
    };
    function dessiner(now) {
      if (!jeu) return;
      jeu.raf = requestAnimationFrame(dessiner);
      const L = cols * cell, H = rows * cell;
      // on n'efface pas tout : l'image précédente reste un peu, comme la rémanence d'un vieux tube
      ctx.fillStyle = reduit ? "rgb(5,14,10)" : "rgba(5,14,10,0.55)";
      ctx.fillRect(0, 0, L, H);
      // grille de points
      ctx.fillStyle = "rgba(142,165,154,0.10)";
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) ctx.fillRect((x + 0.5) * cell - 1, (y + 0.5) * cell - 1, 2, 2);

      const enJeu = jeu.etat === "jeu";
      const t = enJeu ? Math.max(0, Math.min(1, (now - jeu.dernierTour) / jeu.vitesse)) : 1;

      // la pomme
      if (jeu.pomme && jeu.etat !== "titre") {
        const [px, py] = centre(jeu.pomme);
        const nait = Math.max(0, Math.min(1, (now - jeu.pommeNee) / 220));
        const r = cell * 0.28 * nait * (1 + (reduit ? 0 : 0.1 * Math.sin(now / 170)));
        ctx.save();
        ctx.shadowColor = "rgba(229,83,75,0.9)"; ctx.shadowBlur = cell * 0.7;
        ctx.fillStyle = "#e5534b";
        ctx.beginPath(); ctx.arc(px, py + cell * 0.03, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.beginPath(); ctx.arc(px - r * 0.35, py - r * 0.3, r * 0.25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#34d399";
        ctx.beginPath(); ctx.ellipse(px + r * 0.35, py - r * 1.05, r * 0.38, r * 0.18, -0.6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // le serpent : une ligne arrondie qui passe par chaque case, la tête glisse entre deux cases
      if (jeu.etat !== "titre") {
        const c = jeu.corps, n = c.length;
        const pts = [lerp(c[1], c[0], t), ...c.slice(1)];
        if (jeu.queuePrec) pts.push(lerp(jeu.queuePrec, c[n - 1], t));
        const px = pts.map(centre);
        const clignote = jeu.etat === "fin" && !reduit && now - jeu.mort < 900 && Math.floor((now - jeu.mort) / 150) % 2 === 0;
        ctx.save();
        ctx.globalAlpha = clignote ? 0.25 : 1;
        ctx.lineCap = ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(52,211,153,0.85)"; ctx.shadowBlur = cell * 0.8;
        ctx.strokeStyle = "#1fbf86"; ctx.lineWidth = cell * 0.62;
        ctx.beginPath(); px.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.shadowBlur = 0;
        for (let i = 0; i < px.length - 1; i++) {
          ctx.strokeStyle = melange(i / Math.max(1, px.length - 2));
          ctx.lineWidth = cell * (0.62 - 0.14 * (i / px.length));
          ctx.beginPath(); ctx.moveTo(...px[i]); ctx.lineTo(...px[i + 1]); ctx.stroke();
        }
        // la tête, avec ses yeux tournés dans le sens de la marche
        const [hx, hy] = px[0], [dx, dy] = jeu.dir, [qx, qy] = [-dy, dx];
        ctx.shadowColor = "rgba(124,245,198,0.9)"; ctx.shadowBlur = cell * 0.6;
        ctx.fillStyle = "#9af7d3";
        ctx.beginPath(); ctx.arc(hx, hy, cell * 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#04140c";
        for (const s of [-1, 1]) {
          const ex = hx + dx * cell * 0.13 + qx * s * cell * 0.17, ey = hy + dy * cell * 0.13 + qy * s * cell * 0.17;
          if (jeu.etat === "fin") { // des yeux en croix
            ctx.strokeStyle = "#04140c"; ctx.lineWidth = Math.max(1.5, cell * 0.06); const k = cell * 0.07;
            ctx.beginPath(); ctx.moveTo(ex - k, ey - k); ctx.lineTo(ex + k, ey + k); ctx.moveTo(ex + k, ey - k); ctx.lineTo(ex - k, ey + k); ctx.stroke();
          } else { ctx.beginPath(); ctx.arc(ex, ey, cell * 0.075, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();
      }

      // les particules
      jeu.particules = jeu.particules.filter((p) => (p.vie -= 0.035) > 0);
      for (const p of jeu.particules) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.94; p.vy *= 0.94;
        ctx.globalAlpha = p.vie;
        ctx.fillStyle = p.rouge ? "#ff8a80" : "#7cf5c6";
        const s = Math.max(2, cell * 0.12);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;

      // flash au moment de perdre
      if (jeu.etat === "fin" && !reduit) {
        const f = Math.min(1, 1 - (now - jeu.mort) / 300);
        if (f > 0) { ctx.fillStyle = `rgba(229,83,75,${0.25 * f})`; ctx.fillRect(0, 0, L, H); }
      }
    }

    // Changement de direction (on refuse le demi-tour sur soi-même)
    jeu.tourner = (nom) => {
      if (jeu.etat === "titre") { nouvellePartie(); if (nom === "gauche") return; }
      if (jeu.etat === "fin") return;
      if (jeu.etat === "pause") { jeu.etat = "jeu"; afficherMessage(); }
      const d = DIRS[nom];
      const derniere = jeu.file[jeu.file.length - 1] || jeu.dir;
      if (d[0] === -derniere[0] && d[1] === -derniere[1]) return;
      if (d[0] === derniere[0] && d[1] === derniere[1]) return;
      if (jeu.file.length < 3) jeu.file.push(d);
    };
    jeu.pause = () => {
      if (jeu.etat === "titre") return nouvellePartie();
      if (jeu.etat === "fin") return;
      jeu.etat = jeu.etat === "pause" ? "jeu" : "pause";
      jeu.dernierTour = performance.now();
      afficherMessage();
    };
    jeu.rejouer = nouvellePartie;
    // Fin de l'animation d'approche (ou on la passe en appuyant sur une touche / en cliquant)
    jeu.finIntro = () => {
      if (!jeu || !jeu.intro) return;
      jeu.intro = false;
      clearTimeout(jeu.introTimer);
      scene.classList.add("crt-pret");
    };
    jeu.introTimer = setTimeout(jeu.finIntro, reduit ? 0 : 1900);
    scene.addEventListener("pointerdown", () => jeu && jeu.finIntro());

    // Tactile : glisser sur l'écran, ou les boutons du pad
    let depart = null;
    ecran.addEventListener("touchstart", (e) => { depart = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
    ecran.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    ecran.addEventListener("touchend", (e) => {
      if (!depart) return;
      const dx = e.changedTouches[0].clientX - depart[0], dy = e.changedTouches[0].clientY - depart[1];
      depart = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) { if (jeu.etat === "fin" || jeu.etat === "titre") nouvellePartie(); return; }
      jeu.tourner(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "droite" : "gauche") : (dy > 0 ? "bas" : "haut"));
    });
    ecran.addEventListener("click", () => { if (!tactile && (jeu.etat === "fin" || jeu.etat === "titre")) nouvellePartie(); });
    scene.querySelectorAll(".snake-pad button").forEach((b) => b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (b.dataset.dir) jeu.tourner(b.dataset.dir);
      else if (b.dataset.action === "pause") jeu.pause();
      else quitterSnake();
    }));

    initialiser();
    afficherHud();
    afficherMessage();
    jeu.raf = requestAnimationFrame(dessiner);
  }

  function quitterSnake(immediat = false) {
    if (!jeu) return;
    clearInterval(jeu.timer);
    clearTimeout(jeu.introTimer);
    cancelAnimationFrame(jeu.raf);
    if (jeu.score > jeu.record) { jeu.record = jeu.score; ecrireRecord(jeu.score); } // si on quitte en pleine partie
    const { el, score, record, flag } = jeu;
    jeu = null;
    // L'écran s'éteint, on recule, puis on retrouve le terminal
    if (immediat || reduit) el.remove();
    else { el.classList.add("crt-depart"); setTimeout(() => el.remove(), 750); }
    afficher([`${g("snake terminé ·")} score ${v(score)} ${g("·")} record ${v(record)}`]);
    if (flag) afficher([`🚩 10 points, bien joué ! Voici ton flag : ${v(atob("RkxBR3tzbjRrM19tNHN0M3J9"))}`, g("Valide-le avec ") + v("submit") + g(" suivi du flag.")]);
    afficher([""]);
    if (!fenetre.hidden) saisie.focus();
  }

  // Clavier pendant la partie : flèches, ZQSD (AZERTY) ou WASD (QWERTY), selon la position physique des touches
  const TOUCHES = {
    ArrowUp: "haut", ArrowDown: "bas", ArrowLeft: "gauche", ArrowRight: "droite",
    KeyW: "haut", KeyS: "bas", KeyA: "gauche", KeyD: "droite",
  };
  document.addEventListener("keydown", (e) => {
    if (!jeu || e.ctrlKey || e.metaKey || e.altKey) return;
    // la touche s'enfonce aussi sur le clavier dessiné
    const k = jeu.el.querySelector(`[data-k="${e.code}"]`);
    if (k) { k.classList.add("appuie"); setTimeout(() => k.classList.remove("appuie"), 140); }
    if (jeu.intro && e.key !== "Escape" && e.key !== "q") { jeu.finIntro(); if (!(TOUCHES[e.key] || TOUCHES[e.code])) { e.preventDefault(); return; } }
    const dir = TOUCHES[e.key] || TOUCHES[e.code];
    if (dir) jeu.tourner(dir);
    else if (e.key === " " || e.key === "p") jeu.pause();
    else if (e.key === "Enter" && (jeu.etat === "fin" || jeu.etat === "titre")) jeu.rejouer();
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
        g("🚩 Psst… 5 flags sont cachés sur ce site. Tape ") + c("ctf") + g("."),
        "",
      ]);
    }
    setTimeout(() => saisie.focus(), 30);
  }
  function fermer() {
    quitterSnake(true);
    fenetre.hidden = true;
    document.body.classList.remove("term-actif");
    btn.setAttribute("aria-expanded", "false");
    btn.focus({ preventScroll: true });
  }

  btn.addEventListener("click", () => (fenetre.hidden ? ouvrir() : fermer()));
  document.querySelectorAll("[data-term-ouvrir]").forEach((el) => el.addEventListener("click", (e) => {
    e.preventDefault();
    ouvrir();
    if (el.dataset.termCmd) executer(el.dataset.termCmd); // ex. le lien « Tape ctf » lance directement la commande
  }));
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

// Un message pour ceux qui ouvrent la console (chasse aux flags)
console.log(
  "%c>_ Salut le curieux !%c\nOuvrir la console, c'est déjà un réflexe de pentester 😉\nVoici ton flag : FLAG{c0ns0l3_d3v}\nValide-le dans le terminal du site avec : submit FLAG{...}",
  "color:#34d399;font:600 16px monospace",
  "color:inherit;font:13px monospace"
);
