import { BadRequestException } from '@nestjs/common';
import { ContentStatus } from './content-status.enum';

type PublicationFields = {
  publishedAt: Date | null;
  scheduledAt: Date | null;
};

export const resolvePublicationFields = (
  status: ContentStatus,
  scheduledAtInput?: string,
  previousPublishedAt?: Date | null,
): PublicationFields => {
  if (status === ContentStatus.PUBLISHED) {
    return {
      publishedAt: previousPublishedAt ?? new Date(),
      scheduledAt: null,
    };
  }

  if (status === ContentStatus.SCHEDULED) {
    if (!scheduledAtInput) {
      throw new BadRequestException('scheduledAt is required when status is SCHEDULED.');
    }
    const scheduledAt = new Date(scheduledAtInput);
    if (Number.isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('scheduledAt is invalid.');
    }
    if (scheduledAt.getTime() <= Date.now()) {
      throw new BadRequestException('scheduledAt must be in the future.');
    }
    return {
      publishedAt: null,
      scheduledAt,
    };
  }

  return {
    publishedAt: null,
    scheduledAt: null,
  };
};
