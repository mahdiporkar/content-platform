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
