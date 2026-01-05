import React from "react";
import { TenantProvider } from "../app/tenant";
import { Post } from "../types";
import { PostEditorForm as PostEditorFormInner } from "../features/posts/PostEditorForm";

type Props = {
  applicationId: string;
  mode: "create" | "edit";
  postId?: string;
  initialPost?: Post;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const PostEditorForm = ({ applicationId, ...rest }: Props) => {
  return (
    <TenantProvider initialApplicationId={applicationId} persist={false}>
      <PostEditorFormInner applicationId={applicationId} {...rest} />
    </TenantProvider>
  );
};
