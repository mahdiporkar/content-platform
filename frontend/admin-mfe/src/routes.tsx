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
import { VideoUploadPage } from "./features/videos/VideoUploadPage";

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
      { path: "posts", element: <PostsListPage /> },
      { path: "posts/new", element: <PostEditorPage mode="create" /> },
      { path: "posts/:id", element: <PostEditorPage mode="edit" /> },
      { path: "articles", element: <ArticlesListPage /> },
      { path: "articles/new", element: <ArticleEditorPage mode="create" /> },
      { path: "articles/:id", element: <ArticleEditorPage mode="edit" /> },
      { path: "videos", element: <VideoListPage /> },
      { path: "videos/upload", element: <VideoUploadPage /> }
    ]
  }
];
