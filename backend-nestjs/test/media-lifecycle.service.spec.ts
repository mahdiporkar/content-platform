import { ConflictException } from '@nestjs/common';
import { MediaLifecycleService } from '../src/services/media-lifecycle.service';
import { MediaAssetState } from '../src/entities/media-asset.entity';

describe('MediaLifecycleService', () => {
  it('soft delete moves asset to TRASH and does not call storage delete', async () => {
    const storage = { deleteMany: jest.fn(), deleteObject: jest.fn() };
    const service = new MediaLifecycleService(
      { findAndCount: jest.fn(), findOne: jest.fn(), save: jest.fn() } as any,
      { find: jest.fn(), delete: jest.fn() } as any,
      { count: jest.fn(), find: jest.fn() } as any,
      { findOne: jest.fn() } as any,
      {} as any,
      { buildMediaUrl: jest.fn().mockReturnValue('url') } as any,
      storage as any,
      { record: jest.fn() } as any,
    );
    const asset = { id: 'a', applicationId: 't', state: MediaAssetState.ACTIVE } as any;
    (service as any).mediaAssetRepo.findOne.mockResolvedValue(asset);
    (service as any).mediaAssetRepo.save.mockResolvedValue({ ...asset, state: MediaAssetState.TRASH, createdAt: new Date(), updatedAt: new Date() });
    (service as any).applicationRepo.findOne.mockResolvedValue({ id: 't' });
    (service as any).mediaRefRepo.count.mockResolvedValue(0);

    await service.trash('t', 'a', 'u1', 'u@test');
    expect(storage.deleteMany).not.toHaveBeenCalled();
  });

  it('purge rejects when media has references', async () => {
    const qr: any = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      release: jest.fn(),
      isTransactionActive: true,
      manager: {
        getRepository: jest.fn(),
      },
    };
    const assetRepo = { findOne: jest.fn() };
    const refRepo = { count: jest.fn(), find: jest.fn() };
    const variantRepo = { find: jest.fn() };
    qr.manager.getRepository.mockImplementation((entity: any) => {
      if (entity.name === 'MediaAssetEntity') return assetRepo;
      if (entity.name === 'MediaReferenceEntity') return refRepo;
      return variantRepo;
    });
    const service = new MediaLifecycleService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { createQueryRunner: () => qr } as any,
      {} as any,
      { deleteMany: jest.fn() } as any,
      { record: jest.fn() } as any,
    );
    assetRepo.findOne.mockResolvedValue({ id: 'm1', applicationId: 't1', state: MediaAssetState.TRASH, pinned: false });
    refRepo.count.mockResolvedValue(1);
    refRepo.find.mockResolvedValue([{ refType: 'POST', refId: 'p1', refField: 'banner' }]);

    await expect(service.purgeAsSuperAdmin('t1', 'm1', 'sa', 'sa@test')).rejects.toBeInstanceOf(ConflictException);
  });
});
