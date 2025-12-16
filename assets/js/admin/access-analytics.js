// Access Analytics Page Logic

let analyticsData = null;
let currentFilters = {
    dateRange: { start: null, end: null },
    browsers: [],
    devices: [],
    os: [],
    countries: [],
    statusCodes: []
};
let currentMetric = 'visits';
let currentGranularity = 'day';
let compareEnabled = false;
let currentPage = 1;
const itemsPerPage = 10;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadAdminLayout();
    loadAnalyticsData();
});

function loadAdminLayout() {
    fetch('../components/layout/AdminLayout.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('adminLayoutContainer').innerHTML = html;
            
            // Set active nav
            const navLink = document.querySelector('[data-nav="analytics"]');
            if (navLink) {
                navLink.classList.add('active');
            }

            // Set breadcrumbs
            const breadcrumbs = document.getElementById('headerBreadcrumbs');
            if (breadcrumbs) {
                breadcrumbs.innerHTML = `
                    <a href="dashboard.html" style="color: var(--text-secondary); text-decoration: none;">Dashboard</a>
                    <span style="color: var(--text-muted);">/</span>
                    <span style="color: var(--text-primary);">Quản lý truy cập</span>
                `;
            }

            // Initialize sidebar
            initAdminLayout();
        })
        .catch(err => console.error('Error loading admin layout:', err));
}

function initAdminLayout() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('adminSidebar');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (mobileMenuBtn && sidebar && sidebarOverlay) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.add('mobile-open');
            sidebarOverlay.classList.add('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
            sidebarOverlay.classList.remove('active');
        });
    }
}

function loadAnalyticsData() {
    const content = document.getElementById('adminContent');
    if (content) {
        content.innerHTML = '<div class="loading-skeleton skeleton-chart"></div>';
    }

    fetch('../data/analytics/analytics-data.json')
        .then(res => res.json())
        .then(data => {
            analyticsData = data;
            renderPage();
        })
        .catch(err => {
            console.error('Error loading analytics data:', err);
            showError();
        });
}

function renderPage() {
    const content = document.getElementById('adminContent');
    if (!content) return;

    content.innerHTML = `
        <div class="page-header">
            <div>
                <h1 class="heading-1" style="color: #f1c232; text-shadow: 1px 1px 4px rgba(255, 242, 204, 0.5);">Quản lý truy cập</h1>
                <p class="body-text" style="color: #fff2cc; opacity: 0.9;">Phân tích lượt truy cập, hành vi và hiệu suất URL theo thời gian</p>
            </div>
        </div>

        ${renderFilterBar()}
        ${renderSummaryCards()}
        ${renderCharts()}
        ${renderAnalyticsTable()}
        ${renderUrlDetailDrawer()}
    `;

    // Initialize components
    initializeFilters();
    initializeCharts();
    initializeTable();
    initializeDrawer();
}

