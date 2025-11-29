(() => {
    const NOTES_PER_PAGE = 6;
    const SEARCH_DEBOUNCE = 300;

    const elements = {
        searchInput: document.querySelector('[data-learning-note-search]'),
        searchClear: document.querySelector('[data-learning-note-search-clear]'),
        feed: document.querySelector('[data-learning-note-feed]'),
        pagination: document.querySelector('[data-learning-note-pagination]'),
    };

    const state = {
        data: null,
        template: null,
        searchQuery: '',
        page: 1,
    };

    const ensure = (value) => (window.LearningNoteData ? window.LearningNoteData.ensureArray(value) : Array.isArray(value) ? value : []);

    const debounce = (fn, wait) => {
        let timeout = null;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(null, args), wait);
        };
    };

    const normalizeSearchQuery = (query) => {
        return query.trim().toLowerCase();
    };

    const init = async () => {
        if (!window.LearningNoteData || !elements.feed) return;

        try {
            const [data, template] = await Promise.all([
                window.LearningNoteData.getData(),
                window.LearningNoteData.getCardTemplate(),
            ]);
            state.data = data;
            state.template = template;

            const notes = ensure(data.notes);
            if (!notes.length) {
                renderEmptyState();
                return;
            }

            syncStateFromUrl();
            renderAll();
            setupEvents();
        } catch (error) {
            console.error('Learning Note page failed to initialise', error);
            renderErrorState();
        }
    };

    const setupEvents = () => {
        if (elements.searchInput) {
            const handleSearch = debounce((event) => {
                const query = normalizeSearchQuery(event.target.value);
                state.searchQuery = query;
                state.page = 1;
                renderAll();
                updateSearchClearVisibility();
            }, SEARCH_DEBOUNCE);

            elements.searchInput.addEventListener('input', handleSearch);
            elements.searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    clearSearch();
                }
            });
        }

        if (elements.searchClear) {
            elements.searchClear.addEventListener('click', clearSearch);
        }

        window.addEventListener('popstate', handlePopState);
    };

    const clearSearch = () => {
        if (elements.searchInput) {
            elements.searchInput.value = '';
            state.searchQuery = '';
            state.page = 1;
            renderAll();
            updateSearchClearVisibility();
            elements.searchInput.focus();
        }
    };

    const updateSearchClearVisibility = () => {
        if (elements.searchClear) {
            elements.searchClear.style.display = state.searchQuery ? 'flex' : 'none';
        }
    };

    const handlePopState = () => {
        syncStateFromUrl();
        renderAll();
    };

    const syncStateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);

        const searchParam = params.get('search');
        state.searchQuery = searchParam ? normalizeSearchQuery(searchParam) : '';

        const requestedPage = parseInt(params.get('page'), 10);
        state.page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

        if (elements.searchInput && state.searchQuery) {
            elements.searchInput.value = state.searchQuery;
        }
        updateSearchClearVisibility();
    };

    const renderAll = () => {
        const notes = getFilteredNotes();
        const totalPages = Math.max(1, Math.ceil(notes.length / NOTES_PER_PAGE));

        if (state.page > totalPages) {
            state.page = totalPages;
        }

        renderFeed(notes);
        renderPagination(totalPages);
        updateUrl();
    };


    const getNotes = () => ensure(state.data?.notes);

    const getFilteredNotes = () => {
        const notes = getNotes();
        if (!state.searchQuery) return notes;
        
        const query = state.searchQuery;
        return notes.filter((note) => {
            const title = (note.title || '').toLowerCase();
            return title.includes(query);
        });
    };

    const renderFeed = (notes) => {
        const feed = elements.feed;
        feed.innerHTML = '';

        if (!notes.length) {
            const message = state.searchQuery 
                ? `No learning notes found for "${state.searchQuery}". Try a different search term.`
                : 'No learning notes found. Please check back later!';
            feed.innerHTML = `<p class="learning-note-feed__empty">${message}</p>`;
            return;
        }

        const start = (state.page - 1) * NOTES_PER_PAGE;
        const pageNotes = notes.slice(start, start + NOTES_PER_PAGE);
        const fragment = document.createDocumentFragment();

        pageNotes.forEach((note) => {
            const card = window.LearningNoteData.createCardFragment(state.template, {
                note,
                link: note.url || '#',
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
            anchor.href = buildPageHref(page);
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
        pageList.forEach((entry) => {
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

    const buildPageHref = (page) => {
        const params = new URLSearchParams();
        if (state.searchQuery) params.set('search', state.searchQuery);
        if (page > 1) params.set('page', page);
        const query = params.toString();
        return query ? `LearningNote.html?${query}` : 'LearningNote.html';
    };

    const updateUrl = () => {
        const params = new URLSearchParams();
        if (state.searchQuery) params.set('search', state.searchQuery);
        if (state.page > 1) params.set('page', state.page);
        const query = params.toString();
        const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    };


    const renderEmptyState = () => {
        if (elements.feed) {
            elements.feed.innerHTML = '<p class="learning-note-feed__empty">Learning notes are on the way. Please visit again soon!</p>';
        }
        if (elements.pagination) {
            elements.pagination.classList.add('is-hidden');
        }
    };

    const renderErrorState = () => {
        if (elements.feed) {
            elements.feed.innerHTML = '<p class="learning-note-feed__empty">We could not load the learning notes right now. Please try again later.</p>';
        }
        if (elements.pagination) {
            elements.pagination.classList.add('is-hidden');
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();