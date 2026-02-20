import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SupportedLocale = "en" | "fa" | "ar" | "zh" | "ru";
type Direction = "ltr" | "rtl";

type Dictionary = Record<string, string>;

const messages: Record<SupportedLocale, Dictionary> = {
  en: {
    "app.brand": "Content Platform",
    "app.console": "Admin Console",
    "app.language": "Language",
    "app.tenant": "Tenant",
    "app.notSet": "Not set",
    "app.applicationId": "Application ID",
    "app.applicationPlaceholder": "Enter app UUID",
    "app.setApplication": "Set Application",
    "app.noAccessibleApplications": "No accessible applications",
    "app.logout": "Logout",
    "menu.applications": "Applications",
    "menu.users": "Users",
    "menu.collections": "Collections",
    "menu.posts": "Posts",
    "menu.articles": "Articles",
    "menu.videos": "Videos",
    "menu.images": "Images",
    "menu.analytics": "Analytics",
    "editor.loading": "Loading editor...",
    "editor.color": "Color",
    "editor.mediaTitle": "Media and attachments",
    "editor.mediaHint": "Upload assets and insert them into the content.",
    "editor.addImage": "Add image",
    "editor.addVideo": "Add video",
    "editor.attachFile": "Attach file",
    "editor.uploading": "Uploading...",
    "editor.placeholder": "Start writing. Tip: paste images or drag and drop files here.",
    "editor.selectSize": "Select size",
    "editor.more": "More...",
    "editor.reset": "Reset",
    "editor.table": "Table",
    "editor.imageSize": "Image size",
    "editor.imageAlign": "Image align",
    "editor.videoAlign": "Video align",
    "editor.wrapText": "Wrap text",
    "editor.wrapVideo": "Wrap video",
    "editor.tableLayout": "Table layout",
    "editor.sideBySide": "Side by side",
    "editor.sideLeft": "Media left",
    "editor.sideRight": "Media right",
    "editor.clearWrap": "Clear wrap",
    "editor.inlineRight": "Inline right",
    "editor.inlineLeft": "Inline left",
    "editor.noWrap": "No wrap",
    "editor.linkTitle": "Link",
    "editor.linkPlaceholder": "https://example.com",
    "editor.openNewTab": "Open in new tab",
    "editor.removeLink": "Remove link",
    "editor.addLink": "Add link",
    "editor.updateLink": "Update link",
    "editor.insertTable": "Insert table",
    "editor.insert": "Insert",
    "editor.rows": "Rows",
    "editor.cols": "Cols",
    "editor.addRow": "+ Row",
    "editor.addCol": "+ Col",
    "editor.resizeHint": "Drag corners to resize",
    "error.appIdRequiredUpload": "Application ID is required before uploading media.",
    "error.uploadFailed": "Media upload failed. Check your connection and try again."
  },
  fa: {
    "app.brand": "پلتفرم محتوا",
    "app.console": "پنل مدیریت",
    "app.language": "زبان",
    "app.tenant": "تِنت",
    "app.notSet": "تنظیم نشده",
    "app.applicationId": "شناسه اپلیکیشن",
    "app.applicationPlaceholder": "UUID اپ را وارد کنید",
    "app.setApplication": "ثبت اپلیکیشن",
    "app.noAccessibleApplications": "اپلیکیشن قابل دسترسی وجود ندارد",
    "app.logout": "خروج",
    "menu.applications": "اپلیکیشن‌ها",
    "menu.users": "کاربران",
    "menu.collections": "کالکشن‌ها",
    "menu.posts": "پست‌ها",
    "menu.articles": "مقاله‌ها",
    "menu.videos": "ویدیوها",
    "menu.images": "تصاویر",
    "menu.analytics": "آنالیتیکس",
    "editor.loading": "در حال بارگذاری ادیتور...",
    "editor.color": "رنگ",
    "editor.mediaTitle": "رسانه و فایل‌ها",
    "editor.mediaHint": "فایل‌ها را آپلود کنید و داخل محتوا قرار دهید.",
    "editor.addImage": "افزودن تصویر",
    "editor.addVideo": "افزودن ویدیو",
    "editor.attachFile": "پیوست فایل",
    "editor.uploading": "در حال آپلود...",
    "editor.placeholder": "نوشتن را شروع کنید. نکته: تصویر را Paste کنید یا فایل را بکشید و رها کنید.",
    "editor.selectSize": "انتخاب اندازه",
    "editor.more": "بیشتر...",
    "editor.reset": "بازنشانی",
    "editor.table": "جدول",
    "editor.imageSize": "اندازه تصویر",
    "editor.imageAlign": "تراز تصویر",
    "editor.videoAlign": "تراز ویدیو",
    "editor.wrapText": "چیدمان کنار متن",
    "editor.wrapVideo": "چیدمان ویدیو",
    "editor.tableLayout": "چیدمان جدول",
    "editor.sideBySide": "کنار محتوا",
    "editor.sideLeft": "رسانه چپ",
    "editor.sideRight": "رسانه راست",
    "editor.clearWrap": "حذف چیدمان",
    "editor.inlineRight": "جدول راست",
    "editor.inlineLeft": "جدول چپ",
    "editor.noWrap": "بدون چیدمان",
    "editor.linkTitle": "لینک",
    "editor.linkPlaceholder": "https://example.com",
    "editor.openNewTab": "باز شدن در تب جدید",
    "editor.removeLink": "حذف لینک",
    "editor.addLink": "افزودن لینک",
    "editor.updateLink": "به‌روزرسانی لینک",
    "editor.insertTable": "افزودن جدول",
    "editor.insert": "درج",
    "editor.rows": "ردیف",
    "editor.cols": "ستون",
    "editor.addRow": "+ ردیف",
    "editor.addCol": "+ ستون",
    "editor.resizeHint": "برای تغییر اندازه گوشه‌ها را بکشید",
    "error.appIdRequiredUpload": "برای آپلود رسانه، شناسه اپلیکیشن لازم است.",
    "error.uploadFailed": "آپلود رسانه ناموفق بود. اتصال را بررسی کنید و دوباره تلاش کنید."
  },
  ar: {
    "app.brand": "منصة المحتوى",
    "app.console": "لوحة الإدارة",
    "app.language": "اللغة",
    "app.tenant": "المستأجر",
    "app.notSet": "غير محدد",
    "app.applicationId": "معرف التطبيق",
    "app.applicationPlaceholder": "أدخل UUID التطبيق",
    "app.setApplication": "تعيين التطبيق",
    "app.noAccessibleApplications": "لا توجد تطبيقات متاحة",
    "app.logout": "تسجيل الخروج",
    "menu.applications": "التطبيقات",
    "menu.users": "المستخدمون",
    "menu.collections": "المجموعات",
    "menu.posts": "المنشورات",
    "menu.articles": "المقالات",
    "menu.videos": "الفيديوهات",
    "menu.images": "الصور",
    "menu.analytics": "التحليلات",
    "editor.loading": "جارٍ تحميل المحرر...",
    "editor.color": "اللون",
    "editor.mediaTitle": "الوسائط والمرفقات",
    "editor.mediaHint": "ارفع الملفات وأدرجها داخل المحتوى.",
    "editor.addImage": "إضافة صورة",
    "editor.addVideo": "إضافة فيديو",
    "editor.attachFile": "إرفاق ملف",
    "editor.uploading": "جارٍ الرفع...",
    "editor.placeholder": "ابدأ الكتابة. يمكنك لصق الصور أو سحب الملفات وإفلاتها هنا.",
    "editor.selectSize": "اختر الحجم",
    "editor.more": "المزيد...",
    "editor.reset": "إعادة ضبط",
    "editor.table": "الجدول",
    "editor.imageSize": "حجم الصورة",
    "editor.imageAlign": "محاذاة الصورة",
    "editor.videoAlign": "محاذاة الفيديو",
    "editor.wrapText": "التفاف النص",
    "editor.wrapVideo": "التفاف الفيديو",
    "editor.tableLayout": "تخطيط الجدول",
    "editor.sideBySide": "جنبًا إلى جنب",
    "editor.sideLeft": "الوسائط يسار",
    "editor.sideRight": "الوسائط يمين",
    "editor.clearWrap": "إلغاء الالتفاف",
    "editor.inlineRight": "الجدول يمين",
    "editor.inlineLeft": "الجدول يسار",
    "editor.noWrap": "بدون التفاف",
    "editor.linkTitle": "رابط",
    "editor.linkPlaceholder": "https://example.com",
    "editor.openNewTab": "فتح في علامة تبويب جديدة",
    "editor.removeLink": "إزالة الرابط",
    "editor.addLink": "إضافة رابط",
    "editor.updateLink": "تحديث الرابط",
    "editor.insertTable": "إدراج جدول",
    "editor.insert": "إدراج",
    "editor.rows": "الصفوف",
    "editor.cols": "الأعمدة",
    "editor.addRow": "+ صف",
    "editor.addCol": "+ عمود",
    "editor.resizeHint": "اسحب الزوايا لتغيير الحجم",
    "error.appIdRequiredUpload": "معرف التطبيق مطلوب قبل رفع الوسائط.",
    "error.uploadFailed": "فشل رفع الوسائط. تحقق من الاتصال وحاول مرة أخرى."
  },
  zh: {
    "app.brand": "内容平台",
    "app.console": "管理控制台",
    "app.language": "语言",
    "app.tenant": "租户",
    "app.notSet": "未设置",
    "app.applicationId": "应用 ID",
    "app.applicationPlaceholder": "输入应用 UUID",
    "app.setApplication": "设置应用",
    "app.noAccessibleApplications": "没有可访问的应用",
    "app.logout": "退出登录",
    "menu.applications": "应用",
    "menu.users": "用户",
    "menu.collections": "集合",
    "menu.posts": "帖子",
    "menu.articles": "文章",
    "menu.videos": "视频",
    "menu.images": "图片",
    "menu.analytics": "分析",
    "editor.loading": "编辑器加载中...",
    "editor.color": "颜色",
    "editor.mediaTitle": "媒体与附件",
    "editor.mediaHint": "上传资源并插入到内容中。",
    "editor.addImage": "添加图片",
    "editor.addVideo": "添加视频",
    "editor.attachFile": "附加文件",
    "editor.uploading": "上传中...",
    "editor.placeholder": "开始输入。提示：可粘贴图片或拖拽文件到这里。",
    "editor.selectSize": "选择尺寸",
    "editor.more": "更多...",
    "editor.reset": "重置",
    "editor.table": "表格",
    "editor.imageSize": "图片尺寸",
    "editor.imageAlign": "图片对齐",
    "editor.videoAlign": "视频对齐",
    "editor.wrapText": "文字环绕",
    "editor.wrapVideo": "视频环绕",
    "editor.tableLayout": "表格布局",
    "editor.sideBySide": "并排布局",
    "editor.sideLeft": "媒体靠左",
    "editor.sideRight": "媒体靠右",
    "editor.clearWrap": "取消环绕",
    "editor.inlineRight": "表格靠右",
    "editor.inlineLeft": "表格靠左",
    "editor.noWrap": "不环绕",
    "editor.linkTitle": "链接",
    "editor.linkPlaceholder": "https://example.com",
    "editor.openNewTab": "在新标签页打开",
    "editor.removeLink": "移除链接",
    "editor.addLink": "添加链接",
    "editor.updateLink": "更新链接",
    "editor.insertTable": "插入表格",
    "editor.insert": "插入",
    "editor.rows": "行",
    "editor.cols": "列",
    "editor.addRow": "+ 行",
    "editor.addCol": "+ 列",
    "editor.resizeHint": "拖动角点调整大小",
    "error.appIdRequiredUpload": "上传媒体前需要应用 ID。",
    "error.uploadFailed": "媒体上传失败，请检查网络后重试。"
  },
  ru: {
    "app.brand": "Контент-платформа",
    "app.console": "Панель администратора",
    "app.language": "Язык",
    "app.tenant": "Тенант",
    "app.notSet": "Не задан",
    "app.applicationId": "ID приложения",
    "app.applicationPlaceholder": "Введите UUID приложения",
    "app.setApplication": "Применить приложение",
    "app.noAccessibleApplications": "Нет доступных приложений",
    "app.logout": "Выйти",
    "menu.applications": "Приложения",
    "menu.users": "Пользователи",
    "menu.collections": "Коллекции",
    "menu.posts": "Посты",
    "menu.articles": "Статьи",
    "menu.videos": "Видео",
    "menu.images": "Изображения",
    "menu.analytics": "Аналитика",
    "editor.loading": "Редактор загружается...",
    "editor.color": "Цвет",
    "editor.mediaTitle": "Медиа и вложения",
    "editor.mediaHint": "Загрузите файлы и вставьте их в контент.",
    "editor.addImage": "Добавить изображение",
    "editor.addVideo": "Добавить видео",
    "editor.attachFile": "Прикрепить файл",
    "editor.uploading": "Загрузка...",
    "editor.placeholder": "Начните писать. Подсказка: вставляйте изображения или перетаскивайте файлы сюда.",
    "editor.selectSize": "Выберите размер",
    "editor.more": "Еще...",
    "editor.reset": "Сброс",
    "editor.table": "Таблица",
    "editor.imageSize": "Размер изображения",
    "editor.imageAlign": "Выравнивание изображения",
    "editor.videoAlign": "Выравнивание видео",
    "editor.wrapText": "Обтекание текстом",
    "editor.wrapVideo": "Обтекание видео",
    "editor.tableLayout": "Макет таблицы",
    "editor.sideBySide": "Рядом с текстом",
    "editor.sideLeft": "Медиа слева",
    "editor.sideRight": "Медиа справа",
    "editor.clearWrap": "Сброс обтекания",
    "editor.inlineRight": "Таблица справа",
    "editor.inlineLeft": "Таблица слева",
    "editor.noWrap": "Без обтекания",
    "editor.linkTitle": "Ссылка",
    "editor.linkPlaceholder": "https://example.com",
    "editor.openNewTab": "Открывать в новой вкладке",
    "editor.removeLink": "Удалить ссылку",
    "editor.addLink": "Добавить ссылку",
    "editor.updateLink": "Обновить ссылку",
    "editor.insertTable": "Вставить таблицу",
    "editor.insert": "Вставить",
    "editor.rows": "Строки",
    "editor.cols": "Колонки",
    "editor.addRow": "+ Строка",
    "editor.addCol": "+ Колонка",
    "editor.resizeHint": "Тяните углы для изменения размера",
    "error.appIdRequiredUpload": "Перед загрузкой медиа нужен ID приложения.",
    "error.uploadFailed": "Не удалось загрузить медиа. Проверьте соединение и повторите попытку."
  }
};

const directions: Record<SupportedLocale, Direction> = {
  en: "ltr",
  fa: "rtl",
  ar: "rtl",
  zh: "ltr",
  ru: "ltr"
};

const localeStorageKey = "admin.locale";

type I18nContextValue = {
  locale: SupportedLocale;
  direction: Direction;
  setLocale: (next: SupportedLocale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const saved = window.localStorage.getItem(localeStorageKey);
    if (saved && saved in messages) {
      return saved as SupportedLocale;
    }
    return "en";
  });

  const setLocale = (next: SupportedLocale) => {
    setLocaleState(next);
    window.localStorage.setItem(localeStorageKey, next);
  };

  const direction = directions[locale];

  useEffect(() => {
    document.documentElement.setAttribute("dir", direction);
    document.documentElement.setAttribute("lang", locale);
    document.body.setAttribute("dir", direction);
  }, [direction, locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      direction,
      setLocale,
      t: (key: string) => messages[locale][key] ?? messages.en[key] ?? key
    }),
    [locale, direction]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return value;
};
