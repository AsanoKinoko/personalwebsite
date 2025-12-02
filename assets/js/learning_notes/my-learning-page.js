(() => {
    const elements = {
        sidebarRoot: document.querySelector('[data-ml-sidebar]'),
        sidebarLabel: document.querySelector('[data-ml-sidebar-label]'),
        mainTitle: document.querySelector('[data-ml-main-title]'),
        mainSubtitle: document.querySelector('[data-ml-main-subtitle]'),
        contentTitle: document.querySelector('[data-ml-content-title]'),
        contentMeta: document.querySelector('[data-ml-content-meta]'),
        contentBody: document.querySelector('[data-ml-content]'),
        status: document.querySelector('[data-ml-status]'),
    };

    const state = {
        note: null,
        flatTopics: new Map(), // id -> topic
        currentTopicId: null,
    };

    const ensureArray = (value) => (Array.isArray(value) ? value : []);

    const getParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            tag: params.get('tag') || '',
            topic: params.get('topic') || '',
        };
    };

    const updateUrl = (topicId) => {
        const params = new URLSearchParams(window.location.search);
        if (topicId) {
            params.set('topic', topicId);
        } else {
            params.delete('topic');
        }
        const query = params.toString();
        const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
        window.history.replaceState(null, '', newUrl);
    };

    const setStatus = (message) => {
        if (elements.status) {
            elements.status.textContent = message || '';
        }
    };

    const setContentPlaceholder = (message) => {
        if (!elements.contentBody) return;
        elements.contentBody.innerHTML = `<div class="my-learning-content__placeholder">${message}</div>`;
    };

    const buildTopicTree = (topics, parentElement) => {
        const ul = parentElement || document.createElement('ul');
        if (!parentElement) {
            ul.className = 'my-learning-tree';
        }

        topics.forEach((topic) => {
            if (!topic || !topic.id) return;

            state.flatTopics.set(topic.id, topic);

            const li = document.createElement('li');
            li.className = 'my-learning-tree__item';

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'my-learning-tree__link';
            button.dataset.topicId = topic.id;
            button.innerHTML = `
                <span class="my-learning-tree__bullet"></span>
                <span>${topic.title || topic.id}</span>
            `;

            button.addEventListener('click', () => {
                if (state.currentTopicId === topic.id) return;
                selectTopic(topic.id);
            });

            li.appendChild(button);

            const children = ensureArray(topic.children);
            if (children.length) {
                const childUl = document.createElement('ul');
                childUl.className = 'my-learning-tree__children';
                buildTopicTree(children, childUl);
                li.appendChild(childUl);
            }

            ul.appendChild(li);
        });

        return ul;
    };

    const updateActiveLink = () => {
        const links = elements.sidebarRoot
            ? elements.sidebarRoot.querySelectorAll('.my-learning-tree__link')
            : [];
        links.forEach((link) => {
            const isActive = link.dataset.topicId === state.currentTopicId;
            link.classList.toggle('is-active', isActive);
        });
    };

    const loadTopicContent = async (topic) => {
        if (!elements.contentBody) return;

        const url = topic.url;
        if (!url) {
            setContentPlaceholder('Chưa có nội dung cho mục này. Vui lòng chọn mục khác.');
            return;
        }

        try {
            setStatus('Đang tải nội dung...');
            elements.contentBody.innerHTML = '';

            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`Failed to fetch content (${response.status})`);
            }
            const html = await response.text();

            const container = document.createElement('div');
            container.innerHTML = html;

            let mainContent = container.querySelector('main') || container.querySelector('article');
            if (!mainContent) {
                mainContent = container;
            }

            elements.contentBody.innerHTML = '';
            elements.contentBody.appendChild(mainContent.cloneNode(true));
            setStatus('');
        } catch (error) {
            console.error('MyLearning: unable to load topic content', error);
            setStatus('Không thể tải nội dung. Vui lòng thử lại sau.');
            setContentPlaceholder('Đã xảy ra lỗi khi tải nội dung cho mục này.');
        }
    };

    const selectTopic = async (topicId) => {
        const topic = state.flatTopics.get(topicId);
        if (!topic) return;

        state.currentTopicId = topicId;
        updateActiveLink();
        updateUrl(topicId);

        if (elements.contentTitle) {
            elements.contentTitle.textContent = topic.title || topic.id;
        }

        if (elements.contentMeta) {
            const breadcrumbs = topic.breadcrumb || '';
            elements.contentMeta.textContent = breadcrumbs;
        }

        await loadTopicContent(topic);
    };

    const findFirstTopicId = (topics) => {
        const queue = [...topics];
        while (queue.length) {
            const t = queue.shift();
            if (t && t.id) return t.id;
            const children = ensureArray(t?.children);
            queue.push(...children);
        }
        return null;
    };

    const init = async () => {
        if (!window.LearningNoteData || !elements.sidebarRoot) return;

        try {
            const params = getParams();
            const data = await window.LearningNoteData.getData();
            const notes = ensureArray(data.notes);

            let note = notes.find((n) => n.id === params.tag);
            if (!note && notes.length) {
                note = notes[0];
            }
            state.note = note;

            const topics = ensureArray(note?.topics);
            if (!topics.length) {
                setStatus('Chưa có cấu trúc bài học cho chủ đề này.');
                setContentPlaceholder('Hãy thêm các "topics" cho note này trong data.');
                return;
            }

            if (elements.mainTitle && note?.title) {
                elements.mainTitle.textContent = note.title;
            }
            if (elements.mainSubtitle && note?.subtitle) {
                elements.mainSubtitle.textContent = note.subtitle;
            }

            elements.sidebarRoot.innerHTML = '';
            const tree = buildTopicTree(topics);
            elements.sidebarRoot.appendChild(tree);

            const initialTopicId = params.topic && state.flatTopics.has(params.topic)
                ? params.topic
                : findFirstTopicId(topics);

            if (initialTopicId) {
                await selectTopic(initialTopicId);
            } else {
                setContentPlaceholder('Không tìm thấy mục học tập nào.');
            }
        } catch (error) {
            console.error('MyLearning: failed to initialise page', error);
            setStatus('Không thể tải dữ liệu học tập.');
            setContentPlaceholder('Vui lòng kiểm tra lại data hoặc thử lại sau.');
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();