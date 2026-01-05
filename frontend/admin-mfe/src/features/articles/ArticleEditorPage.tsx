import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTenant } from "../../app/tenant";
import { Article } from "../../types";
import { ArticleEditorForm } from "./ArticleEditorForm";

type EditorMode = "create" | "edit";

export const ArticleEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingArticle = useMemo(() => {
    return (location.state as { article?: Article } | undefined)?.article;
  }, [location.state]);

  return (
    <ArticleEditorForm
      mode={mode}
      applicationId={applicationId}
      articleId={id}
      initialArticle={existingArticle}
      onSuccess={() => navigate("/articles")}
      onCancel={() => navigate("/articles")}
    />
  );
};
