import assert from 'assert';
import { DeliveryContentService } from '../src/services/delivery-content.service';
import { CollectionStatus } from '../src/common/collection-types';
import { ContentStatus } from '../src/common/content-status.enum';
import { ContentType } from '../src/common/content-type.enum';

const now = new Date();
const collection = (id: string, locale: string) => ({
  id,
  applicationId: 'app-1',
  slug: 'educational-videos',
  locale,
  title: locale,
  description: null,
  allowedTypes: [ContentType.VIDEO],
  maxItems: null,
  isPublic: true,
  status: CollectionStatus.PUBLISHED,
  priority: 0,
  presentation: null,
  placement: null,
  fallback: { enabled: false },
  audience: null,
  metadata: null,
  createdBy: null,
  updatedBy: null,
  createdAt: now,
  updatedAt: now,
});

const enCollection = collection('collection-en', 'en');
const faCollection = collection('collection-fa', 'fa');
const video = {
  id: 'video-en',
  applicationId: 'app-1',
  title: 'Eye care',
  slug: 'eye-care',
  description: 'Description',
  locale: 'en',
  tags: null,
  displayScopes: ['educational-videos'],
  seo: null,
  gallery: null,
  status: ContentStatus.PUBLISHED,
  publishedAt: now,
  scheduledAt: null,
  viewCount: 0,
  objectKey: 'app-1/video.mp4',
  posterKey: null,
  durationSeconds: 120,
  width: null,
  height: null,
  contentType: 'video/mp4',
  sizeBytes: 100,
  altText: null,
  deletedAt: null,
  createdAt: now,
  updatedAt: now,
};

const service = new DeliveryContentService(
  { find: async () => [] } as never,
  { find: async () => [] } as never,
  { find: async () => [video] } as never,
  { find: async () => [] } as never,
  { find: async () => [] } as never,
  { find: async () => [faCollection, enCollection] } as never,
  {
    createQueryBuilder: () => {
      const query = {
        innerJoin: () => query,
        where: () => query,
        andWhere: () => query,
        orderBy: () => query,
        addOrderBy: () => query,
        skip: () => query,
        take: () => query,
        getManyAndCount: async () => [
          [
            {
              id: 'item-active',
              collectionId: 'collection-en',
              contentType: ContentType.VIDEO,
              contentId: 'video-en',
              type: 'content',
              position: 0,
              isActive: true,
              startsAt: null,
              endsAt: null,
              display: null,
              link: null,
              metadata: null,
            },
          ],
          1,
        ],
      };
      return query;
    },
    find: async ({ where }: { where: { collectionId: string } }) =>
      where.collectionId === 'collection-en'
        ? [
            {
              id: 'item-active',
              collectionId: 'collection-en',
              contentType: ContentType.VIDEO,
              contentId: 'video-en',
              type: 'content',
              position: 0,
              isActive: true,
              startsAt: null,
              endsAt: null,
              display: null,
              link: null,
              metadata: null,
            },
            {
              id: 'item-disabled',
              collectionId: 'collection-en',
              contentType: ContentType.VIDEO,
              contentId: 'disabled',
              type: 'content',
              position: 1,
              isActive: false,
              startsAt: null,
              endsAt: null,
              display: null,
              link: null,
              metadata: null,
            },
          ]
        : [],
  } as never,
  {} as never,
  { buildMediaUrl: () => 'https://media.example/video.mp4' } as never,
  {} as never,
);

async function run() {
  const result = await service.getCollectionItems(
    { id: 'app-1' } as never,
    'educational-videos',
    'en',
    1,
    100,
  );
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].slug, 'eye-care');
  assert.equal(result.items[0].videoUrl, 'https://media.example/video.mp4');
  assert.equal(result.pagination.pageSize, 24);

  const detail = await service.getCollectionVideoBySlug(
    { id: 'app-1' } as never,
    'educational-videos',
    'eye-care',
    'en',
  );
  assert.equal(detail.id, 'video-en');
}

run()
  .then(() => console.log('educational-videos tests passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
