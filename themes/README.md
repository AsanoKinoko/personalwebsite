# Themes Management System

Hệ thống quản lý themes và hiệu ứng cho website, cho phép bật/tắt các hiệu ứng từ trang quản trị (Admin Panel). Hệ thống sử dụng cấu hình tập trung bằng file JSON để dễ dàng mở rộng.

## Cách sử dụng

### 1. Nhúng theme vào trang web

Chỉ cần thêm một dòng script vào `<head>` hoặc trước thẻ đóng `</body>`:

```html
<script src="themes/themes-loader.js"></script>
```

`themes-loader.js` sẽ tự động thực hiện các việc sau:
1. Tải danh sách các theme từ `data/themes/themes_data.json`.
2. Kiểm tra trạng thái bật/tắt trong `localStorage` (người dùng cài đặt) hoặc mặc định từ file JSON.
3. Tự động tải các script theme tương ứng.

### 2. Quản lý themes từ Admin Panel

1. Truy cập vào trang quản lý Theme trong Admin: `/admin_pages/themes.html` (hoặc thông qua Dashboard).
2. Sử dụng Toggle Switch để bật hoặc tắt các hiệu ứng.
3. Thay đổi sẽ được lưu vào `localStorage` và áp dụng ngay lập tức cho tất cả các tab đang mở mà không cần load lại trang.

## Quy trình thêm theme mới

Để thêm một hiệu ứng mới vào hệ thống, bạn thực hiện theo các bước sau:

### Bước 1: Tạo script cho theme
Tạo file script trong thư mục `themes/` (hoặc thư mục con bên trong), ví dụ: `themes/rain-effect/rain-effect.js`.

Để theme hoạt động tốt với hệ thống bật/tắt mà không cần load lại trang, script nên được đóng gói theo cấu trúc sau:

```javascript
(function() {
    if (window.MyNewEffect) return;

    class MyEffect {
        constructor() {
            // Khởi tạo hiệu ứng (tạo DOM, bắt đầu animation)
            this.init();
        }
        init() { /* ... */ }
        destroy() {
            // Xóa bỏ hiệu ứng hoàn toàn khi theme bị tắt
            // Dừng requestAnimationFrame, xóa DOM element, v.v.
        }
    }

    window.MyNewEffect = new MyEffect();
})();
```

### Bước 2: Đăng ký trong themes_data.json
Thêm thông tin theme vào mảng `themes` trong file `data/themes/themes_data.json`:

```json
{
  "id": "rain",
  "name": "Hiệu ứng mưa",
  "description": "Hiệu ứng mưa rơi nhẹ nhàng",
  "icon": "🌧️",
  "script": "./rain-effect/rain-effect.js",
  "enabled": false
}
```
*Lưu ý: Đường dẫn `script` được tính tương đối từ vị trí của file `themes-loader.js`.*

### Bước 3: Cập nhật hàm hủy (Cleanup) trong themes-loader.js (Tùy chọn)
Để hỗ trợ việc tắt theme ngay lập tức khi gạt switch trong Admin mà không cần F5, hãy thêm logic hủy vào listener `themeStateChanged` trong `themes/themes-loader.js`:

```javascript
} else if (!enabled && existingScript) {
    if (window.MyNewEffect && themeId === 'rain') {
        window.MyNewEffect.destroy();
    }
    existingScript.remove();
}
```

## Cấu trúc thư mục

- `data/themes/themes_data.json`: **Nguồn dữ liệu duy nhất** chứa danh sách và trạng thái mặc định của các theme.
- `themes/themes-loader.js`: Bộ nạp logic chính cho phía người dùng cuối.
- `assets/js/admin/themes-manager.js`: Logic xử lý giao diện quản lý phía Admin.
- `admin_pages/themes.html`: Giao diện quản lý themes.

---

# Themes Management System (English)

A system for managing themes and effects for your website, allowing you to enable/disable effects from the Admin Panel. It uses a centralized JSON configuration for easy scalability.

## How to Use

### 1. Embed the theme into Your Website

Simply add a line of script to the `<head>` or before the `</body>` tag:

```html
<script src="themes/themes-loader.js"></script>
```

`themes-loader.js` will automatically:
1. Load the list of themes from `data/themes/themes_data.json`.
2. Check the enable/disable state in `localStorage` (user settings) or use the default from the JSON file.
3. Automatically load the corresponding theme scripts.

### 2. Managing Themes from the Admin Panel

1. Go to the Theme Management page in Admin: `/admin_pages/themes.html`.
2. Use the Toggle Switches to enable or disable effects.
3. Changes are saved to `localStorage` and applied immediately across all open tabs without a page reload.

## Adding a New Theme

To add a new effect to the system, follow these steps:

### Step 1: Create the Theme Script
Create a script file in the `themes/` directory (or a subdirectory), e.g., `themes/rain-effect/rain-effect.js`.

To ensure the theme supports real-time toggling without a refresh, use the following structure:

```javascript
(function() {
    if (window.MyNewEffect) return;

    class MyEffect {
        constructor() {
            this.init();
        }
        init() { /* ... */ }
        destroy() {
            // Completely remove the effect when disabled
            // Stop animations, remove DOM elements, etc.
        }
    }

    window.MyNewEffect = new MyEffect();
})();
```

### Step 2: Register in themes_data.json
Add the theme entry to the `themes` array in `data/themes/themes_data.json`:

```json
{
  "id": "rain",
  "name": "Rain Effect",
  "description": "Gentle rainfall effect",
  "icon": "🌧️",
  "script": "./rain-effect/rain-effect.js",
  "enabled": false
}
```
*Note: The `script` path is relative to the location of `themes-loader.js`.*

### Step 3: Update Cleanup logic in themes-loader.js (Optional)
To support immediate removal when toggled off in Admin, add cleanup logic to the `themeStateChanged` listener in `themes/themes-loader.js`:

```javascript
} else if (!enabled && existingScript) {
    if (window.MyNewEffect && themeId === 'rain') {
        window.MyNewEffect.destroy();
    }
    existingScript.remove();
}
```

## Directory Structure

- `data/themes/themes_data.json`: **Single source of truth** for theme listing and default states.
- `themes/themes-loader.js`: Main loader for the frontend.
- `assets/js/admin/themes-manager.js`: Logic for the Admin Management UI.
- `admin_pages/themes.html`: Admin management interface.