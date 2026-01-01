import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { authStore } from "./app/auth";
import { TenantProvider } from "./app/tenant";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { PostsListPage } from "./features/posts/PostsListPage";
import { PostEditorPage } from "./features/posts/PostEditorPage";
import { ArticlesListPage } from "./features/articles/ArticlesListPage";
import { ArticleEditorPage } from "./features/articles/ArticleEditorPage";
import { VideoListPage } from "./features/videos/VideoListPage";
import { VideoUploadPage } from "./features/videos/VideoUploadPage";
import { ApplicationsListPage } from "./features/applications/ApplicationsListPage";
import { ApplicationEditorPage } from "./features/applications/ApplicationEditorPage";

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const token = authStore.getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const AdminApp = () => {
  return (
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
            <Route path="posts" element={<PostsListPage />} />
            <Route path="posts/new" element={<PostEditorPage mode="create" />} />
            <Route path="posts/:id" element={<PostEditorPage mode="edit" />} />
            <Route path="articles" element={<ArticlesListPage />} />
            <Route path="articles/new" element={<ArticleEditorPage mode="create" />} />
            <Route path="articles/:id" element={<ArticleEditorPage mode="edit" />} />
            <Route path="videos" element={<VideoListPage />} />
            <Route path="videos/upload" element={<VideoUploadPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </TenantProvider>
  );
};