function createDropdownFilter(id, label, options, hasSearch = false) {
    const optionsHtml = options.map(opt => `
        <div class="dropdown-filter-option">
            <input type="checkbox" id="${id}_${opt.value}" value="${opt.value}" data-filter="${id}">
            <label for="${id}_${opt.value}">${opt.label}</label>
        </div>
    `).join('');

    const searchHtml = hasSearch ? `
        <div class="dropdown-filter-search">
            <input type="text" placeholder="Tìm kiếm..." data-search="${id}">
        </div>
    ` : '';

    return `
        <div class="input-group">
            <label class="input-label">${label}</label>
            <div class="dropdown-filter" data-filter-id="${id}">
                <button type="button" class="dropdown-filter-btn" data-filter-btn="${id}">
                    <span class="dropdown-filter-btn-text">Chọn ${label.toLowerCase()}</span>
                    <span class="dropdown-filter-btn-count" style="display: none;">0</span>
                    <i class='bx bx-chevron-down'></i>
                </button>
                <div class="dropdown-filter-menu" data-filter-menu="${id}">
                    ${searchHtml}
                    <div class="dropdown-filter-options" data-filter-options="${id}">
                        ${optionsHtml}
                    </div>
                    <div class="dropdown-filter-actions">
                        <button type="button" class="btn-clear" data-filter-clear="${id}">Xóa</button>
                        <button type="button" class="btn-apply" data-filter-apply="${id}">Áp dụng</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderFilterBar() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return `
        <div class="filter-bar">
            <div class="filter-section">
                <div class="filter-row">
                    <div class="filter-row-full">
                        <div class="date-range-group">
                            <div class="date-range-inputs">
                                <div class="input-group">
                                    <label class="input-label">Từ ngày</label>
                                    <input type="date" class="input" id="dateStart" value="${formatDate(thirtyDaysAgo)}">
                                </div>
                                <span style="align-self: flex-end; padding-bottom: var(--spacing-sm);">–</span>
                                <div class="input-group">
                                    <label class="input-label">Đến ngày</label>
                                    <input type="date" class="input" id="dateEnd" value="${formatDate(today)}">
                                </div>
                            </div>
                            <div class="date-presets">
                                <button class="preset-btn" data-preset="today">Hôm nay</button>
                                <button class="preset-btn" data-preset="7d">7 ngày qua</button>
                                <button class="preset-btn active" data-preset="30d">30 ngày qua</button>
                                <button class="preset-btn" data-preset="thisMonth">Tháng này</button>
                                <button class="preset-btn" data-preset="thisQuarter">Quý này</button>
                            </div>
                        </div>
                    </div>
                    ${createDropdownFilter('filterBrowser', 'Trình duyệt', [
                        { value: 'Chrome', label: 'Chrome' },
                        { value: 'Safari', label: 'Safari' },
                        { value: 'Firefox', label: 'Firefox' },
                        { value: 'Edge', label: 'Edge' },
                        { value: 'Others', label: 'Others' }
                    ])}
                    ${createDropdownFilter('filterDevice', 'Thiết bị', [
                        { value: 'Desktop', label: 'Desktop' },
                        { value: 'Mobile', label: 'Mobile' },
                        { value: 'Tablet', label: 'Tablet' }
                    ])}
                    ${createDropdownFilter('filterOS', 'Hệ điều hành', [
                        { value: 'Windows', label: 'Windows' },
                        { value: 'macOS', label: 'macOS' },
                        { value: 'Linux', label: 'Linux' },
                        { value: 'Android', label: 'Android' },
                        { value: 'iOS', label: 'iOS' }
                    ])}
                    ${createDropdownFilter('filterCountry', 'Quốc gia', [
                        { value: 'VN', label: 'Vietnam' },
                        { value: 'US', label: 'United States' },
                        { value: 'JP', label: 'Japan' },
                        { value: 'GB', label: 'United Kingdom' },
                        { value: 'CA', label: 'Canada' },
                        { value: 'AU', label: 'Australia' }
                    ], true)}
                    ${createDropdownFilter('filterStatus', 'Status Code', [
                        { value: '200', label: '200 OK' },
                        { value: '404', label: '404 Not Found' },
                        { value: '500', label: '500 Error' }
                    ])}
                </div>
                <div class="filter-actions">
                    <button class="btn btn-primary" id="applyFilters">
                        <i class='bx bx-check'></i>
                        Áp dụng
                    </button>
                    <button class="btn btn-ghost" id="resetFilters">
                        <i class='bx bx-refresh'></i>
                        Đặt lại
                    </button>
                    <button class="btn btn-outline" id="exportCSV">
                        <i class='bx bx-download'></i>
                        Xuất CSV
                    </button>
                    <button class="btn btn-outline" id="shareReport">
                        <i class='bx bx-link'></i>
                        Chia sẻ link
                    </button>
                </div>
                <div class="filter-chips" id="filterChips"></div>
            </div>
        </div>
    `;
}

function renderSummaryCards() {
    if (!analyticsData) return '';

    const { metadata, peakHour, topCountry, returningRate } = analyticsData;

    return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3 class="stat-card-title">Tổng lượt truy cập</h3>
                    <div class="stat-card-icon primary">
                        <i class='bx bx-trending-up'></i>
                    </div>
                </div>
                <div class="stat-card-value">${formatNumber(metadata?.totalVisits || 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3 class="stat-card-title">Người dùng duy nhất</h3>
                    <div class="stat-card-icon success">
                        <i class='bx bx-user'></i>
                    </div>
                </div>
                <div class="stat-card-value">${formatNumber(metadata?.uniqueVisitors || 0)}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3 class="stat-card-title">Giờ cao điểm</h3>
                    <div class="stat-card-icon warning">
                        <i class='bx bx-time'></i>
                    </div>
                </div>
                <div class="stat-card-value">${peakHour?.hour != null ? `${peakHour.hour}:00` : 'N/A'}</div>
                <div class="stat-card-description">${peakHour?.visits ? formatNumber(peakHour.visits) + ' lượt truy cập' : 'Chưa có dữ liệu'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3 class="stat-card-title">Quốc gia hàng đầu</h3>
                    <div class="stat-card-icon info">
                        <i class='bx bx-globe'></i>
                    </div>
                </div>
                <div class="stat-card-value">${topCountry?.name || 'N/A'}</div>
                <div class="stat-card-description">${topCountry?.percentage ? topCountry.percentage.toFixed(1) + '% tổng lượt truy cập' : 'Chưa có dữ liệu'}</div>
            </div>
            <div class="stat-card">
                <div class="stat-card-header">
                    <h3 class="stat-card-title">Tỷ lệ quay lại</h3>
                    <div class="stat-card-icon success">
                        <i class='bx bx-refresh'></i>
                    </div>
                </div>
                <div class="stat-card-value">${returningRate ? returningRate.toFixed(1) : '0.0'}%</div>
            </div>
        </div>
    `;
}

