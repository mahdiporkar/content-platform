import assert from 'assert';
import { videoSlug, videoSeo, videoMedia } from '../src/common/video-metadata';
import { AdminVideoService } from '../src/services/admin-video.service';
import { ContentStatus } from '../src/common/content-status.enum';

async function run() {
  assert.equal(videoSlug('  مراقبت چشم / Eye Care! '), 'مراقبت-چشم-eye-care');
  assert.throws(() => videoSlug('???'));
  assert.throws(() => videoSeo({ canonicalUrl: 'javascript:alert(1)' }));
  assert.throws(() => videoSeo({ noIndex: 'false' }));
  assert.throws(() => videoSeo({ schemaJsonLd: '{invalid}' }));
  assert.throws(() => videoMedia({ durationSeconds: -1 }));
  assert.equal(videoMedia({ durationSeconds: '125' }).durationSeconds, 125);

  const originalDate = new Date('2026-01-01');
  const video = {
    id: 'video-1', applicationId: 'app', title: 'Original', slug: 'eye-care', description: 'Description', locale: 'fa',
    status: ContentStatus.PUBLISHED, publishedAt: originalDate, posterKey: 'app/poster.jpg',
    durationSeconds: 125, width: 1280, height: 720, altText: 'Poster', seo: { metaTitle: 'Search title' },
    createdAt: originalDate, updatedAt: originalDate, objectKey: 'app/video.mp4',
  };
  let collision = false;
  let references: any;
  const service = new AdminVideoService(
    { findOne: async ({ where }: any) => where.id ? video : collision ? { id: 'other' } : video, save: async (value: any) => value } as never,
    {} as never,
    { buildMediaUrl: (_: any, key: string) => `https://media.example/${key}` } as never,
    { findOne: async () => ({ id: 'app' }) } as never,
    {} as never,
    { findAssetByObjectKey: async () => ({ kind: 'image', state: 'ACTIVE' }), syncContentReferences: async (value: any) => { references = value; } } as never,
  );
  await service.update('video-1', { title: 'Updated title', description: 'Description', locale: 'fa', status: ContentStatus.PUBLISHED });
  assert.equal(video.slug, 'eye-care');
  assert.equal(video.posterKey, 'app/poster.jpg');
  assert.equal(video.durationSeconds, 125);
  assert.equal(video.seo.metaTitle, 'Search title');
  assert.equal(video.publishedAt, originalDate);
  assert.equal(references.bannerKey, 'app/poster.jpg');
  await assert.rejects(() => service.update('video-1', { title: 'Title', slug: 'changed', description: 'Description', status: ContentStatus.PUBLISHED }), /published video slug/);
  collision = true;
  await assert.rejects(() => service.update('video-1', { title: 'Title', description: 'Description', status: ContentStatus.PUBLISHED }), /already exists/);
  console.log('video metadata tests passed');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
