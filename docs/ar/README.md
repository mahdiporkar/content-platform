# توثيق Content Platform

[English](../en/README.md) · [فارسی](../fa/README.md) · [العربية](README.md)

Content Platform بنية محتوى متعددة المستأجرين ومبنية على API باستخدام NestJS وPostgreSQL وMinIO وReact وNext.js. يخدم تثبيت واحد مواقع وتطبيقات متعددة بأمان.

![العرض المباشر لمنصة Content Platform](../assets/content-platform-demo.png)

## الإمكانات

- منشورات ومقالات وصفحات وصور ومعارض وفيديو
- مجموعات مرتبة للأبطال والمنزلقات والشبكات واللافتات والتوصيات
- توزيع المحتوى بالعربية والفارسية والإنجليزية
- مستخدمون وصلاحيات وتطبيقات ورموز قابلة للإلغاء لكل مستأجر
- نسخ وسائط ووصول موقّع وتتبع المراجع وحذف آمن
- جدولة وتدقيق وتحليلات وSEO وخرائط الموقع
- استوديو React وعرض Next.js من الخادم

## البدء السريع

```bash
cp .env.example .env
docker compose -f docker-compose.nestjs.yml up --build
```

تتوفر API على `http://localhost:3001`، والإدارة على `http://localhost:3002`، والعرض على `http://localhost:3003`، وMinIO على `http://localhost:9001`.

للتطوير المحلي:

```bash
npm install
npm --prefix backend-nestjs run migration:run
npm run dev:all
```

## وضع العرض التفاعلي

فعّل `DEMO_MODE=true` في خادم مخصص للعرض. يسمي الزائر التطبيق في شاشة دخول الاستوديو ويحصل على مساحة عمل معزولة من دون كلمة مرور مشتركة. يملك الحساب صلاحيات إدارة المحتوى كلها، لكنه لا يصل إلا إلى تطبيقه ولا يستطيع إنشاء مستأجري المنصة أو حذفهم.

بعد النشر، ينقل زر **View live site** بيانات التوزيع عبر fragment في المتصفح، ويحذفها فوراً من شريط العنوان ويحفظها في ملفات HTTP-only. تنتهي المساحة بعد `DEMO_SESSION_TTL_HOURS`، ويقتصر الإنشاء على ثلاث مساحات لكل IP في الساعة.

```env
DEMO_MODE=true
VITE_DEMO_MODE=true
DEMO_SESSION_TTL_HOURS=12
VITE_DEMO_SITE_URL=https://demo.example.com
ADMIN_PUBLIC_URL=https://studio.example.com
```

## التوزيع الآمن

تبقى بيانات الاعتماد على خادم المستهلك. لا تعرض رمز التطبيق في شيفرة المتصفح.

```http
GET /api/v1/content/posts?locale=ar&page=1&pageSize=12
X-Application-Id: <application-id>
X-Application-Token: <application-token>
```

## سير العمل

1. ينشئ مدير النظام تطبيقاً ويعيّن المحررين.
2. ينشئ المحررون المحتوى المحلي والوسائط والمجموعات.
3. ينتقل المحتوى من المسودة إلى المجدول والمنشور.
4. يجلب خادم المستهلك المحتوى المنشور بالرمز.
5. تسجل التحليلات والتدقيق المشاهدات والتغييرات.

## النشر

انسخ `.env.example` واستخدم أسراراً قوية. مع CapRover أضف `CAPROVER_URL` و`CAPROVER_PASSWORD` إلى أسرار GitHub Actions وشغّل workflow. اربط نطاقات HTTPS بواجهة API والإدارة والعرض.

راجع [البنية](../architecture/README.md)، [التوزيع](../swagger-content-delivery.md)، [حذف الوسائط الآمن](../safe-media-deletion.md)، و[الأمان](../../backend-nestjs/docs/security.md).