function renderCharts() {
    return `
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
            <div class="chart-card">
                <div class="chart-card-header">
                    <div class="chart-card-title-group">
                        <h3 class="chart-card-title" style="color: #f1c232; text-shadow: 1px 1px 4px rgba(255, 242, 204, 0.5);">Lượt truy cập theo thời gian</h3>
                        <p class="chart-card-subtitle" style="color: #fff2cc; opacity: 0.85;">Tổng visits / unique / pageviews trong khoảng thời gian đã chọn</p>
                    </div>
                    <div class="chart-card-controls">
                        <div class="chart-toggle-group">
                            <button class="chart-toggle-btn active" data-metric="visits">Visits</button>
                            <button class="chart-toggle-btn" data-metric="unique">Unique</button>
                            <button class="chart-toggle-btn" data-metric="pageviews">Pageviews</button>
                        </div>
                        <label class="chart-compare-toggle">
                            <input type="checkbox" class="compare-checkbox" id="compareToggle">
                            <span>So sánh kỳ trước</span>
                        </label>
                        <select class="granularity-select" id="granularitySelect">
                            <option value="hour">Giờ</option>
                            <option value="day" selected>Ngày</option>
                            <option value="week">Tuần</option>
                        </select>
                    </div>
                </div>
                <div class="chart-card-body">
                    <canvas id="timeSeriesChart"></canvas>
                </div>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-xl);">
            <div class="chart-card">
                <div class="chart-card-header">
                    <div class="chart-card-title-group">
                        <h3 class="chart-card-title" style="color: #f1c232; text-shadow: 1px 1px 4px rgba(255, 242, 204, 0.5);">Trình duyệt</h3>
                    </div>
                </div>
                <div class="chart-card-body">
                    <canvas id="browserChart"></canvas>
                </div>
            </div>
            <div class="chart-card">
                <div class="chart-card-header">
                    <div class="chart-card-title-group">
                        <h3 class="chart-card-title" style="color: #f1c232; text-shadow: 1px 1px 4px rgba(255, 242, 204, 0.5);">Thiết bị</h3>
                    </div>
                </div>
                <div class="chart-card-body">
                    <canvas id="deviceChart"></canvas>
                </div>
            </div>
        </div>
    `;
}

function renderAnalyticsTable() {
    return `
        <div class="analytics-tabs">
            <div class="tab-nav">
                <button class="tab-nav-item active" data-tab="topUrls" style="color: #f1c232; text-shadow: 1px 1px 3px rgba(255, 242, 204, 0.4);">Top URLs</button>
                <button class="tab-nav-item" data-tab="sessions">Sessions / Events</button>
                <button class="tab-nav-item" data-tab="referrers">Referrers / Campaigns</button>
            </div>
            <div class="tab-content">
                <div class="tab-pane active" id="topUrlsTab">
                    <div class="table-search">
                        <input type="text" class="input" id="tableSearch" placeholder="Tìm kiếm URL...">
                    </div>
                    <div class="analytics-table-wrapper">
                        <table class="analytics-table">
                            <thead>
                                <tr>
                                    <th class="sortable" data-sort="visits">
                                        URL
                                        <span class="sort-icon">▼</span>
                                    </th>
                                    <th class="sortable" data-sort="visits">Visits</th>
                                    <th class="sortable" data-sort="unique">Unique</th>
                                    <th class="sortable" data-sort="avgDuration">Avg Duration</th>
                                    <th class="sortable" data-sort="exitRate">Exit Rate</th>
                                    <th class="sortable" data-sort="lastAccessed">Last Accessed</th>
                                </tr>
                            </thead>
                            <tbody id="tableBody"></tbody>
                        </table>
                    </div>
                    <div class="url-card-list" id="urlCardList"></div>
                    <div class="table-pagination" id="tablePagination"></div>
                </div>
                <div class="tab-pane" id="sessionsTab">
                    <p class="body-text">Sessions / Events tab - Coming soon</p>
                </div>
                <div class="tab-pane" id="referrersTab">
                    <p class="body-text">Referrers / Campaigns tab - Coming soon</p>
                </div>
            </div>
        </div>
    `;
}

