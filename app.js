document.addEventListener("DOMContentLoaded", () => {
    const motionOK = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const watchReveals = initReveal(motionOK);
    if (motionOK && finePointer) {
        initCursorGlow();
        initCardSpotlights(document);
        initMagneticButtons();
    }

    // Configurações do Github API
    const GITHUB_USERNAME = "guilhermecarrico";
    const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`;
    const reposContainer = document.getElementById("github-repos");

    // Função para buscar os repositórios
    async function fetchRepos() {
        try {
            const response = await fetch(GITHUB_API_URL);
            if (!response.ok) throw new Error("Erro ao buscar repositórios.");

            const repos = await response.json();

            // Limpa o placeholder de carregamento
            reposContainer.innerHTML = "";

            // Filtra o próprio repositório do site se quiser esconder
            const filteredRepos = repos.filter(repo => repo.name !== "guilhermecarrico.github.io" && !repo.fork);

            filteredRepos.forEach((repo, index) => {
                const card = document.createElement("a");
                card.href = repo.html_url;
                card.target = "_blank";
                card.rel = "noopener noreferrer";
                card.className = "card glass repo-card reveal";
                card.style.setProperty("--i", String(index + 1));

                // Trata descrição vazia
                const description = repo.description || "Nenhuma descrição fornecida pelo autor.";

                // Pega a linguagem principal
                const language = repo.language || "Markdown";
                const updatedLabel = formatUpdatedAt(repo.pushed_at || repo.updated_at);

                card.innerHTML = `
                    <div class="card-beam" aria-hidden="true"></div>
                    <div class="card-header">
                        <h3><i data-lucide="folder-git-2"></i> ${escapeHtml(repo.name)}</h3>
                        <span class="repo-arrow" aria-hidden="true"><i data-lucide="arrow-up-right"></i></span>
                    </div>
                    <p>${escapeHtml(description)}</p>
                    <div class="repo-footer">
                        <div class="tags">
                            <span><span class="lang-dot" aria-hidden="true"></span>${escapeHtml(language)}</span>
                        </div>
                        <div class="repo-stats">
                            <span title="Stars"><i data-lucide="star"></i> ${repo.stargazers_count}</span>
                            <span title="Forks"><i data-lucide="git-fork"></i> ${repo.forks_count}</span>
                            ${updatedLabel ? `<span title="Último push">${escapeHtml(updatedLabel)}</span>` : ""}
                        </div>
                    </div>
                `;

                reposContainer.appendChild(card);
            });

            // Reinicializa os ícones novos que acabaram de ser injetados
            lucide.createIcons();
            watchReveals(reposContainer);
            if (motionOK && finePointer) initCardSpotlights(reposContainer);

        } catch (error) {
            console.error(error);
            reposContainer.innerHTML = `
                <div class="repos-error">
                    Não foi possível carregar os repositórios do Github no momento. <br>
                    <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" rel="noopener noreferrer">Acessar Github diretamente</a>
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
