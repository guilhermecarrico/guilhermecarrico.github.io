document.addEventListener("DOMContentLoaded", () => {
    
    // Configurações do Github API
    const GITHUB_USERNAME = 'guilhermecarrico';
    const GITHUB_API_URL = `https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=6`;
    const reposContainer = document.getElementById('github-repos');

    // Função para buscar os repositórios
    async function fetchRepos() {
        try {
            const response = await fetch(GITHUB_API_URL);
            if (!response.ok) throw new Error("Erro ao buscar repositórios.");
            
            const repos = await response.json();
            
            // Limpa o placeholder de carregamento
            reposContainer.innerHTML = '';

            // Filtra o próprio repositório do site se quiser esconder
            const filteredRepos = repos.filter(repo => repo.name !== 'guilhermecarrico.github.io' && !repo.fork);

            filteredRepos.forEach(repo => {
                const card = document.createElement('a');
                card.href = repo.html_url;
                card.target = '_blank';
                card.className = 'card glass repo-card';
                
                // Trata descrição vazia
                const description = repo.description || "Nenhuma descrição fornecida pelo autor.";
                
                // Pega a linguagem principal
                const language = repo.language || "Markdown";

                card.innerHTML = `
                    <div class="card-header">
                        <h3><i data-lucide="folder-git-2"></i> ${repo.name}</h3>
                    </div>
                    <p>${description}</p>
                    <div class="repo-stats">
                        <span title="Stars"><i data-lucide="star"></i> ${repo.stargazers_count}</span>
                        <span title="Forks"><i data-lucide="git-fork"></i> ${repo.forks_count}</span>
                    </div>
                    <div class="tags">
                        <span>${language}</span>
                    </div>
                `;
                
                reposContainer.appendChild(card);
            });

            // Reinicializa os ícones novos que acabaram de ser injetados
            lucide.createIcons();

        } catch (error) {
            console.error(error);
            reposContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem; border: 1px dashed var(--border-color); border-radius: 8px;">
                    Não foi possível carregar os repositórios do Github no momento. <br>
                    <a href="https://github.com/${GITHUB_USERNAME}" target="_blank" style="color: var(--accent); margin-top: 1rem; display: inline-block;">Acessar Github diretamente</a>
                </div>
            `;
        }
    }

    // Chama a função
    fetchRepos();
});