function renderUrlDetailDrawer() {
    return `
        <div class="drawer-backdrop" id="drawerBackdrop"></div>
        <div class="drawer" id="urlDetailDrawer">
            <div class="drawer-header">
                <div class="drawer-title-group">
                    <h3 class="drawer-title" id="drawerTitle">
                        <span id="drawerUrl"></span>
                    </h3>
                    <p class="drawer-subtitle" id="drawerSubtitle"></p>
                </div>
                <button class="drawer-close" id="drawerClose">
                    <i class='bx bx-x'></i>
                </button>
            </div>
            <div class="drawer-body" id="drawerBody"></div>
        </div>
    `;
}

// Initialize functions
function initializeFilters() {
    // Date presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const preset = btn.dataset.preset;
            const today = new Date();
            const start = new Date();
            
            switch(preset) {
                case 'today':
                    start.setHours(0, 0, 0, 0);
                    break;
                case '7d':
                    start.setDate(today.getDate() - 7);
                    break;
                case '30d':
                    start.setDate(today.getDate() - 30);
                    break;
                case 'thisMonth':
                    start.setDate(1);
                    break;
                case 'thisQuarter':
                    const quarter = Math.floor(today.getMonth() / 3);
                    start.setMonth(quarter * 3, 1);
                    break;
            }
            
            document.getElementById('dateStart').value = formatDate(start);
            document.getElementById('dateEnd').value = formatDate(today);
        });
    });

    // Initialize dropdown filters
    initializeDropdownFilters();

    // Apply filters
    document.getElementById('applyFilters')?.addEventListener('click', applyFilters);
    document.getElementById('resetFilters')?.addEventListener('click', resetFilters);
    document.getElementById('exportCSV')?.addEventListener('click', exportCSV);
    document.getElementById('shareReport')?.addEventListener('click', shareReport);
}

function initializeDropdownFilters() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-filter')) {
            document.querySelectorAll('.dropdown-filter-menu').forEach(menu => {
                menu.classList.remove('active');
            });
            document.querySelectorAll('.dropdown-filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    });

    // Toggle dropdown
    document.querySelectorAll('[data-filter-btn]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filterId = btn.dataset.filterBtn;
            const menu = document.querySelector(`[data-filter-menu="${filterId}"]`);
            const isActive = menu.classList.contains('active');

            // Close all other dropdowns
            document.querySelectorAll('.dropdown-filter-menu').forEach(m => {
                if (m !== menu) m.classList.remove('active');
            });
            document.querySelectorAll('.dropdown-filter-btn').forEach(b => {
                if (b !== btn) b.classList.remove('active');
            });

            // Toggle current dropdown
            menu.classList.toggle('active', !isActive);
            btn.classList.toggle('active', !isActive);
        });
    });

    // Search in dropdown
    document.querySelectorAll('[data-search]').forEach(searchInput => {
        searchInput.addEventListener('input', (e) => {
            const filterId = e.target.dataset.search;
            const searchTerm = e.target.value.toLowerCase();
            const options = document.querySelectorAll(`[data-filter-options="${filterId}"] .dropdown-filter-option`);

            options.forEach(option => {
                const label = option.querySelector('label').textContent.toLowerCase();
                option.style.display = label.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    });

    // Checkbox change - update button text and count
    document.querySelectorAll('[data-filter]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateDropdownButton(checkbox.dataset.filter);
        });
    });

    // Clear button
    document.querySelectorAll('[data-filter-clear]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filterId = btn.dataset.filterClear;
            const checkboxes = document.querySelectorAll(`[data-filter="${filterId}"]`);
            checkboxes.forEach(cb => cb.checked = false);
            updateDropdownButton(filterId);
        });
    });

    // Apply button (close dropdown)
    document.querySelectorAll('[data-filter-apply]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const filterId = btn.dataset.filterApply;
            const menu = document.querySelector(`[data-filter-menu="${filterId}"]`);
            const filterBtn = document.querySelector(`[data-filter-btn="${filterId}"]`);
            menu.classList.remove('active');
            filterBtn.classList.remove('active');
        });
    });
}

