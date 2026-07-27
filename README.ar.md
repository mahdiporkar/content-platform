# مجموعات فيديوهات تعليمية متعددة اللغات

تدعم منصة المحتوى مجموعات الفيديوهات التعليمية من دون رفع ملف الفيديو أو
تخزينه أكثر من مرة. يشير محتوى Video إلى ملف واحد في Media Library، ويمكن
إضافته إلى مجموعة واحدة أو عدة مجموعات.

يتم تعريف المجموعة بشكل فريد باستخدام:

```text
applicationId + slug + locale
```

لذلك يمكن استخدام المفتاح الثابت نفسه للمجموعات الفارسية والإنجليزية
والعربية:

```text
educational-videos
```

يختار الخادم المجموعة المطابقة لقيمة `locale` في الطلب. وإذا لم توجد نسخة
باللغة المطلوبة، يستخدم المجموعة العامة ذات اللغة `und` إن وجدت.

يتم تحديد أماكن ظهور الفيديو بواسطة `displayScopes`:

```json
["educational-videos"]
```

يعرض معرض الفيديو العام العناصر التي تحتوي على `video-gallery`. وتظل
الفيديوهات القديمة التي لا تحتوي على scopes ظاهرة للتوافق مع البيانات
السابقة. عند إضافة فيديو إلى مجموعة تحتوي على
`metadata.defaultDisplayScopes = ["educational-videos"]` يتم تطبيق النطاق
التعليمي وإزالة نطاق المعرض الافتراضي، ويمكن للمحرر إضافة النطاقين لاحقاً.

واجهات التسليم العامة:

```http
GET /api/v1/content/collections/:collectionKey/items?locale=ar&page=1&pageSize=12
GET /api/v1/content/collections/:collectionKey/items/:videoSlug?locale=ar
```

تتطلب الواجهات ترويسات Application ID وApplication Token الحالية. ويتم تقييد
النتائج حسب التطبيق واللغة وحالة النشر وتفعيل عنصر المجموعة وفترة الجدولة.

التشغيل:

```bash
cd backend-nestjs
npm run migration:run
npm test
npm run build
```
