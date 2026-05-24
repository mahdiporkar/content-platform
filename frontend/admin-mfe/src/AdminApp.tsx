import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ConfigProvider } from "antd";
import enUS from "antd/locale/en_US";
import faIR from "antd/locale/fa_IR";
import arEG from "antd/locale/ar_EG";
import zhCN from "antd/locale/zh_CN";
import ruRU from "antd/locale/ru_RU";
import { authStore } from "./app/auth";
import { TenantProvider } from "./app/tenant";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { PostsListPage } from "./features/posts/PostsListPage";
import { PostEditorPage } from "./features/posts/PostEditorPage";
import { ArticlesListPage } from "./features/articles/ArticlesListPage";
import { ArticleEditorPage } from "./features/articles/ArticleEditorPage";
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
  const { locale } = useI18n();

  return (
    <ConfigProvider
      locale={antLocales[locale]}
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
              <Route index element={<Navigate to="/posts" replace />} />
              <Route path="applications" element={<ApplicationsListPage />} />
              <Route path="applications/new" element={<ApplicationEditorPage mode="create" />} />
              <Route path="applications/:id" element={<ApplicationEditorPage mode="edit" />} />
              <Route path="users" element={<UsersListPage />} />
              <Route path="collections" element={<CollectionsListPage />} />
              <Route path="collections/new" element={<CollectionEditorPage mode="create" />} />
              <Route path="collections/:id" element={<CollectionEditorPage mode="edit" />} />
              <Route path="posts" element={<PostsListPage />} />
              <Route path="posts/new" element={<PostEditorPage mode="create" />} />
              <Route path="posts/:id" element={<PostEditorPage mode="edit" />} />
              <Route path="articles" element={<ArticlesListPage />} />
              <Route path="articles/new" element={<ArticleEditorPage mode="create" />} />
              <Route path="articles/:id" element={<ArticleEditorPage mode="edit" />} />
              <Route path="galleries" element={<GalleriesListPage />} />
              <Route path="galleries/new" element={<GalleryEditorPage mode="create" />} />
              <Route path="galleries/:id" element={<GalleryEditorPage mode="edit" />} />
              <Route path="videos" element={<VideoListPage />} />
              <Route path="videos/:id" element={<VideoEditorPage />} />
              <Route path="videos/upload" element={<VideoUploadPage />} />
              <Route path="images" element={<ImagesListPage />} />
              <Route path="images/:id" element={<ImageEditorPage />} />
              <Route path="media" element={<MediaLibraryPage />} />
              <Route path="media/:id/variants" element={<MediaVariantsPage />} />
              <Route path="media/safety" element={<MediaSafetyPage />} />
              <Route path="sitemap" element={<SitemapPage />} />
              <Route path="analytics" element={<AnalyticsDashboardPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TenantProvider>
    </ConfigProvider>
  );
};
