import assert from 'assert';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '../src/common/content-status.enum';
import { MenuItemTarget, MenuItemType, MenuLocation, MenuStatus } from '../src/common/menu-types';
import { AdminMenuService } from '../src/services/admin-menu.service';
import { AdminPageService } from '../src/services/admin-page.service';

type Where = Record<string, unknown>;

class MemoryRepo<T extends { id: string; createdAt?: Date; updatedAt?: Date }> {
  rows: T[] = [];

  constructor(seed: T[] = []) {
    this.rows = seed;
  }

  create(input: Partial<T>): T {
    return input as T;
  }

  async save(input: T): Promise<T> {
    const now = new Date();
    input.createdAt = input.createdAt ?? now;
    input.updatedAt = now;
    const index = this.rows.findIndex((row) => row.id === input.id);
    if (index >= 0) {
      this.rows[index] = input;
    } else {
      this.rows.push(input);
    }
    return input;
  }

  async exists({ where }: { where: Where }): Promise<boolean> {
    return this.rows.some((row) => this.matches(row, where));
  }

  async findOne({ where }: { where: Where }): Promise<T | null> {
    return this.rows.find((row) => this.matches(row, where)) ?? null;
  }

  async find({ where }: { where?: Where } = {}): Promise<T[]> {
    return where ? this.rows.filter((row) => this.matches(row, where)) : [...this.rows];
  }

  async findAndCount({ where }: { where: Where }): Promise<[T[], number]> {
    const rows = this.rows.filter((row) => this.matches(row, where));
    return [rows, rows.length];
  }

  async delete(where: Where): Promise<void> {
    this.rows = this.rows.filter((row) => !this.matches(row, where));
  }

  private matches(row: T, where: Where): boolean {
    return Object.entries(where).every(([key, expected]) => {
      const operator = expected as unknown as { _type?: string; _value?: unknown };
      if (operator && typeof operator === 'object' && operator._type === 'not') {
        return (row as Record<string, unknown>)[key] !== operator._value;
      }
      if (operator && typeof operator === 'object' && operator._type === 'in') {
        return ((operator._value as unknown[]) ?? []).includes((row as Record<string, unknown>)[key]);
      }
      return (row as Record<string, unknown>)[key] === expected;
    });
  }
}

const mediaUrls = {
  toPublicMediaUrl: (_app: unknown, value: string | null) => value,
  rewriteHtmlMediaUrls: (_app: unknown, html: string | null) => html,
};

async function testPageSlugUniquenessAndPublicFiltering(): Promise<void> {
  const pageRepo = new MemoryRepo<any>();
  const service = new AdminPageService(pageRepo as never, mediaUrls as never);
  const request = {
    applicationId: 'app-1',
    title: 'About',
    slug: 'about',
    content: '<p>About</p>',
    languageCode: 'fa',
    status: ContentStatus.PUBLISHED,
    showInMenu: true,
  };
  await service.create(request);
  await assert.rejects(() => service.create({ ...request, title: 'Duplicate' }), ConflictException);

  await service.create({ ...request, slug: 'draft', title: 'Draft', status: ContentStatus.DRAFT });
  const publicPages = await service.listPublished({ id: 'app-1' } as never, 'fa');
  assert.deepEqual(publicPages.map((page) => page.slug), ['about']);
  await assert.rejects(() => service.getPublished({ id: 'app-1' } as never, 'fa', 'draft'), NotFoundException);
}

async function testMenuTreeAndPublicFiltering(): Promise<void> {
  const menuRepo = new MemoryRepo<any>();
  const itemRepo = new MemoryRepo<any>();
  const pageRepo = new MemoryRepo<any>([
    {
      id: 'page-published',
      applicationId: 'app-1',
      languageCode: 'fa',
      slug: 'about',
      status: ContentStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'page-draft',
      applicationId: 'app-1',
      languageCode: 'fa',
      slug: 'draft',
      status: ContentStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  const service = new AdminMenuService(
    menuRepo as never,
    itemRepo as never,
    pageRepo as never,
    new MemoryRepo<any>() as never,
    new MemoryRepo<any>() as never,
    new MemoryRepo<any>() as never,
  );

  const menu = await service.create({
    applicationId: 'app-1',
    code: 'main',
    title: 'Main',
    location: MenuLocation.HEADER,
    languageCode: 'fa',
    status: MenuStatus.ACTIVE,
  });

  await service.addItem(menu.id, {
    title: 'About',
    itemType: MenuItemType.PAGE,
    referenceId: 'page-published',
    target: MenuItemTarget.SELF,
    sortOrder: 0,
    isVisible: true,
  });
  await service.addItem(menu.id, {
    title: 'Draft',
    itemType: MenuItemType.PAGE,
    referenceId: 'page-draft',
    target: MenuItemTarget.SELF,
    sortOrder: 1,
    isVisible: true,
  });
  await service.addItem(menu.id, {
    title: 'Hidden',
    itemType: MenuItemType.CUSTOM_URL,
    url: '/hidden',
    target: MenuItemTarget.SELF,
    sortOrder: 2,
    isVisible: false,
  });

  const publicMenu = await service.getPublicByCode({ id: 'app-1' } as never, 'fa', 'main');
  assert.deepEqual(publicMenu.items.map((item) => item.title), ['About']);
  assert.equal(publicMenu.items[0].url, '/fa/about');

  const root = itemRepo.rows[0];
  const child = itemRepo.rows[1];
  child.parentId = root.id;
  await itemRepo.save(child);
  await assert.rejects(
    () =>
      service.updateItem(menu.id, root.id, {
        parentId: child.id,
        title: root.title,
        itemType: root.itemType,
        referenceId: root.referenceId,
        target: root.target,
        sortOrder: root.sortOrder,
        isVisible: true,
      }),
    BadRequestException,
  );
}

async function main(): Promise<void> {
  await testPageSlugUniquenessAndPublicFiltering();
  await testMenuTreeAndPublicFiltering();
  console.log('page-menu-management tests passed');
}

void main();
