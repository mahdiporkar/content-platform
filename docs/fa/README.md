# مستندات Content Platform

[English](../en/README.md) · [فارسی](README.md) · [العربية](../ar/README.md)

Content Platform یک زیرساخت چندمستاجری و API-first برای مدیریت محتواست که با NestJS، PostgreSQL، MinIO، React و Next.js ساخته شده است. یک نصب می‌تواند چندین وب‌سایت و اپلیکیشن را امن تغذیه کند.

![نمای زنده Content Platform](../assets/content-platform-demo.png)

## امکانات

- پست، مقاله، صفحه، تصویر، گالری و ویدئو
- مجموعه‌های مرتب برای هیرو، اسلایدر، گرید، بنر و پیشنهادها
- تحویل محتوای فارسی، انگلیسی و عربی
- کاربران، مجوزها، اپلیکیشن‌ها و توکن‌های قابل ابطال برای هر مستاجر
- نسخه‌های رسانه، دسترسی امضاشده، ردیابی مرجع و حذف امن
- زمان‌بندی، گزارش ممیزی، تحلیل، SEO و مدیریت sitemap
- پنل مدیریت React و دموی SSR با Next.js

## راه‌اندازی سریع

```bash
cp .env.example .env
docker compose -f docker-compose.nestjs.yml up --build
```

API روی `http://localhost:3001`، پنل مدیریت روی `http://localhost:3002`، دمو روی `http://localhost:3003` و MinIO روی `http://localhost:9001` است.

برای توسعه‌ی مستقیم:

```bash
npm install
npm --prefix backend-nestjs run migration:run
npm run dev:all
```

## حالت دموی تعاملی

در یک سرور اختصاصی دمو، `DEMO_MODE=true` را تنظیم کنید. بازدیدکننده در صفحه ورود پنل نام Application را وارد می‌کند و بدون رمز مشترک یک Workspace ایزوله می‌سازد. حساب ساخته‌شده همه‌ی مجوزهای مدیریت محتوا را دارد، اما فقط به همان Application دسترسی دارد و نمی‌تواند مستاجرهای پلتفرم را ایجاد یا حذف کند.

بعد از انتشار محتوا، دکمه‌ی **View live site** اطلاعات تحویل را از طریق fragment مرورگر منتقل می‌کند، فوراً آن را از نوار آدرس حذف می‌کند و در cookieهای HTTP-only قرار می‌دهد. Workspace بعد از `DEMO_SESSION_TTL_HOURS` منقضی می‌شود و هر IP حداکثر سه Workspace در ساعت می‌سازد.

```env
DEMO_MODE=true
VITE_DEMO_MODE=true
DEMO_SESSION_TTL_HOURS=12
VITE_DEMO_SITE_URL=https://demo.example.com
ADMIN_PUBLIC_URL=https://studio.example.com
```

## تحویل امن

اطلاعات دسترسی فقط روی سرور مصرف‌کننده می‌ماند. توکن اپلیکیشن را در کد مرورگر قرار ندهید.

```http
GET /api/v1/content/posts?locale=fa&page=1&pageSize=12
X-Application-Id: <application-id>
X-Application-Token: <application-token>
```

## گردش کار

1. مدیر سیستم اپلیکیشن را می‌سازد و ویراستارها را تعیین می‌کند.
2. ویراستار محتوای بومی، رسانه و مجموعه‌ها را می‌سازد.
3. محتوا از پیش‌نویس به زمان‌بندی‌شده و منتشرشده می‌رود.
4. سرور مصرف‌کننده محتوای منتشرشده را با توکن دریافت می‌کند.
5. تحلیل‌ها و گزارش ممیزی، بازدید و تغییرات را ثبت می‌کنند.

## استقرار

فایل `.env.example` را کپی و رمزهای قوی تنظیم کنید. برای CapRover، Secretهای `CAPROVER_URL` و `CAPROVER_PASSWORD` را در GitHub Actions قرار دهید و workflow را اجرا کنید. برای API، پنل و دمو دامنه‌ی HTTPS تنظیم کنید.

منابع: [معماری](../architecture/README.md)، [تحویل محتوا](../swagger-content-delivery.md)، [حذف امن رسانه](../safe-media-deletion.md) و [امنیت](../../backend-nestjs/docs/security.md).
