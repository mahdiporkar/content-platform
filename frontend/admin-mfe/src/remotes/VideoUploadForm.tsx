import React from "react";
import { TenantProvider } from "../app/tenant";
import { VideoUploadForm as VideoUploadFormInner } from "../features/videos/VideoUploadForm";

type Props = {
  applicationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export const VideoUploadForm = ({ applicationId, ...rest }: Props) => {
  return (
    <TenantProvider initialApplicationId={applicationId} persist={false}>
      <VideoUploadFormInner applicationId={applicationId} {...rest} />
    </TenantProvider>
  );
};
