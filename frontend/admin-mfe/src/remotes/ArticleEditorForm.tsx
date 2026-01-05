import React from "react";
import { TenantProvider } from "../app/tenant";
import { Article } from "../types";
import { ArticleEditorForm as ArticleEditorFormInner } from "../features/articles/ArticleEditorForm";

type Props = {
  applicationId: string;
  mode: "create" | "edit";
  articleId?: string;
  initialArticle?: Article;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const ArticleEditorForm = ({ applicationId, ...rest }: Props) => {
  return (
    <TenantProvider initialApplicationId={applicationId} persist={false}>
      <ArticleEditorFormInner applicationId={applicationId} {...rest} />
    </TenantProvider>
  );
};
