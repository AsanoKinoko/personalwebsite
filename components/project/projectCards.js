(() => {
    const DATA_ENDPOINT = '/data/projects_data.json';
    let cachedProjects = null;

    const baseUrl = () => {
        const { hostname, pathname } = window.location;
        if (hostname === '127.0.0.1' || hostname === 'localhost') {
            return '';
        }

        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) {
            return '';
        }

        return `/${segments[0]}`;
    };

    const fetchProjects = async () => {
        if (cachedProjects) return cachedProjects;

        try {
            const response = await fetch(`${baseUrl()}${DATA_ENDPOINT}`);
            if (!response.ok) {
                throw new Error(`Failed to load projects (${response.status})`);
            }

            const data = await response.json();
            cachedProjects = Array.isArray(data) ? data : [];
        } catch (error) {
            console.error('ProjectCards: unable to load project data', error);
            cachedProjects = [];
        }

        return cachedProjects;
    };

    const parseTemplate = (html) => {
        const tpl = document.createElement('template');
        tpl.innerHTML = html.trim();
        return tpl.content.firstElementChild;
    };

    const fillCard = (card, project) => {
        const imageEl = card.querySelector('.project-image img');
        const [demoLink, codeLink] = card.querySelectorAll('.project-link');
        const titleEl = card.querySelector('.project-info h3');
        const descEl = card.querySelector('.project-info p');
        const techContainer = card.querySelector('.project-tech');

        if (imageEl) {
            imageEl.src = project.image;
            imageEl.alt = project.title || 'Project preview';
        }

        if (demoLink) {
            demoLink.href = project.demoUrl || '#';
            demoLink.target = project.demoUrl ? '_blank' : '_self';
            demoLink.rel = project.demoUrl ? 'noreferrer noopener' : '';
        }

        if (codeLink) {
            codeLink.href = project.codeUrl || '#';
            codeLink.target = project.codeUrl ? '_blank' : '_self';
            codeLink.rel = project.codeUrl ? 'noreferrer noopener' : '';
        }

        if (titleEl) {
            titleEl.textContent = project.title || 'Untitled Project';
        }

        if (descEl) {
            descEl.textContent = project.description || '';
        }

        if (techContainer) {
            techContainer.innerHTML = '';
            (project.tech || []).forEach((tag) => {
                const span = document.createElement('span');
                span.className = 'tech-tag';
                span.textContent = tag;
                techContainer.appendChild(span);
            });
        }

        return card;
    };

    const render = async (templateHTML) => {
        const grid = document.querySelector('[data-project-grid]');
        if (!grid || !templateHTML) return;

        const template = parseTemplate(templateHTML);
        if (!template) return;

        const projects = await fetchProjects();
        if (!projects.length) {
            grid.innerHTML = '<p class="project-empty">Projects coming soon.</p>';
            return;
        }

        const fragment = document.createDocumentFragment();

        projects.forEach((project) => {
            const card = fillCard(template.cloneNode(true), project);
            fragment.appendChild(card);
        });

        grid.appendChild(fragment);
    };

    window.ProjectCards = {
        render,
    };
})();