function updateDropdownButton(filterId) {
    const checkboxes = document.querySelectorAll(`[data-filter="${filterId}"]:checked`);
    const count = checkboxes.length;
    const btn = document.querySelector(`[data-filter-btn="${filterId}"]`);
    const btnText = btn.querySelector('.dropdown-filter-btn-text');
    const btnCount = btn.querySelector('.dropdown-filter-btn-count');

    if (count === 0) {
        const label = btn.closest('.input-group').querySelector('.input-label').textContent;
        btnText.textContent = `Chọn ${label.toLowerCase()}`;
        btnCount.style.display = 'none';
        btn.classList.remove('active');
    } else {
        const labels = Array.from(checkboxes).map(cb => {
            return cb.closest('.dropdown-filter-option').querySelector('label').textContent;
        });
        btnText.textContent = labels.length > 2 
            ? `${labels[0]}, ${labels[1]}... (+${labels.length - 2})`
            : labels.join(', ');
        btnCount.textContent = count;
        btnCount.style.display = 'inline-block';
        btn.classList.add('active');
    }
}

function initializeCharts() {
    if (!analyticsData) return;

    // Time series chart
    initTimeSeriesChart();
    
    // Browser donut chart
    initBrowserChart();
    
    // Device horizontal bar chart
    initDeviceChart();
}

function initTimeSeriesChart() {
    const ctx = document.getElementById('timeSeriesChart');
    if (!ctx) return;

    const data = analyticsData.timeSeries?.data || [];
    if (data.length === 0) {
        // Show empty state
        return;
    }
    
    const labels = data.map(d => formatDateLabel(d.date));
    const visitsData = data.map(d => d.visits);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Visits',
                data: visitsData,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#E5E7EB'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });

    // Metric toggle
    document.querySelectorAll('.chart-toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.chart-toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMetric = btn.dataset.metric;
            // Update chart here
        });
    });
}

