(() => {
    const POSTS_PER_PAGE = 6;
    const RESIZE_DEBOUNCE = 120;

    const elements = {
        sidebar: document.querySelector('[data-blog-sidebar]'),
        subtagContainer: document.querySelector('[data-subtag-container]'),
        moreWrapper: document.querySelector('[data-more-wrapper]'),
        moreButton: document.querySelector('[data-more-button]'),
        moreMenu: document.querySelector('[data-more-menu]'),
        feed: document.querySelector('[data-blog-feed]'),
        pagination: document.querySelector('[data-blog-pagination]'),
        backButton: document.querySelector('.breadcrumb-back'),
    };

    const state = {
        data: null,
        template: null,
        mainTagId: null,
        subtagId: 'all',
        page: 1,
    };

    const ensure = (value) => (window.BlogData ? window.BlogData.ensureArray(value) : Array.isArray(value) ? value : []);

    const debounce = (fn, wait) => {
        let timeout = null;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(null, args), wait);
        };
    };

    const init = async () => {
        if (!window.BlogData || !elements.sidebar || !elements.feed) return;

        try {
            const [data, template] = await Promise.all([
                window.BlogData.getData(),
                window.BlogData.getCardTemplate(),
            ]);
            state.data = data;
            state.template = template;

            if (!ensure(data.mainTags).length) {
                renderEmptyState();
                setupBackButton();
                return;
            }

            syncStateFromUrl();
            renderAll();
            setupEvents();
        } catch (error) {
            console.error('Blog page failed to initialise', error);
            renderErrorState();
        }
    };

    const setupEvents = () => {
        if (elements.moreButton) {
            elements.moreButton.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleMoreMenu();
            });
        }

        document.addEventListener('click', (event) => {
            if (!elements.moreWrapper) return;
            if (!elements.moreWrapper.contains(event.target)) {
                toggleMoreMenu(false);
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                toggleMoreMenu(false);
            }
        });

        window.addEventListener('resize', debounce(layoutSubtagOverflow, RESIZE_DEBOUNCE));
        setupBackButton();
        window.addEventListener('popstate', handlePopState);
    };

    const setupBackButton = () => {
        if (!elements.backButton) return;
        elements.backButton.addEventListener('click', (event) => {
            event.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'index.html';
            }
        });
    };

    const handlePopState = () => {
        syncStateFromUrl();
        renderAll();
    };

    const syncStateFromUrl = () => {
        const mainTags = getMainTags();
        const params = new URLSearchParams(window.location.search);

        const requestedMain = params.get('tag');
        const hasMain = mainTags.some((tag) => tag.id === requestedMain);
        state.mainTagId = hasMain ? requestedMain : (mainTags[0]?.id ?? null);

        const subtags = getSubtags(state.mainTagId);
        const requestedSubtag = params.get('subtag');
        const hasSubtag = subtags.some((tag) => tag.id === requestedSubtag);
        state.subtagId = hasSubtag ? requestedSubtag : 'all';

        const requestedPage = parseInt(params.get('page'), 10);
        state.page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    };

    const renderAll = () => {
        renderSidebar();
        renderBreadcrumb();

        const posts = getPosts(state.mainTagId, state.subtagId);
        const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));

        if (state.page > totalPages) {
            state.page = totalPages;
        }

        renderFeed(posts);
        renderPagination(totalPages);
        layoutSubtagOverflow();
        updateUrl();
    };

    const renderSidebar = () => {
        const nav = elements.sidebar;
        if (!nav) return;
        nav.innerHTML = '';

        const fragment = document.createDocumentFragment();
        getMainTags().forEach((tag) => {
            const anchor = document.createElement('a');
            anchor.className = `blog-sidebar__link${tag.id === state.mainTagId ? ' is-active' : ''}`;
            anchor.href = buildPageHref(tag.id, 'all', 1);
            anchor.textContent = tag.label || tag.id;
            anchor.addEventListener('click', (event) => {
                event.preventDefault();
                if (tag.id === state.mainTagId) return;
                state.mainTagId = tag.id;
                state.subtagId = 'all';
                state.page = 1;
                renderAll();
            });
            fragment.appendChild(anchor);
        });

        nav.appendChild(fragment);
    };

    const renderBreadcrumb = () => {
        const container = elements.subtagContainer;
        const moreWrapper = elements.moreWrapper;
        if (!container || !moreWrapper) return;

        Array.from(container.querySelectorAll('.breadcrumb-subtag'))
            .forEach((button) => {
                if (button.parentElement === container) {
                    button.remove();
                }
            });

        const fragment = document.createDocumentFragment();
        getSubtags(state.mainTagId).forEach((subtag) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `breadcrumb-subtag${subtag.id === state.subtagId ? ' is-active' : ''}`;
            button.dataset.subtagId = subtag.id;
            button.textContent = subtag.label;
            button.addEventListener('click', () => handleSubtagChange(subtag.id));
            fragment.appendChild(button);
        });

        container.insertBefore(fragment, moreWrapper);
    };

    const handleSubtagChange = (subtagId) => {
        if (state.subtagId === subtagId) return;
        state.subtagId = subtagId;
        state.page = 1;
        renderAll();
    };

    const getMainTags = () => ensure(state.data?.mainTags);

    const getCurrentMainTag = () => getMainTags().find((tag) => tag.id === state.mainTagId) || null;

    const getSubtags = (mainTagId) => {
        const mainTag = getMainTags().find((tag) => tag.id === mainTagId);
        const items = ensure(mainTag?.subtags).map((subtag) => ({
            id: subtag.id,
            label: subtag.label,
        }));
        return [{ id: 'all', label: 'All' }, ...items];
    };

    const getPosts = (mainTagId, subtagId) => {
        const mainTag = getMainTags().find((tag) => tag.id === mainTagId);
        if (!mainTag) return [];

        const subtags = ensure(mainTag.subtags);
        const targetSubtags = subtagId === 'all'
            ? subtags
            : subtags.filter((subtag) => subtag.id === subtagId);

        const posts = [];
        targetSubtags.forEach((subtag) => {
            ensure(subtag.posts).forEach((post) => {
                posts.push({ post, mainTag, subtag });
            });
        });

        posts.sort((a, b) => {
            const aDate = new Date(a.post.createdAt || 0).getTime();
            const bDate = new Date(b.post.createdAt || 0).getTime();
            return bDate - aDate;
        });

        return posts;
    };

    const renderFeed = (posts) => {
        const feed = elements.feed;
        feed.innerHTML = '';

        if (!posts.length) {
            feed.innerHTML = '<p class="blog-feed__empty">I am still writing stories for this tag. Please check back later!</p>';
            return;
        }

        const start = (state.page - 1) * POSTS_PER_PAGE;
        const pagePosts = posts.slice(start, start + POSTS_PER_PAGE);
        const fragment = document.createDocumentFragment();

        pagePosts.forEach((entry) => {
            const card = window.BlogData.createCardFragment(state.template, {
                ...entry,
                link: window.BlogData.buildBlogLink(
                    state.mainTagId,
                    entry.subtag.id,
                    entry.post.slug || entry.post.id,
                ),
            });
            fragment.appendChild(card);
        });

        feed.appendChild(fragment);
    };

    const renderPagination = (totalPages) => {
        const nav = elements.pagination;
        if (!nav) return;
        nav.innerHTML = '';

        if (totalPages <= 1) {
            nav.classList.add('is-hidden');
            return;
        }
        nav.classList.remove('is-hidden');

        const createButton = (label, page, options = {}) => {
            const anchor = document.createElement('a');
            anchor.className = 'pagination-btn';
            anchor.href = buildPageHref(state.mainTagId, state.subtagId, page);
            anchor.innerHTML = options.icon ? `<i class='bx ${options.icon}'></i>` : label;

            if (options.disabled) {
                anchor.classList.add('is-disabled');
                anchor.setAttribute('aria-disabled', 'true');
                anchor.tabIndex = -1;
            } else {
                anchor.addEventListener('click', (event) => {
                    event.preventDefault();
                    changePage(page);
                });
            }

            if (options.active) {
                anchor.classList.add('is-active');
                anchor.setAttribute('aria-current', 'page');
            }

            if (options.ariaLabel) {
                anchor.setAttribute('aria-label', options.ariaLabel);
            }

            return anchor;
        };

        const appendEllipsis = () => {
            const span = document.createElement('span');
            span.className = 'pagination-ellipsis';
            span.textContent = '...';
            nav.appendChild(span);
        };

        nav.appendChild(createButton('Prev', Math.max(1, state.page - 1), {
            disabled: state.page === 1,
            icon: 'bx-chevron-left',
            ariaLabel: 'Previous page',
        }));

        const pageList = buildPageList(totalPages, state.page);
        pageList.forEach((entry, idx) => {
            if (entry === 'ellipsis') {
                appendEllipsis();
                return;
            }
            const pageNumber = entry;
            nav.appendChild(createButton(String(pageNumber), pageNumber, {
                active: pageNumber === state.page,
            }));
        });

        nav.appendChild(createButton('Next', Math.min(totalPages, state.page + 1), {
            disabled: state.page === totalPages,
            icon: 'bx-chevron-right',
            ariaLabel: 'Next page',
        }));
    };

    const buildPageList = (totalPages, currentPage) => {
        const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
        const list = Array.from(pages)
            .filter((page) => page >= 1 && page <= totalPages)
            .sort((a, b) => a - b);

        const output = [];
        list.forEach((page, index) => {
            if (index > 0 && page - list[index - 1] > 1) {
                output.push('ellipsis');
            }
            output.push(page);
        });
        return output;
    };

    const changePage = (page) => {
        if (page === state.page) return;
        state.page = page;
        renderAll();
    };

    const buildPageHref = (mainTagId, subtagId, page) => {
        const params = new URLSearchParams();
        if (mainTagId) params.set('tag', mainTagId);
        if (subtagId && subtagId !== 'all') params.set('subtag', subtagId);
        if (page > 1) params.set('page', page);
        const query = params.toString();
        return query ? `Blog.html?${query}` : 'Blog.html';
    };

    const updateUrl = () => {
        const params = new URLSearchParams();
        if (state.mainTagId) params.set('tag', state.mainTagId);
        if (state.subtagId && state.subtagId !== 'all') params.set('subtag', state.subtagId);
        if (state.page > 1) params.set('page', state.page);
        const query = params.toString();
        const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    };

    const layoutSubtagOverflow = () => {
        const container = elements.subtagContainer;
        const moreWrapper = elements.moreWrapper;
        const moreMenu = elements.moreMenu;
        if (!container || !moreWrapper || !moreMenu) return;

        const baseButtons = Array.from(container.children)
            .filter((child) => child.classList?.contains('breadcrumb-subtag'));

        baseButtons.forEach((button) => {
            button.classList.remove('is-hidden');
        });

        moreWrapper.classList.add('is-hidden');
        moreWrapper.classList.remove('is-open');
        moreMenu.innerHTML = '';

        const containerWidth = container.clientWidth;
        if (!containerWidth || !baseButtons.length) return;

        moreWrapper.classList.remove('is-hidden');
        moreWrapper.style.display = 'inline-flex';
        const moreWidth = moreWrapper.offsetWidth || 0;
        moreWrapper.style.display = '';

        let availableWidth = containerWidth - (moreWidth + 8);
        let usedWidth = 0;
        const hidden = [];

        baseButtons.forEach((button) => {
            const style = window.getComputedStyle(button);
            const totalWidth = button.offsetWidth
                + parseFloat(style.marginLeft || '0')
                + parseFloat(style.marginRight || '0');

            if (usedWidth + totalWidth > availableWidth) {
                hidden.push(button);
            } else {
                usedWidth += totalWidth;
            }
        });

        if (!hidden.length) {
            moreWrapper.classList.add('is-hidden');
            return;
        }

        hidden.forEach((button) => {
            button.classList.add('is-hidden');
            const clone = button.cloneNode(true);
            clone.classList.remove('is-hidden');
            clone.addEventListener('click', () => {
                button.click();
                toggleMoreMenu(false);
            });
            moreMenu.appendChild(clone);
        });
    };

    const toggleMoreMenu = (force) => {
        const wrapper = elements.moreWrapper;
        if (!wrapper || wrapper.classList.contains('is-hidden')) return;
        const isOpen = wrapper.classList.contains('is-open');
        const nextState = typeof force === 'boolean' ? force : !isOpen;
        wrapper.classList.toggle('is-open', nextState);
    };

    const renderEmptyState = () => {
        if (elements.feed) {
            elements.feed.innerHTML = '<p class="blog-feed__empty">Blog posts are on the way. Please visit again soon!</p>';
        }
        if (elements.pagination) {
            elements.pagination.classList.add('is-hidden');
        }
    };

    const renderErrorState = () => {
        if (elements.feed) {
            elements.feed.innerHTML = '<p class="blog-feed__empty">We could not load the blog posts right now. Please try again later.</p>';
        }
        if (elements.pagination) {
            elements.pagination.classList.add('is-hidden');
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();