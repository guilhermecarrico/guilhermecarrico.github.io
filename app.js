document.addEventListener("DOMContentLoaded", () => {
    const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const watchReveals = initReveal(motionOK);
    initEmailLinks();
    initActiveNav();
    if (motionOK && finePointer) {
        initCursorGlow();
        initCardSpotlights(document);
        initMagneticButtons();
    }

    // Configurações da API do GitHub
    const GITHUB_USERNAME = "guilhermecarrico";
    const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=30`;
    const reposContainer = document.getElementById("github-repos");
    // O site e a Oledsmith já têm lugar próprio. `main` é o repositório de estudos
    // com a legenda antiga em inglês; volta à lista assim que for renomeado.
    const HIDDEN_REPOS = new Set(["guilhermecarrico.github.io", "oledsmith-site", "main"]);

    async function fetchRepos() {
        try {
            const response = await fetch(GITHUB_API_URL, {
                headers: { Accept: "application/vnd.github+json" },
            });
            if (!response.ok) throw new Error("Erro ao buscar repositórios.");

            const repos = await response.json();
            if (!Array.isArray(repos)) throw new Error("Resposta inesperada da API.");

            const filteredRepos = repos.filter((repo) => repo && !repo.fork && !HIDDEN_REPOS.has(repo.name));
            reposContainer.innerHTML = "";

            if (!filteredRepos.length) {
                reposContainer.innerHTML = `
                    <p class="repos-empty">
                        Quando um repositório público novo for publicado, ele aparece nesta lista.
                        <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">Abrir o GitHub</a>
                    </p>
                `;
                return;
            }

            filteredRepos.forEach((repo, index) => {
                const card = document.createElement("a");
                card.href = repo.html_url;
                card.target = "_blank";
                card.rel = "noopener noreferrer";
                card.className = "card glass repo-card reveal";
                card.style.setProperty("--i", String(index + 1));

                const description = repo.description?.trim() || "Sem descrição no GitHub.";
                const updatedLabel = formatUpdatedAt(repo.pushed_at || repo.updated_at);
                const topicTags = (repo.topics || [])
                    .slice(0, 3)
                    .map((topic) => `<span>${escapeHtml(topic)}</span>`)
                    .join("");
                const languageTag = repo.language
                    ? `<span><span class="lang-dot" aria-hidden="true"></span>${escapeHtml(repo.language)}</span>`
                    : "";
                const siteHost = publicSiteHost(repo.homepage);

                card.innerHTML = `
                    <div class="card-beam" aria-hidden="true"></div>
                    <div class="card-header">
                        <h3><i data-lucide="folder-git-2"></i> ${escapeHtml(repo.name)}</h3>
                        <span class="repo-arrow" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span>
                    </div>
                    <p>${escapeHtml(description)}</p>
                    <div class="repo-footer">
                        <div class="tags">
                            ${languageTag}
                            ${topicTags}
                        </div>
                        <div class="repo-stats">
                            <span title="Estrelas"><i data-lucide="star"></i> ${repo.stargazers_count}</span>
                            <span title="Cópias"><i data-lucide="git-fork"></i> ${repo.forks_count}</span>
                            ${siteHost ? `<span title="Site"><i data-lucide="globe"></i> ${escapeHtml(siteHost)}</span>` : ""}
                            ${updatedLabel ? `<span title="Última atualização">${escapeHtml(updatedLabel)}</span>` : ""}
                        </div>
                    </div>
                `;

                reposContainer.appendChild(card);
            });

            lucide.createIcons();
            watchReveals(reposContainer);
            if (motionOK && finePointer) initCardSpotlights(reposContainer);

        } catch (error) {
            console.error(error);
            reposContainer.innerHTML = `
                <div class="repos-error">
                    Não foi possível carregar os repositórios do GitHub no momento. <br>
                    <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">Acessar o GitHub</a>
                </div>
            `;
        }
    }

    // Chama a função
    fetchRepos();
});

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function publicSiteHost(homepage) {
    const raw = typeof homepage === "string" ? homepage.trim() : "";
    if (!raw) return "";
    try {
        const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        if (url.hostname === "github.com" || url.hostname.endsWith("github.io")) return "";
        return url.hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

function formatUpdatedAt(isoDate) {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
}

function initReveal(motionOK) {
    if (!motionOK || !("IntersectionObserver" in window)) {
        const showAll = (root) => {
            (root || document).querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
        };
        showAll(document);
        return showAll;
    }

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
        });
    }, { threshold: 0.18, rootMargin: "0px 0px -36px 0px" });

    const nearViewport = (el) => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0);
        return visible >= Math.min(88, rect.height * 0.55);
    };

    const watch = (root) => {
        (root || document).querySelectorAll(".reveal:not(.is-visible)").forEach((el) => {
            if (nearViewport(el)) el.classList.add("is-visible");
            else io.observe(el);
        });
    };

    watch(document);
    return watch;
}

function initCursorGlow() {
    const root = document.documentElement;
    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight * 0.16;

    window.addEventListener("pointermove", (event) => {
        x = event.clientX;
        y = event.clientY;
        if (raf) return;
        raf = requestAnimationFrame(() => {
            root.style.setProperty("--cx", `${x}px`);
            root.style.setProperty("--cy", `${y}px`);
            raf = 0;
        });
    }, { passive: true });
}

function initCardSpotlights(root) {
    root.querySelectorAll(".card").forEach((card) => {
        if (card.dataset.spotlight === "on") return;
        card.dataset.spotlight = "on";
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const px = event.clientX - rect.left;
            const py = event.clientY - rect.top;
            card.style.setProperty("--mx", `${px}px`);
            card.style.setProperty("--my", `${py}px`);

            const nx = (px / rect.width) - 0.5;
            const ny = (py / rect.height) - 0.5;
            card.style.setProperty("--rx", `${(-ny * 3.2).toFixed(2)}deg`);
            card.style.setProperty("--ry", `${(nx * 3.8).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--rx", "0deg");
            card.style.setProperty("--ry", "0deg");
        });
    });
}

