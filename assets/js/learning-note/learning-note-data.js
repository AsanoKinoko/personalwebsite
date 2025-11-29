((global) => {
    const cache = {
        data: null,
        dataPromise: null,
        template: null,
        templatePromise: null,
    };

    const FALLBACK_IMAGE = 'https://placehold.co/200x140?text=Learning+Note';

    const computeBaseUrl = () => {
        const pathSegments = window.location.pathname.split('/');
        const repoName = pathSegments[1];
        const isLocal = window.location.hostname === '127.0.0.1'
            || window.location.hostname === 'localhost';
        return isLocal ? '' : `/${repoName}`;
    };

    const fetchJson = async () => {
        if (cache.data) {
            return cache.data;
        }
        if (cache.dataPromise) {
            return cache.dataPromise;
        }
        const baseUrl = computeBaseUrl();
        cache.dataPromise = fetch(`${baseUrl}/data/learning_notes/learning_notes_data.json`, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load learning_notes_data.json (${response.status})`);
                }
                return response.json();
            })
            .then((json) => {
                cache.data = json;
                cache.dataPromise = null;
                return json;
            })
            .catch((error) => {
                cache.dataPromise = null;
                console.error('LearningNoteData: unable to fetch data', error);
                throw error;
            });
        return cache.dataPromise;
    };

    const loadTemplate = async () => {
        if (cache.template) {
            return cache.template;
        }
        if (cache.templatePromise) {
            return cache.templatePromise;
        }
        const baseUrl = computeBaseUrl();
        cache.templatePromise = fetch(`${baseUrl}/components/ui/learningnotecard/LearningNoteCard.html`, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load LearningNoteCard template (${response.status})`);
                }
                return response.text();
            })
            .then((markup) => {
                const container = document.createElement('template');
                container.innerHTML = markup.trim();

                const innerTemplate = container.content.querySelector('template');
                cache.template = innerTemplate ? innerTemplate : container;

                cache.templatePromise = null;
                return cache.template;
            })
            .catch((error) => {
                cache.templatePromise = null;
                console.error('LearningNoteData: unable to load card template', error);
                throw error;
            });
        return cache.templatePromise;
    };

    const ensureArray = (value) => (Array.isArray(value) ? value : []);

    const normalizeUrl = (url) => {
        if (!url || url === '#') return url;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        
        const baseUrl = computeBaseUrl();
        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
        return baseUrl ? `${baseUrl}/${cleanUrl}` : `/${cleanUrl}`;
    };

    const createCardFragment = (template, { note, link }) => {
        const fragment = template.content.cloneNode(true);
        const card = fragment.querySelector('.learning-note-card');
        const imageEl = fragment.querySelector('[data-role="image"]');
        const titleEl = fragment.querySelector('[data-role="title"]');

        const href = normalizeUrl((note?.url && note.url.trim()) ? note.url : (link || '#'));
        const imgSrc = normalizeUrl(note?.image || FALLBACK_IMAGE);
        const title = note?.title || 'Untitled';

        if (card) card.href = href;
        if (imageEl) {
            imageEl.src = imgSrc;
            imageEl.alt = title;
            imageEl.loading = 'lazy';
        }
        if (titleEl) {
            titleEl.textContent = title;
        }

        return fragment;
    };

    global.LearningNoteData = {
        getData: fetchJson,
        getNotes: async () => {
            const data = await fetchJson();
            return ensureArray(data.notes);
        },
        getCardTemplate: loadTemplate,
        computeBaseUrl,
        ensureArray,
        createCardFragment,
        FALLBACK_IMAGE,
    };
})(window);