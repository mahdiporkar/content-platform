# content-platform

پلتفرم چندمستاجری مدیریت محتوا با PostgreSQL و MinIO، همراه با پنل مدیریت React و اپلیکیشن مصرف‌کننده نمونه.

[English](README.md)

![Architecture Diagram](./docs/architecture.png)

## سرویس‌های زمان اجرا

- Backend API: `http://localhost:3001`
- Admin UI: `http://localhost:5173`
- Demo UI: `http://localhost:3003`
- PostgreSQL: `localhost:5432`
- MinIO API: `localhost:9000`
- MinIO Console: `localhost:9001`

## معماری دسترسی محتوا

این پلتفرم multi-tenant است. هر tenant یا پروژه مصرف‌کننده با یک `applicationId` شناخته می‌شود.

### پنل مدیریت

- کاربر ادمین با Bearer JWT وارد پنل مدیریت می‌شود.
- هر ادمین می‌تواند به یک یا چند application دسترسی داشته باشد.
- کاربران غیر super admin فقط محتوای applicationهای مجاز خودشان را مدیریت می‌کنند.
- محتوا، رسانه‌ها، کالکشن‌ها، تنظیمات sitemap، آنالیتیکس و رکوردهای audit با `applicationId` مالک ذخیره می‌شوند.

### سمت سرور پروژه مصرف‌کننده

پروژه مصرف‌کننده نباید credentialهای content-platform را به مرورگر کاربر بدهد. این مقادیر باید فقط سمت سرور نگهداری شوند:

```bash
CONTENT_PLATFORM_API_BASE_URL=http://localhost:3001
CONTENT_PLATFORM_APPLICATION_ID=<application-id>
CONTENT_PLATFORM_API_TOKEN=<application-token>
```

سرور مصرف‌کننده محتوای منتشرشده را با این headerها دریافت می‌کند:

```http
X-Application-Id: <application-id>
X-Application-Token: <application-token>
```

توکن application تا وقتی rotate یا revoke نشود معتبر می‌ماند:

```http
POST /api/v1/admin/applications/{id}/token/rotate
POST /api/v1/admin/applications/{id}/token/revoke
```

## صفحه‌ها و منوها

فیچر صفحه و منو برای مدیریت routeهای سایت مصرف‌کننده از داخل content-platform استفاده می‌شود. این فیچر در هر دو نسخه backend، یعنی NestJS و Java، با contract یکسان پیاده‌سازی شده تا پنل ادمین بتواند بدون تغییر با هر دو کار کند.

از Page برای مسیرهای مستقل سایت استفاده کنید، مثل:

- `/fa/about`
- `/fa/contact`
- `/fa/about-me-2`
- `/en/about`

از Menu برای تعریف ساختار navigation سایت استفاده کنید. آیتم منو می‌تواند به route ثابت، صفحه مدیریت‌شده، مقاله، پست، گالری یا لینک خارجی اشاره کند.

مزیت اصلی این مدل این است که اگر تیم frontend فردا یک component جدید برای مسیری مثل `/fa/about-me-2` بسازد، لازم نیست کد منو تغییر کند. ادمین وارد بخش مدیریت منو در content-platform می‌شود، route جدید را تعریف می‌کند و پروژه مصرف‌کننده آن را از API منو دریافت می‌کند.

در خروجی API عمومی منو، هر آیتم یک فیلد `dynamic` دارد:

- `dynamic: false`: مسیر یک route عادی در پروژه مصرف‌کننده است.
- `dynamic: true`: محتوای این route باید از content-platform دریافت شود و داخل layout و style یکپارچه پروژه مصرف‌کننده نمایش داده شود.

### APIهای مدیریت صفحه

```http
POST /api/v1/admin/pages
PUT /api/v1/admin/pages/{id}
PATCH /api/v1/admin/pages/{id}/status
GET /api/v1/admin/pages/{id}
GET /api/v1/admin/pages?applicationId={applicationId}
```

### APIهای مدیریت منو

```http
POST /api/v1/admin/menus
PUT /api/v1/admin/menus/{id}
PATCH /api/v1/admin/menus/{id}/status
DELETE /api/v1/admin/menus/{id}
GET /api/v1/admin/menus/{id}
GET /api/v1/admin/menus?applicationId={applicationId}
POST /api/v1/admin/menus/{id}/items
PUT /api/v1/admin/menus/{id}/items/layout
PUT /api/v1/admin/menus/{id}/items/{itemId}
DELETE /api/v1/admin/menus/{id}/items/{itemId}
GET /api/v1/admin/menus/{id}/published-content
POST /api/v1/admin/menus/{id}/sync-published
```

### APIهای عمومی صفحه و منو

```http
GET /api/v1/content/pages
GET /api/v1/content/pages/slugs
GET /api/v1/content/pages/{languageCode}/{slug}
GET /api/v1/content/menus/location/{languageCode}/{location}
GET /api/v1/content/menus/{languageCode}/{code}
```

این APIها همان headerهای consumer delivery را می‌خواهند:

```http
X-Application-Id: <application-id>
X-Application-Token: <application-token>
```

## کالکشن‌ها

Collection برای چیدمان دستی و editorial محتوا در یک application استفاده می‌شود. به جای ساخت مفهوم‌های جدا مثل slider، hero، carousel، banner یا featured block، همه این‌ها با collection و `presentation.type` نمایش داده می‌شوند.

نمونه‌ها:

- `homepage-featured`
- `main-slider`
- `recommended-posts`
- `landing-hero`
- `landing-banner`

دریافت کالکشن از delivery API:

```http
GET /api/v1/content?collection=homepage-featured
GET /api/v1/content/collections/homepage-featured
```

## پروکسی رسانه

MinIO storage خصوصی است و نباید URL مستقیم MinIO به مرورگر داده شود. URL رسانه‌ها باید از backend proxy عبور کند:

```http
http://localhost:3001/media/{applicationId}/...
```

برای URL عمومی backend/proxy:

```bash
CONTENT_PLATFORM_BASE_URL=http://localhost:3001
PUBLIC_BASE_URL=http://localhost:3001
MEDIA_BASE_PATH=/media
```

## تنظیمات CORS

دامنه‌های مجاز پنل مدیریت را به‌صورت comma-separated تعریف کنید:

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3002,http://localhost:5173
```

نمونه Production:

```bash
CORS_ALLOWED_ORIGINS=https://cms.magigateac.com
```

درخواست‌های بدون هدر `Origin` مانند curl و health check مجاز می‌مانند. در production، اگر `CORS_ALLOWED_ORIGINS` تعریف نشده باشد، درخواست‌های cross-origin مرورگر رد می‌شوند.

## راه‌اندازی سریع

```bash
npm run dev:all
```

یا با Docker:

```bash
docker compose up --build
```