function initBrowserChart() {
    const ctx = document.getElementById('browserChart');
    if (!ctx) return;

    const browsers = analyticsData.browsers || [];
    if (browsers.length === 0) {
        return;
    }
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: browsers.map(b => b.name),
            datasets: [{
                data: browsers.map(b => b.visits),
                backgroundColor: [
                    '#2563EB',
                    '#22C55E',
                    '#F97316',
                    '#8B5CF6',
                    '#6B7280'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function initDeviceChart() {
    const ctx = document.getElementById('deviceChart');
    if (!ctx) return;

    const devices = analyticsData.devices || [];
    if (devices.length === 0) {
        return;
    }
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: devices.map(d => d.type),
            datasets: [{
                label: 'Visits',
                data: devices.map(d => d.visits),
                backgroundColor: '#2563EB'
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: '#E5E7EB'
                    }
                },
                y: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function initializeTable() {
    renderTable();
    
    // Tab switching
    document.querySelectorAll('.tab-nav-item').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-nav-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            const tabId = tab.dataset.tab + 'Tab';
            document.getElementById(tabId)?.classList.add('active');
        });
    });

    // Search
    document.getElementById('tableSearch')?.addEventListener('input', (e) => {
        currentPage = 1;
        renderTable(e.target.value);
    });
}

function renderTable(searchTerm = '') {
    if (!analyticsData) return;

    const topUrls = (analyticsData.topUrls || [])
        .filter(url => {
            if (!searchTerm) return true;
            return url.url.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .filter(url => {
            // Exclude homepage
            const excludePatterns = ['/', '/home', '/index'];
            return !excludePatterns.includes(url.url);
        });
    
    if (topUrls.length === 0) {
        const tbody = document.getElementById('tableBody');
        const cardList = document.getElementById('urlCardList');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: var(--spacing-xl); color: var(--text-muted);">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class='bx bx-bar-chart-alt-2'></i>
                            </div>
                            <h3 class="empty-state-title">Chưa có dữ liệu</h3>
                            <p class="empty-state-description">Chưa có lượt truy cập nào được ghi nhận trong khoảng thời gian đã chọn.</p>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (cardList) {
            cardList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i class='bx bx-bar-chart-alt-2'></i>
                    </div>
                    <h3 class="empty-state-title">Chưa có dữ liệu</h3>
                    <p class="empty-state-description">Chưa có lượt truy cập nào được ghi nhận trong khoảng thời gian đã chọn.</p>
                </div>
            `;
        }
        renderPagination(0);
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedUrls = topUrls.slice(start, end);

    const tbody = document.getElementById('tableBody');
    const cardList = document.getElementById('urlCardList');
    
    if (tbody) {
        tbody.innerHTML = paginatedUrls.map((url, index) => {
            const rank = start + index + 1;
            const topClass = rank <= 3 ? `top-${rank}` : '';
            const badge = rank <= 3 ? `<span class="badge badge-primary badge-sm">Top ${rank}</span>` : '';
            
            return `
                <tr class="${topClass}">
                    <td>
                        <div class="url-cell">
                            <a href="#" class="url-link" data-url="${url.url}">${url.url}</a>
                            ${badge}
                        </div>
                    </td>
                    <td>${formatNumber(url.visits)}</td>
                    <td>${formatNumber(url.unique)}</td>
                    <td>${formatDuration(url.avgDuration)}</td>
                    <td>${url.exitRate.toFixed(1)}%</td>
                    <td>${formatRelativeTime(url.lastAccessed)}</td>
                </tr>
            `;
        }).join('');

        // Add click handlers
        tbody.querySelectorAll('.url-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openUrlDrawer(link.dataset.url);
            });
        });
    }

    // Mobile card view
    if (cardList) {
        cardList.innerHTML = paginatedUrls.map((url, index) => {
            const rank = start + index + 1;
            const badge = rank <= 3 ? `<span class="badge badge-primary badge-sm">Top ${rank}</span>` : '';
            
            return `
                <div class="url-card">
                    <div class="url-card-header">
                        <a href="#" class="url-card-url" data-url="${url.url}">${url.url}</a>
                        ${badge}
                    </div>
                    <div class="url-card-stats">
                        <div class="url-card-stat">
                            <span class="url-card-stat-label">Visits</span>
                            <span class="url-card-stat-value">${formatNumber(url.visits)}</span>
                        </div>
                        <div class="url-card-stat">
                            <span class="url-card-stat-label">Unique</span>
                            <span class="url-card-stat-value">${formatNumber(url.unique)}</span>
                        </div>
                        <div class="url-card-stat">
                            <span class="url-card-stat-label">Duration</span>
                            <span class="url-card-stat-value">${formatDuration(url.avgDuration)}</span>
                        </div>
                        <div class="url-card-stat">
                            <span class="url-card-stat-label">Exit Rate</span>
                            <span class="url-card-stat-value">${url.exitRate.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        cardList.querySelectorAll('.url-card-url').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                openUrlDrawer(link.dataset.url);
            });
        });
    }

    // Pagination
    renderPagination(topUrls.length);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pagination = document.getElementById('tablePagination');
    
    if (!pagination) return;

    pagination.innerHTML = `
        <div class="pagination-info">
            Hiển thị ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} của ${totalItems}
        </div>
        <div class="pagination-controls">
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class='bx bx-chevron-left'></i>
            </button>
            ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return `<button class="pagination-btn ${page === currentPage ? 'active' : ''}" data-page="${page}">${page}</button>`;
            }).join('')}
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class='bx bx-chevron-right'></i>
            </button>
        </div>
    `;

    pagination.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                renderTable(document.getElementById('tableSearch')?.value || '');
            }
        });
    });
}

