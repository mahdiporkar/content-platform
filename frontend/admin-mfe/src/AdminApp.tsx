import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import faIR from "antd/locale/fa_IR";
import arEG from "antd/locale/ar_EG";
import zhCN from "antd/locale/zh_CN";
import ruRU from "antd/locale/ru_RU";
import { authStore, canAccessRoute, getDefaultAdminRoute } from "./app/auth";
import { TenantProvider } from "./app/tenant";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { PostsListPage } from "./features/posts/PostsListPage";
import { PostEditorPage } from "./features/posts/PostEditorPage";
import { ArticlesListPage } from "./features/articles/ArticlesListPage";
import { ArticleEditorPage } from "./features/articles/ArticleEditorPage";
import { PagesListPage } from "./features/pages/PagesListPage";
import { PageEditorPage } from "./features/pages/PageEditorPage";
import { MenusListPage } from "./features/menus/MenusListPage";
import { MenuEditorPage } from "./features/menus/MenuEditorPage";
import { GalleriesListPage } from "./features/galleries/GalleriesListPage";
import { GalleryEditorPage } from "./features/galleries/GalleryEditorPage";
import { VideoListPage } from "./features/videos/VideoListPage";
import { VideoEditorPage } from "./features/videos/VideoEditorPage";
import { VideoUploadPage } from "./features/videos/VideoUploadPage";
import { ApplicationsListPage } from "./features/applications/ApplicationsListPage";
import { ApplicationEditorPage } from "./features/applications/ApplicationEditorPage";
import { UsersListPage } from "./features/users/UsersListPage";
import { CollectionsListPage } from "./features/collections/CollectionsListPage";
import { CollectionEditorPage } from "./features/collections/CollectionEditorPage";
import { ImagesListPage } from "./features/images/ImagesListPage";
import { ImageEditorPage } from "./features/images/ImageEditorPage";
import { AnalyticsDashboardPage } from "./features/analytics/AnalyticsDashboardPage";
import { MediaLibraryPage } from "./features/media/MediaLibraryPage";
import { MediaSafetyPage } from "./features/media/MediaSafetyPage";
import { MediaVariantsPage } from "./features/media/MediaVariantsPage";
import { SitemapPage } from "./features/sitemap/SitemapPage";
import { I18nProvider, type SupportedLocale, useI18n } from "./i18n";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const token = authStore.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const RequireRouteAccess = ({ route, children }: { route: string; children: React.ReactNode }) => {
  const payload = authStore.getTokenPayload();
  if (!canAccessRoute(payload, route)) {
    const defaultRoute = getDefaultAdminRoute(payload);
    return <Navigate to={defaultRoute === "login" ? "/login" : `/${defaultRoute}`} replace />;
  }
  return <>{children}</>;
};

const AuthorizedIndex = () => {
  const defaultRoute = getDefaultAdminRoute(authStore.getTokenPayload());
  return <Navigate to={defaultRoute === "login" ? "/login" : `/${defaultRoute}`} replace />;
};

export const AdminApp = () => {
  return (
    <I18nProvider>
      <LocalizedAdminApp />
    </I18nProvider>
  );
};

const antLocales: Record<SupportedLocale, typeof enUS> = {
  en: enUS,
  fa: faIR,
  ar: arEG,
  zh: zhCN,
  ru: ruRU
};

const LocalizedAdminApp = () => {
  const { locale, direction } = useI18n();
  const protect = (route: string, element: React.ReactNode) => (
    <RequireRouteAccess route={route}>{element}</RequireRouteAccess>
  );

  return (
    <ConfigProvider
      locale={antLocales[locale]}
      direction={direction}
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
          fontSize: 14
        }
      }}
    >
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<AuthorizedIndex />} />
              <Route path="applications" element={protect("applications", <ApplicationsListPage />)} />
              <Route path="applications/new" element={protect("applications", <ApplicationEditorPage mode="create" />)} />
              <Route path="applications/:id" element={protect("applications", <ApplicationEditorPage mode="edit" />)} />
              <Route path="users" element={protect("users", <UsersListPage />)} />
              <Route path="collections" element={protect("collections", <CollectionsListPage />)} />
              <Route path="collections/new" element={protect("collections", <CollectionEditorPage mode="create" />)} />
              <Route path="collections/:id" element={protect("collections", <CollectionEditorPage mode="edit" />)} />
              <Route path="posts" element={protect("posts", <PostsListPage />)} />
              <Route path="posts/new" element={protect("posts", <PostEditorPage mode="create" />)} />
              <Route path="posts/:id" element={protect("posts", <PostEditorPage mode="edit" />)} />
              <Route path="articles" element={protect("articles", <ArticlesListPage />)} />
              <Route path="articles/new" element={protect("articles", <ArticleEditorPage mode="create" />)} />
              <Route path="articles/:id" element={protect("articles", <ArticleEditorPage mode="edit" />)} />
              <Route path="pages" element={protect("pages", <PagesListPage />)} />
              <Route path="pages/new" element={protect("pages", <PageEditorPage mode="create" />)} />
              <Route path="pages/:id" element={protect("pages", <PageEditorPage mode="edit" />)} />
              <Route path="menus" element={protect("menus", <MenusListPage />)} />
              <Route path="menus/new" element={protect("menus", <MenuEditorPage mode="create" />)} />
              <Route path="menus/:id" element={protect("menus", <MenuEditorPage mode="edit" />)} />
              <Route path="galleries" element={protect("galleries", <GalleriesListPage />)} />
              <Route path="galleries/new" element={protect("galleries", <GalleryEditorPage mode="create" />)} />
              <Route path="galleries/:id" element={protect("galleries", <GalleryEditorPage mode="edit" />)} />
              <Route path="videos" element={protect("videos", <VideoListPage />)} />
              <Route path="videos/:id" element={protect("videos", <VideoEditorPage />)} />
              <Route path="videos/upload" element={protect("videos", <VideoUploadPage />)} />
              <Route path="images" element={protect("images", <ImagesListPage />)} />
              <Route path="images/:id" element={protect("images", <ImageEditorPage />)} />
              <Route path="media" element={protect("media", <MediaLibraryPage />)} />
              <Route path="media/:id/variants" element={protect("media", <MediaVariantsPage />)} />
              <Route path="media/safety" element={protect("media-safety", <MediaSafetyPage />)} />
              <Route path="sitemap" element={protect("sitemap", <SitemapPage />)} />
              <Route path="analytics" element={protect("analytics", <AnalyticsDashboardPage />)} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </ConfigProvider>
  );
};
