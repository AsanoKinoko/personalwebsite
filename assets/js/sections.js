class SectionsLoader {
    static baseUrl() {
        const pathSegments = window.location.pathname.split('/');
        const repoName = pathSegments[1];
        return (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
            ? ''
            : `/${repoName}`;
    }

    static async loadSection(path) {
        const response = await fetch(`${this.baseUrl()}${path}`);
        return await response.text();
    }

    static async init() {
        try {
            const homeSection = document.querySelector('.home');
            if (!homeSection) return;

            const [languageHTML, projectHTML, blogHTML, contactHTML, productCardHTML] = await Promise.all([
                this.loadSection('/components/language_section/language.html'),
                this.loadSection('/components/project_section/project.html'),
                this.loadSection('/components/blog_section/BlogSection.html'),
                this.loadSection('/components/contact_section/contact.html'),
                this.loadSection('/components/ui/projectcard/ProjectCard.html'),
            ]);

            homeSection.insertAdjacentHTML('afterend', languageHTML + projectHTML + blogHTML + contactHTML);

            await renderHomeBlogSection();

            if (window.ProjectCards) {
                await window.ProjectCards.render(productCardHTML);
            }

            // Simple contact handler
            const form = document.getElementById('contactForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    alert('Thanks! Your message has been sent.');
                    form.reset();
                });
            }

            // Notify header that sections are now in DOM
            document.dispatchEvent(new CustomEvent('sectionsLoaded'));

            // Handle deep link to contact after inject
            if (window.location.hash === '#contact') {
                const contact = document.getElementById('contact');
                contact && contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Hook up Let's Talk button smooth scroll
            const talkBtn = document.getElementById('btn-talk');
            if (talkBtn) {
                talkBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const contact = document.getElementById('contact');
                    contact && contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    history.replaceState(null, '', '#contact');
                });
            }
        } catch (err) {
            console.error('Failed to load sections:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    SectionsLoader.init();
});

const BLOG_PREVIEW_CARD_COUNT = 3;

async function renderHomeBlogSection() {
    const section = document.getElementById('blog');
    if (!section || !window.BlogData) return;

    const tagsContainer = section.querySelector('[data-blog-main-tags]');
    const grid = section.querySelector('[data-blog-home-grid]');

    if (!tagsContainer || !grid) return;

    tagsContainer.innerHTML = '';
    grid.innerHTML = '';

    try {
        const [data, template] = await Promise.all([
            window.BlogData.getData(),
            window.BlogData.getCardTemplate(),
        ]);

        const mainTags = window.BlogData.ensureArray(data?.mainTags);

        if (!mainTags.length) {
            grid.innerHTML = '<p class="blog__empty">Blog posts are brewing. Please check back soon!</p>';
            return;
        }

        const fragmentTags = document.createDocumentFragment();
        mainTags.forEach((tag, index) => {
            const anchor = document.createElement('a');
            anchor.className = `blog__tag${index === 0 ? ' is-active' : ''}`;
            anchor.href = `Blog.html?tag=${encodeURIComponent(tag.id)}`;
            anchor.textContent = tag.label || tag.id;
            fragmentTags.appendChild(anchor);
        });
        tagsContainer.appendChild(fragmentTags);

        const posts = [];
        mainTags.forEach((mainTag) => {
            window.BlogData.ensureArray(mainTag.subtags).forEach((subtag) => {
                window.BlogData.ensureArray(subtag.posts).forEach((post) => {
                    posts.push({ post, mainTag, subtag });
                });
            });
        });

        if (!posts.length) {
            grid.innerHTML = '<p class="blog__empty">Blog posts are brewing. Please check back soon!</p>';
            return;
        }

        posts.sort((a, b) => {
            const aDate = new Date(a.post.createdAt || 0).getTime();
            const bDate = new Date(b.post.createdAt || 0).getTime();
            return bDate - aDate;
        });

        const preview = posts.slice(0, BLOG_PREVIEW_CARD_COUNT);
        const cardsFragment = document.createDocumentFragment();

        preview.forEach((entry) => {
            const cardFragment = window.BlogData.createCardFragment(template, {
                ...entry,
                link: window.BlogData.buildBlogLink(
                    entry.mainTag.id,
                    entry.subtag.id,
                    entry.post.slug || entry.post.id,
                ),
            });
            cardsFragment.appendChild(cardFragment);
        });

        grid.appendChild(cardsFragment);
    } catch (error) {
        console.error('Blog preview failed to render', error);
        grid.innerHTML = '<p class="blog__empty">Unable to fetch blog posts at the moment.</p>';
    }
}