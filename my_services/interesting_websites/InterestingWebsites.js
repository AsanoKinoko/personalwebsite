document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('websites-content');

    async function loadWebsites() {
        try {
            // Adjust path depending on execution context, keeping it simple for now
            const response = await fetch('../../data/interesting_websites/interesting_websites_data.json');
            if (!response.ok) {
                throw new Error('Failed to load data');
            }

            const data = await response.json();
            renderWebsites(data);
        } catch (error) {
            console.error('Error fetching websites data:', error);
            container.innerHTML = `<div class="loading">Failed to load interesting websites. Please try again later.</div>`;
        }
    }

    function renderWebsites(data) {
        container.innerHTML = ''; // Clear loading

        if (!data || !data.groups || data.groups.length === 0) {
            container.innerHTML = `<div class="loading">No websites found.</div>`;
            return;
        }

        data.groups.forEach(group => {
            // Group section
            const groupSection = document.createElement('div');
            groupSection.className = 'group-section';

            // Group header
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.innerHTML = `
                <div class="group-icon">
                    <i class="${group.icon || 'bx bx-link'}"></i>
                </div>
                <h2 class="group-title">${group.label}</h2>
            `;
            groupSection.appendChild(groupHeader);

            // Websites grid
            const websitesGrid = document.createElement('div');
            websitesGrid.className = 'websites-grid';

            group.websites.forEach(site => {
                const isLinkValid = site.link && site.link.trim() !== '';

                const siteCard = document.createElement(isLinkValid ? 'a' : 'div');
                siteCard.className = 'website-card';
                if (isLinkValid) {
                    siteCard.href = site.link;
                    siteCard.target = '_blank';
                    siteCard.rel = 'noopener noreferrer';
                }

                siteCard.innerHTML = `
                    <div class="website-name">
                        ${site.name}
                        ${isLinkValid ? '<i class="bx bx-link-external website-external-icon"></i>' : ''}
                    </div>
                    <div class="website-description">
                        ${site.description || 'No description provided.'}
                    </div>
                `;

                websitesGrid.appendChild(siteCard);
            });

            groupSection.appendChild(websitesGrid);
            container.appendChild(groupSection);
        });
    }
    loadWebsites();
});