function initMagneticButtons() {
    document.querySelectorAll(".magnetic").forEach((btn) => {
        btn.addEventListener("pointermove", (event) => {
            const rect = btn.getBoundingClientRect();
            const dx = (event.clientX - (rect.left + rect.width / 2)) * 0.16;
            const dy = (event.clientY - (rect.top + rect.height / 2)) * 0.22;
            btn.style.setProperty("--tx", `${dx.toFixed(1)}px`);
            btn.style.setProperty("--ty", `${dy.toFixed(1)}px`);
        });
        btn.addEventListener("pointerleave", () => {
            btn.style.setProperty("--tx", "0px");
            btn.style.setProperty("--ty", "0px");
        });
    });
}

// Many desktops have no mail handler registered, so a mailto: click can silently do nothing.
function initEmailLinks() {
    let toast;
    let timer = 0;

    const showToast = (email, copied) => {
        if (!toast) {
            toast = document.createElement("div");
            toast.className = "toast";
            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");
            document.body.appendChild(toast);
        }
        toast.innerHTML = `
            <i data-lucide="${copied ? "check" : "mail"}"></i>
            <span>${copied ? "E-mail copiado" : "E-mail"}</span>
            <span class="toast-email">${escapeHtml(email)}</span>
        `;
        if (window.lucide) lucide.createIcons();
        requestAnimationFrame(() => toast.classList.add("is-visible"));
        clearTimeout(timer);
        timer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
    };

    document.querySelectorAll("a[data-email]").forEach((link) => {
        link.addEventListener("click", () => {
            const email = link.getAttribute("data-email");
            if (!email) return;
            if (!navigator.clipboard?.writeText) {
                showToast(email, false);
                return;
            }
            navigator.clipboard.writeText(email)
                .then(() => showToast(email, true))
                .catch(() => showToast(email, false));
        });
    });
}

function initActiveNav() {
    const links = [...document.querySelectorAll(".top-nav-link[href^='#']")];
    const sections = links
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);
    if (!sections.length || !("IntersectionObserver" in window)) return;

    const setActive = (id) => {
        links.forEach((link) => {
            const on = link.getAttribute("href") === `#${id}`;
            link.classList.toggle("is-active", on);
            if (on) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
        });
    };

    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) setActive(entry.target.id);
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    sections.forEach((section) => io.observe(section));

    window.addEventListener("scroll", () => {
        if (window.scrollY < window.innerHeight * 0.35) setActive("");
    }, { passive: true });
}
