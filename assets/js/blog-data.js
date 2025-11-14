((global) => {
    const cache = {
        data: null,
        dataPromise: null,
        template: null,
        templatePromise: null,
    };

    const FALLBACK_IMAGE = 'https://placehold.co/600x360?text=Blog';

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
        cache.dataPromise = fetch(`${baseUrl}/data/blogs/blogs_data.json`, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load blogs_data.json (${response.status})`);
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
                console.error('BlogData: unable to fetch data', error);
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
        cache.templatePromise = fetch(`${baseUrl}/components/ui/blogcard/BlogCard.html`, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to load BlogCard template (${response.status})`);
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
                console.error('BlogData: unable to load card template', error);
                throw error;
            });
        return cache.templatePromise;
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        if (Number.isNaN(date.getTime())) return '';

        const locale = 'vi-VN';
        const time = date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const day = date.toLocaleDateString(locale, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
        return `${time} · ${day}`;
    };

    const ensureArray = (value) => (Array.isArray(value) ? value : []);

    const buildBlogLink = (mainTagId, subtagId, postSlug) => {
        const params = new URLSearchParams();
        if (mainTagId) params.set('tag', mainTagId);
        if (subtagId && subtagId !== 'all') params.set('subtag', subtagId);
        if (postSlug) params.set('post', postSlug);
        const query = params.toString();
        return query ? `Blog.html?${query}` : 'Blog.html';
    };

    const createCardFragment = (template, { post, mainTag, subtag, link }) => {
        const fragment = template.content.cloneNode(true);
        const mediaLink = fragment.querySelector('[data-role="media-link"]');
        const imageEl = fragment.querySelector('[data-role="image"]');
        const tagEl = fragment.querySelector('[data-role="tag"]');
        const timeEl = fragment.querySelector('[data-role="time"]');
        const titleLink = fragment.querySelector('[data-role="title-link"]');
        const excerptEl = fragment.querySelector('[data-role="excerpt"]');
        const ctaEl = fragment.querySelector('[data-role="cta"]');

        const href = (post?.url && post.url.trim()) ? post.url : (link || '#');
        const imgSrc = post.image || FALLBACK_IMAGE;
        const title = post.title || 'Untitled';
        const tagLabel = subtag?.label || mainTag?.label || 'Blog';
        const formattedDate = formatDateTime(post.createdAt);

        if (mediaLink) mediaLink.href = href;
        if (imageEl) {
            imageEl.src = imgSrc;
            imageEl.alt = title;
            imageEl.loading = 'lazy';
        }
        if (tagEl) tagEl.textContent = tagLabel;
        if (timeEl) {
            timeEl.textContent = formattedDate;
            if (post.createdAt) {
                timeEl.setAttribute('datetime', post.createdAt);
            }
        }
        if (titleLink) {
            titleLink.href = href;
            titleLink.textContent = title;
        }
        if (excerptEl) {
            excerptEl.textContent = post.description || '';
        }
        if (ctaEl) {
            ctaEl.href = href;
        }

        return fragment;
    };

    global.BlogData = {
        getData: fetchJson,
        getMainTags: async () => {
            const data = await fetchJson();
            return ensureArray(data.mainTags);
        },
        getCardTemplate: loadTemplate,
        formatDateTime,
        computeBaseUrl,
        ensureArray,
        buildBlogLink,
        createCardFragment,
    };
})(window);