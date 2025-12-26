# Themes Management System

Hệ thống quản lý themes và hiệu ứng cho website, cho phép bật/tắt các hiệu ứng từ trang admin.

## Cách sử dụng

### 1. Thêm themes vào trang web

Có 2 cách để thêm themes vào các trang:

#### Cách 1: Sử dụng Themes Loader (Khuyến nghị)

Chỉ cần thêm một dòng script vào `<head>` hoặc trước `</body>`:

```html
<script src="themes/themes-loader.js"></script>
```

Themes loader sẽ tự động load tất cả các themes đã được bật từ admin panel.

#### Cách 2: Load trực tiếp theme cụ thể

Nếu bạn muốn load một theme cụ thể:

```html
<script src="themes/snow-effect.js"></script>
```

Theme sẽ tự kiểm tra trạng thái trong localStorage và chỉ khởi tạo nếu được bật.

### 2. Quản lý themes từ Admin Panel

1. Truy cập `/admin_pages/themes.html`
2. Bật/tắt các themes bằng toggle switch
3. Thay đổi sẽ được lưu vào localStorage và áp dụng ngay lập tức

## Thêm theme mới

Để thêm một theme mới vào hệ thống:

### Bước 1: Tạo file theme

Tạo file theme trong folder `themes/`, ví dụ: `themes/rain-effect.js`

### Bước 2: Đăng ký theme trong themes-manager.js

Thêm theme vào object `THEMES` trong `assets/js/admin/themes-manager.js`:

```javascript
const THEMES = {
    snow: {
        id: 'snow',
        name: 'Hiệu ứng tuyết rơi',
        description: 'Hiệu ứng tuyết rơi mùa đông...',
        icon: '❄️',
        script: '../themes/snow-effect.js',
        enabled: false
    },
    rain: {  // Theme mới
        id: 'rain',
        name: 'Hiệu ứng mưa',
        description: 'Hiệu ứng mưa rơi...',
        icon: '🌧️',
        script: '../themes/rain-effect.js',
        enabled: false
    }
};
```

### Bước 3: Thêm vào themes-loader.js

Thêm theme vào `THEMES_CONFIG` trong `themes/themes-loader.js`:

```javascript
const THEMES_CONFIG = {
    snow: {
        script: 'themes/snow-effect.js'
    },
    rain: {  // Theme mới
        script: 'themes/rain-effect.js'
    }
};
```

### Bước 4: Implement theme với localStorage check

Trong file theme mới, thêm logic kiểm tra localStorage:

```javascript
function isThemeEnabled() {
    try {
        const themesState = localStorage.getItem('website_themes');
        if (themesState) {
            const state = JSON.parse(themesState);
            return state.rain === true;  // ID của theme
        }
    } catch (err) {
        console.error('Error checking theme state:', err);
    }
    return false;
}

// Chỉ init nếu theme được bật
if (isThemeEnabled()) {
    init();
}

// Lắng nghe thay đổi
window.addEventListener('themeStateChanged', function(e) {
    if (e.detail.themeId === 'rain') {
        // Handle state change
    }
});
```

## Cấu trúc

- `themes/snow-effect.js` - Hiệu ứng tuyết rơi
- `themes/themes-loader.js` - Loader tự động cho tất cả themes
- `admin_pages/themes.html` - Trang quản lý themes
- `assets/js/admin/themes-manager.js` - Logic quản lý themes

## Lưu ý

- Tất cả trạng thái được lưu trong `localStorage` với key `website_themes`
- Themes sẽ tự động sync giữa các tab/window
- Khi bật/tắt theme, thay đổi sẽ áp dụng ngay lập tức trên tất cả các trang đang mở

=======================================================================================

A system for managing themes and effects for your website, allowing you to enable/disable effects from the admin panel.

## How to Use

### 1. Adding Themes to Your Website

There are two ways to add themes to pages:

#### Method 1: Using Themes Loader (Recommended)

Simply add a line of script to `<head>` or before `</body>`:

```html
<script src="themes/themes-loader.js"></script>
```

The Themes Loader will automatically load all themes that have been enabled from the admin panel.

#### Method 2: Load a Specific Theme Directly

If you want to load a specific theme:

```html
<script src="themes/snow-effect.js"></script>
```

The theme will automatically check its state in localStorage and only initialize if enabled.

### 2. Managing Themes from the Admin Panel

1. Access `/admin_pages/themes.html`
2. Enable/disable themes using the toggle switch
3. Changes will be saved to localStorage and applied immediately

## Adding a New Theme

To add a new theme to the system:

### Step 1: Create a theme file

Create a theme file in the `themes/` folder, for example: `themes/rain-effect.js`

### Step 2: Register the theme in themes-manager.js

Add the theme to the `THEMES` object in `assets/js/admin/themes-manager.js`:

```javascript
const THEMES = {
    snow: {
        id: 'snow',
        name: 'Hiệu ứng tuyết rơi',
        description: 'Hiệu ứng tuyết rơi mùa đông...',
        icon: '❄️',
        script: '../themes/snow-effect.js',
        enabled: false
    },
    rain: {  // New theme
        id: 'rain',
        name: 'Hiệu ứng mưa',
        description: 'Hiệu ứng mưa rơi...',
        icon: '🌧️',
        script: '../themes/rain-effect.js',
        enabled: false
    }
};
```

### Step 3: Add to themes-loader.js

Add the theme to `THEMES_CONFIG` in `themes/themes-loader.js`:

```javascript
const THEMES_CONFIG = {
    snow: {
        script: 'themes/snow-effect.js'
    },
    rain: {  // New theme
        script: 'themes/rain-effect.js'
    }
};
```

### Step 4: Implement theme with localStorage check

In the new theme file, add logic that checks localStorage:

```javascript
function isThemeEnabled() {
    try {
        const themesState = localStorage.getItem('website_themes');
        if (themesState) {
            const state = JSON.parse(themesState);
            return state.rain === true;  // ID of the theme
        }
    } catch (err) {
        console.error('Error checking theme state:', err);
    }
    return false;
}

// Only init if theme is enabled
if (isThemeEnabled()) {
    init();
}

// Handle state change
window.addEventListener('themeStateChanged', function(e) {
    if (e.detail.themeId === 'rain') {
        // Handle state change
    }
});
```

## Structure

- `themes/snow-effect.js` - Snowfall effect
- `themes/themes-loader.js` - Automatic loader for all themes
- `admin_pages/themes.html` - Theme management page
- `assets/js/admin/themes-manager.js` - Theme management logic

## Notes

- All state is stored in `localStorage` with the key `website_themes`
- Themes will automatically sync between tabs/windows
- When enabling/disabling a theme, changes will be applied immediately to all open pages