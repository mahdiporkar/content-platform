import React from "react";
import { useNavigate } from "react-router-dom";
import { useTenant } from "../../app/tenant";
import { VideoUploadForm } from "./VideoUploadForm";

export const VideoUploadPage = () => {
  const { applicationId } = useTenant();
  const navigate = useNavigate();

  return (
    <VideoUploadForm
      applicationId={applicationId}
      onSuccess={() => navigate("/videos")}
      onCancel={() => navigate("/videos")}
    />
  );
};
