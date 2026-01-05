import React from "react";
import { Navigate, RouteObject } from "react-router-dom";
import { authStore } from "./app/auth";
import { AppLayout } from "./layouts/AppLayout";
import { LoginPage } from "./features/auth/LoginPage";
import { PostsListPage } from "./features/posts/PostsListPage";
import { PostEditorPage } from "./features/posts/PostEditorPage";
import { ArticlesListPage } from "./features/articles/ArticlesListPage";
import { ArticleEditorPage } from "./features/articles/ArticleEditorPage";
import { VideoListPage } from "./features/videos/VideoListPage";
import { VideoEditorPage } from "./features/videos/VideoEditorPage";
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

export const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/posts" replace /> },
      { path: "applications", element: <ApplicationsListPage /> },
      { path: "applications/new", element: <ApplicationEditorPage mode="create" /> },
      { path: "applications/:id", element: <ApplicationEditorPage mode="edit" /> },
      { path: "posts", element: <PostsListPage /> },
      { path: "posts/new", element: <PostEditorPage mode="create" /> },
      { path: "posts/:id", element: <PostEditorPage mode="edit" /> },
      { path: "articles", element: <ArticlesListPage /> },
      { path: "articles/new", element: <ArticleEditorPage mode="create" /> },
      { path: "articles/:id", element: <ArticleEditorPage mode="edit" /> },
      { path: "videos", element: <VideoListPage /> },
      { path: "videos/:id", element: <VideoEditorPage /> },
      { path: "videos/upload", element: <VideoUploadPage /> }
    ]
  }
];
