import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTenant } from "../../app/tenant";
import { Post } from "../../types";
import { PostEditorForm } from "./PostEditorForm";

type EditorMode = "create" | "edit";

export const PostEditorPage = ({ mode }: { mode: EditorMode }) => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const existingPost = useMemo(() => {
    return (location.state as { post?: Post } | undefined)?.post;
  }, [location.state]);

  return (
    <PostEditorForm
      mode={mode}
      applicationId={applicationId}
      postId={id}
      initialPost={existingPost}
      onSuccess={() => navigate("/posts")}
      onCancel={() => navigate("/posts")}
    />
  );
};