function initializeDrawer() {
    const drawer = document.getElementById('urlDetailDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const closeBtn = document.getElementById('drawerClose');

    [backdrop, closeBtn].forEach(el => {
        el?.addEventListener('click', () => {
            drawer?.classList.remove('active');
            backdrop?.classList.remove('active');
        });
    });
}

function openUrlDrawer(url) {
    if (!analyticsData || !analyticsData.urlDetails[url]) {
        alert('Không có dữ liệu chi tiết cho URL này');
        return;
    }

    const drawer = document.getElementById('urlDetailDrawer');
    const backdrop = document.getElementById('drawerBackdrop');
    const urlData = analyticsData.urlDetails[url];
    const urlInfo = analyticsData.topUrls.find(u => u.url === url);

    document.getElementById('drawerUrl').textContent = url;
    document.getElementById('drawerSubtitle').textContent = `${formatNumber(urlInfo.visits)} lượt truy cập`;

    const drawerBody = document.getElementById('drawerBody');
    drawerBody.innerHTML = `
        <div class="drawer-section">
            <div class="drawer-metrics">
                <div class="drawer-metric">
                    <span class="drawer-metric-label">Visits</span>
                    <span class="drawer-metric-value">${formatNumber(urlInfo.visits)}</span>
                </div>
                <div class="drawer-metric">
                    <span class="drawer-metric-label">Unique</span>
                    <span class="drawer-metric-value">${formatNumber(urlInfo.unique)}</span>
                </div>
                <div class="drawer-metric">
                    <span class="drawer-metric-label">Avg Duration</span>
                    <span class="drawer-metric-value">${formatDuration(urlInfo.avgDuration)}</span>
                </div>
                <div class="drawer-metric">
                    <span class="drawer-metric-label">Exit Rate</span>
                    <span class="drawer-metric-value">${urlInfo.exitRate.toFixed(1)}%</span>
                </div>
            </div>
        </div>
        <div class="drawer-section">
            <h4 class="drawer-section-title" style="color: #f1c232; text-shadow: 1px 1px 3px rgba(255, 242, 204, 0.4);">Trend lượt truy cập</h4>
            <div class="drawer-chart">
                <canvas id="drawerTrendChart"></canvas>
            </div>
        </div>
        <div class="drawer-section">
            <h4 class="drawer-section-title" style="color: #f1c232; text-shadow: 1px 1px 3px rgba(255, 242, 204, 0.4);">Breakdown</h4>
            <div class="drawer-charts">
                <div class="drawer-chart">
                    <canvas id="drawerBrowserChart"></canvas>
                </div>
                <div class="drawer-chart">
                    <canvas id="drawerDeviceChart"></canvas>
                </div>
            </div>
        </div>
        <div class="drawer-section">
            <h4 class="drawer-section-title" style="color: #f1c232; text-shadow: 1px 1px 3px rgba(255, 242, 204, 0.4);">20 lượt truy cập gần nhất</h4>
            <div class="drawer-visits-list">
                ${urlData.recentVisits.map(visit => `
                    <div class="drawer-visit-item">
                        <div class="drawer-visit-time">${formatRelativeTime(visit.time)}</div>
                        <div class="drawer-visit-details">
                            <div class="drawer-visit-detail">
                                <i class='bx bx-globe'></i>
                                <span>${visit.country}</span>
                            </div>
                            <div class="drawer-visit-detail">
                                <i class='bx bx-desktop'></i>
                                <span>${visit.browser}</span>
                            </div>
                            <div class="drawer-visit-detail">
                                <i class='bx bx-devices'></i>
                                <span>${visit.device}</span>
                            </div>
                            <div class="drawer-visit-detail">
                                <span>${visit.ipMasked}</span>
                            </div>
                            <div class="drawer-visit-detail">
                                <span class="badge badge-success badge-sm">${visit.statusCode}</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    // Initialize drawer charts
    setTimeout(() => {
        initDrawerCharts(urlData);
    }, 100);

    drawer?.classList.add('active');
    backdrop?.classList.add('active');
}

function initDrawerCharts(urlData) {
    // Trend chart
    const trendCtx = document.getElementById('drawerTrendChart');
    if (trendCtx) {
        const labels = urlData.timeSeries.map(d => formatDateLabel(d.date));
        const visitsData = urlData.timeSeries.map(d => d.visits);

        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visits',
                    data: visitsData,
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // Browser chart
    const browserCtx = document.getElementById('drawerBrowserChart');
    if (browserCtx) {
        new Chart(browserCtx, {
            type: 'doughnut',
            data: {
                labels: urlData.browsers.map(b => b.name),
                datasets: [{
                    data: urlData.browsers.map(b => b.visits),
                    backgroundColor: ['#2563EB', '#22C55E', '#F97316', '#8B5CF6', '#6B7280']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Device chart
    const deviceCtx = document.getElementById('drawerDeviceChart');
    if (deviceCtx) {
        new Chart(deviceCtx, {
            type: 'bar',
            data: {
                labels: urlData.devices.map(d => d.type),
                datasets: [{
                    label: 'Visits',
                    data: urlData.devices.map(d => d.visits),
                    backgroundColor: '#2563EB'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true },
                    y: { grid: { display: false } }
                }
            }
        });
    }
}

// Utility functions
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
}

function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatRelativeTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

function applyFilters() {
    // Get filter values from dropdowns
    currentFilters.browsers = getSelectedValues('filterBrowser');
    currentFilters.devices = getSelectedValues('filterDevice');
    currentFilters.os = getSelectedValues('filterOS');
    currentFilters.countries = getSelectedValues('filterCountry');
    currentFilters.statusCodes = getSelectedValues('filterStatus');
    
    // Get date range
    const dateStart = document.getElementById('dateStart')?.value;
    const dateEnd = document.getElementById('dateEnd')?.value;
    currentFilters.dateRange = { start: dateStart, end: dateEnd };
    
    console.log('Applying filters:', currentFilters);
    renderTable();
    updateFilterChips();
}

function getSelectedValues(filterId) {
    const checkboxes = document.querySelectorAll(`[data-filter="${filterId}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function resetFilters() {
    currentFilters = {
        dateRange: { start: null, end: null },
        browsers: [],
        devices: [],
        os: [],
        countries: [],
        statusCodes: []
    };
    
    // Reset date inputs
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    document.getElementById('dateStart').value = formatDate(thirtyDaysAgo);
    document.getElementById('dateEnd').value = formatDate(today);
    
    // Reset date presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.preset === '30d') {
            btn.classList.add('active');
        }
    });
    
    // Reset all dropdown filters
    document.querySelectorAll('[data-filter]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Update all dropdown buttons
    ['filterBrowser', 'filterDevice', 'filterOS', 'filterCountry', 'filterStatus'].forEach(filterId => {
        updateDropdownButton(filterId);
    });
    
    // Clear filter chips
    const chipsContainer = document.getElementById('filterChips');
    if (chipsContainer) {
        chipsContainer.innerHTML = '';
    }
    
    renderTable();
}

function updateFilterChips() {
    const chipsContainer = document.getElementById('filterChips');
    if (!chipsContainer) return;
    
    chipsContainer.innerHTML = '';
    
    // Add chips for each active filter
    if (currentFilters.browsers.length > 0) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            <span>Trình duyệt: ${currentFilters.browsers.join(', ')}</span>
            <button class="filter-chip-remove" data-clear-filter="browsers">×</button>
        `;
        chipsContainer.appendChild(chip);
    }
    
    if (currentFilters.devices.length > 0) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            <span>Thiết bị: ${currentFilters.devices.join(', ')}</span>
            <button class="filter-chip-remove" data-clear-filter="devices">×</button>
        `;
        chipsContainer.appendChild(chip);
    }
    
    if (currentFilters.os.length > 0) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            <span>Hệ điều hành: ${currentFilters.os.join(', ')}</span>
            <button class="filter-chip-remove" data-clear-filter="os">×</button>
        `;
        chipsContainer.appendChild(chip);
    }
    
    if (currentFilters.countries.length > 0) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            <span>Quốc gia: ${currentFilters.countries.join(', ')}</span>
            <button class="filter-chip-remove" data-clear-filter="countries">×</button>
        `;
        chipsContainer.appendChild(chip);
    }
    
    if (currentFilters.statusCodes.length > 0) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            <span>Status Code: ${currentFilters.statusCodes.join(', ')}</span>
            <button class="filter-chip-remove" data-clear-filter="statusCodes">×</button>
        `;
        chipsContainer.appendChild(chip);
    }
    
    // Add event listeners to remove buttons
    chipsContainer.querySelectorAll('.filter-chip-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const filterType = btn.dataset.clearFilter;
            currentFilters[filterType] = [];
            
            // Clear checkboxes
            const filterIdMap = {
                browsers: 'filterBrowser',
                devices: 'filterDevice',
                os: 'filterOS',
                countries: 'filterCountry',
                statusCodes: 'filterStatus'
            };
            
            const filterId = filterIdMap[filterType];
            if (filterId) {
                document.querySelectorAll(`[data-filter="${filterId}"]`).forEach(cb => {
                    cb.checked = false;
                });
                updateDropdownButton(filterId);
            }
            
            updateFilterChips();
            renderTable();
        });
    });
}

function exportCSV() {
    // CSV export logic
    alert('Tính năng xuất CSV đang được phát triển');
}

function shareReport() {
    // Share report logic
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('Đã sao chép link báo cáo vào clipboard');
    });
}

function showError() {
    const content = document.getElementById('adminContent');
    if (content) {
        content.innerHTML = `
            <div class="error-state">
                <div class="error-state-icon">
                    <i class='bx bx-error-circle'></i>
                </div>
                <h3 class="error-state-title">Đã xảy ra lỗi khi tải dữ liệu</h3>
                <p class="error-state-description">Vui lòng kiểm tra kết nối hoặc thử lại sau.</p>
                <div class="error-state-actions">
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class='bx bx-refresh'></i>
                        Thử lại
                    </button>
                </div>
            </div>
        `;
    }
}