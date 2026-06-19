import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ContentStatus } from '../common/content-status.enum';
import { MenuItemTarget, MenuItemType, MenuLocation, MenuStatus } from '../common/menu-types';
import { MenuItemUpsertRequestDto } from '../dto/requests/menu-item-upsert-request.dto';
import { MenuItemLayoutRequestDto } from '../dto/requests/menu-items-layout-request.dto';
import { MenuUpsertRequestDto } from '../dto/requests/menu-upsert-request.dto';
import { MenuItemResponseDto, MenuResponseDto } from '../dto/responses/menu-response.dto';
import { ApplicationEntity } from '../entities/application.entity';
import { ArticleEntity } from '../entities/article.entity';
import { GalleryEntity } from '../entities/gallery.entity';
import { MenuItemEntity } from '../entities/menu-item.entity';
import { MenuEntity } from '../entities/menu.entity';
import { PageEntity } from '../entities/page.entity';
import { PostEntity } from '../entities/post.entity';
import { TenantRouteEntity, TenantRouteStatus } from '../entities/tenant-route.entity';

export type MenuContentCandidateDto = {
  id: string;
  type: MenuItemType.PAGE | MenuItemType.ARTICLE | MenuItemType.POST | MenuItemType.GALLERY | MenuItemType.TENANT_ROUTE;
  title: string;
  slug: string;
  url: string;
  alreadyInMenu: boolean;
  publishedAt: string | null;
  updatedAt: string;
};

@Injectable()
export class AdminMenuService {
  constructor(
    @InjectRepository(MenuEntity)
    private readonly menuRepo: Repository<MenuEntity>,
    @InjectRepository(MenuItemEntity)
    private readonly itemRepo: Repository<MenuItemEntity>,
    @InjectRepository(PageEntity)
    private readonly pageRepo: Repository<PageEntity>,
    @InjectRepository(ArticleEntity)
    private readonly articleRepo: Repository<ArticleEntity>,
    @InjectRepository(PostEntity)
    private readonly postRepo: Repository<PostEntity>,
    @InjectRepository(GalleryEntity)
    private readonly galleryRepo: Repository<GalleryEntity>,
    @InjectRepository(TenantRouteEntity)
    private readonly tenantRouteRepo: Repository<TenantRouteEntity>,
  ) {}

  private mapItem(item: MenuItemEntity, children: MenuItemResponseDto[] = []): MenuItemResponseDto {
    const dynamic = [
      MenuItemType.PAGE,
      MenuItemType.ARTICLE,
      MenuItemType.POST,
      MenuItemType.GALLERY,
      MenuItemType.TENANT_ROUTE,
    ].includes(item.itemType);
    return new MenuItemResponseDto(
      item.id,
      item.menuId,
      item.parentId,
      item.title,
      item.itemType,
      item.referenceId,
      item.url,
      item.target,
      item.icon,
      item.cssClass,
      item.sortOrder,
      item.isVisible,
      dynamic,
      item.source ?? null,
      item.sourceKey ?? null,
      item.managedBy ?? 'ADMIN',
      children,
      item.createdAt.toISOString(),
      item.updatedAt.toISOString(),
    );
  }

  private buildTree(items: MenuItemEntity[]): MenuItemResponseDto[] {
    const sorted = [...items].sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.getTime() - right.createdAt.getTime());
    const childrenByParent = new Map<string | null, MenuItemEntity[]>();
    sorted.forEach((item) => {
      const key = item.parentId ?? null;
      childrenByParent.set(key, [...(childrenByParent.get(key) ?? []), item]);
    });
    const visit = (parentId: string | null): MenuItemResponseDto[] =>
      (childrenByParent.get(parentId) ?? []).map((item) => this.mapItem(item, visit(item.id)));
    return visit(null);
  }

  private async mapMenu(menu: MenuEntity, includeItems = false): Promise<MenuResponseDto> {
    const items = includeItems ? await this.itemRepo.find({ where: { menuId: menu.id } }) : [];
    return new MenuResponseDto(
      menu.id,
      menu.applicationId,
      menu.code,
      menu.title,
      menu.location,
      menu.languageCode,
      menu.status,
      this.buildTree(items),
      menu.createdAt.toISOString(),
      menu.updatedAt.toISOString(),
    );
  }

  private validateItemRequest(request: MenuItemUpsertRequestDto): void {
    if ([MenuItemType.CUSTOM_URL, MenuItemType.EXTERNAL_URL].includes(request.itemType) && !request.url?.trim()) {
      throw new BadRequestException('URL is required for URL menu items.');
    }
    if ([MenuItemType.PAGE, MenuItemType.ARTICLE, MenuItemType.POST, MenuItemType.GALLERY, MenuItemType.TENANT_ROUTE].includes(request.itemType) && !request.referenceId?.trim()) {
      throw new BadRequestException('Reference id is required for content menu items.');
    }
    if (request.itemType === MenuItemType.GROUP && (request.referenceId || request.url)) {
      throw new BadRequestException('Group menu items cannot have referenceId or URL.');
    }
  }

  private async ensureSameMenuParent(menuId: string, parentId?: string | null): Promise<string | null> {
    if (!parentId) {
      return null;
    }
    const parent = await this.itemRepo.findOne({ where: { id: parentId, menuId } });
    if (!parent) {
      throw new NotFoundException('Parent menu item not found.');
    }
    return parent.id;
  }

  private async ensureNoCircularParent(itemId: string, menuId: string, parentId: string | null): Promise<void> {
    if (!parentId) {
      return;
    }
    if (itemId === parentId) {
      throw new BadRequestException('Menu item cannot be its own parent.');
    }
    const items = await this.itemRepo.find({ where: { menuId } });
    const byId = new Map(items.map((item) => [item.id, item]));
    let cursor = byId.get(parentId) ?? null;
    while (cursor) {
      if (cursor.parentId === itemId) {
        throw new BadRequestException('Circular menu parent-child relationship is not allowed.');
      }
      cursor = cursor.parentId ? byId.get(cursor.parentId) ?? null : null;
    }
  }

  private async resolveOwnership(itemType: MenuItemType, referenceId?: string | null) {
    if (itemType === MenuItemType.TENANT_ROUTE && referenceId) {
      const route = await this.tenantRouteRepo.findOne({ where: { id: referenceId } });
      if (!route) throw new NotFoundException('Tenant route not found.');
      return { source: route.source, sourceKey: route.routeKey, managedBy: 'TENANT' as const };
    }
    if ([MenuItemType.PAGE, MenuItemType.ARTICLE, MenuItemType.POST, MenuItemType.GALLERY].includes(itemType)) {
      return { source: 'content-platform', sourceKey: referenceId ?? null, managedBy: 'CMS' as const };
    }
    return { source: null, sourceKey: null, managedBy: 'ADMIN' as const };
  }

  async create(request: MenuUpsertRequestDto): Promise<MenuResponseDto> {
    const menu = this.menuRepo.create({
      id: uuidv4(),
      applicationId: request.applicationId,
      code: request.code.trim(),
      title: request.title.trim(),
      location: request.location,
      languageCode: request.languageCode,
      status: request.status,
    });
    return this.mapMenu(await this.menuRepo.save(menu), true);
  }

  async update(id: string, request: MenuUpsertRequestDto): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    menu.applicationId = request.applicationId;
    menu.code = request.code.trim();
    menu.title = request.title.trim();
    menu.location = request.location;
    menu.languageCode = request.languageCode;
    menu.status = request.status;
    return this.mapMenu(await this.menuRepo.save(menu), true);
  }

  async changeStatus(id: string, status: MenuStatus): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    menu.status = status;
    return this.mapMenu(await this.menuRepo.save(menu), true);
  }

  async getApplicationIdById(id: string): Promise<string> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    return menu.applicationId;
  }

  async get(id: string): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    return this.mapMenu(menu, true);
  }

  async list(applicationId: string, languageCode?: string, status?: MenuStatus): Promise<MenuResponseDto[]> {
    const menus = await this.menuRepo.find({
      where: { applicationId, ...(languageCode ? { languageCode } : {}), ...(status ? { status } : {}) },
      order: { updatedAt: 'DESC' },
    });
    return Promise.all(menus.map((menu) => this.mapMenu(menu, false)));
  }

  async delete(id: string): Promise<void> {
    await this.itemRepo.delete({ menuId: id });
    await this.menuRepo.delete({ id });
  }

  async addItem(menuId: string, request: MenuItemUpsertRequestDto): Promise<MenuResponseDto> {
    this.validateItemRequest(request);
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    const ownership = await this.resolveOwnership(request.itemType, request.referenceId);
    const item = this.itemRepo.create({
      id: uuidv4(),
      menuId,
      parentId: await this.ensureSameMenuParent(menuId, request.parentId),
      title: request.title.trim(),
      itemType: request.itemType,
      referenceId: request.referenceId?.trim() || null,
      url: request.url?.trim() || null,
      target: request.target ?? MenuItemTarget.SELF,
      icon: request.icon?.trim() || null,
      cssClass: request.cssClass?.trim() || null,
      sortOrder: request.sortOrder,
      isVisible: request.isVisible ?? true,
      ...ownership,
    });
    await this.itemRepo.save(item);
    return this.mapMenu(menu, true);
  }

  async updateItem(menuId: string, itemId: string, request: MenuItemUpsertRequestDto): Promise<MenuResponseDto> {
    this.validateItemRequest(request);
    const [menu, item] = await Promise.all([
      this.menuRepo.findOne({ where: { id: menuId } }),
      this.itemRepo.findOne({ where: { id: itemId, menuId } }),
    ]);
    if (!menu || !item) {
      throw new NotFoundException('Menu item not found.');
    }
    const parentId = await this.ensureSameMenuParent(menuId, request.parentId);
    const ownership = await this.resolveOwnership(request.itemType, request.referenceId);
    await this.ensureNoCircularParent(itemId, menuId, parentId);
    item.parentId = parentId;
    item.title = request.title.trim();
    item.itemType = request.itemType;
    item.referenceId = request.referenceId?.trim() || null;
    item.url = request.url?.trim() || null;
    item.target = request.target ?? MenuItemTarget.SELF;
    item.icon = request.icon?.trim() || null;
    item.cssClass = request.cssClass?.trim() || null;
    item.sortOrder = request.sortOrder;
    item.isVisible = request.isVisible ?? true;
    item.source = ownership.source;
    item.sourceKey = ownership.sourceKey;
    item.managedBy = ownership.managedBy;
    await this.itemRepo.save(item);
    return this.mapMenu(menu, true);
  }

  async deleteItem(menuId: string, itemId: string): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    const all = await this.itemRepo.find({ where: { menuId } });
    const collect = (id: string): string[] => [id, ...all.filter((item) => item.parentId === id).flatMap((item) => collect(item.id))];
    await this.itemRepo.delete({ id: In(collect(itemId)) });
    return this.mapMenu(menu, true);
  }

  async updateItemsLayout(menuId: string, request: MenuItemLayoutRequestDto[]): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    const all = await this.itemRepo.find({ where: { menuId } });
    const byId = new Map(all.map((item) => [item.id, item]));
    const requestIds = new Set(request.map((item) => item.id));
    if (requestIds.size !== request.length || request.some((item) => !byId.has(item.id))) {
      throw new BadRequestException('Layout contains invalid menu item ids.');
    }
    for (const entry of request) {
      const parentId = await this.ensureSameMenuParent(menuId, entry.parentId);
      await this.ensureNoCircularParent(entry.id, menuId, parentId);
      const item = byId.get(entry.id)!;
      item.parentId = parentId;
      item.sortOrder = entry.sortOrder;
      item.isVisible = entry.isVisible ?? item.isVisible;
      await this.itemRepo.save(item);
    }
    return this.mapMenu(menu, true);
  }

  private buildContentUrl(
    languageCode: string,
    type: MenuItemType.PAGE | MenuItemType.ARTICLE | MenuItemType.POST | MenuItemType.GALLERY,
    slug: string,
  ): string {
    if (type === MenuItemType.PAGE) {
      return `/${languageCode}/${slug}`;
    }
    if (type === MenuItemType.POST) {
      return `/${languageCode}/posts/${slug}`;
    }
    if (type === MenuItemType.ARTICLE) {
      return `/${languageCode}/articles/${slug}`;
    }
    return `/${languageCode}/gallery/${slug}`;
  }

  private resolveTenantRoutePath(pathTemplate: string, languageCode: string): string {
    return pathTemplate
      .split('{locale}').join(languageCode)
      .split('{languageCode}').join(languageCode);
  }

  async listPublishedContentCandidates(menuId: string): Promise<MenuContentCandidateDto[]> {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    const [items, pages, articles, posts, galleries, tenantRoutes] = await Promise.all([
      this.itemRepo.find({ where: { menuId } }),
      this.pageRepo.find({
        where: { applicationId: menu.applicationId, languageCode: menu.languageCode, status: ContentStatus.PUBLISHED },
        order: { sortOrder: 'ASC', publishedAt: 'DESC', createdAt: 'DESC' },
      }),
      this.articleRepo.find({
        where: { applicationId: menu.applicationId, locale: menu.languageCode, status: ContentStatus.PUBLISHED },
        order: { publishedAt: 'DESC', createdAt: 'DESC' },
      }),
      this.postRepo.find({
        where: { applicationId: menu.applicationId, locale: menu.languageCode, status: ContentStatus.PUBLISHED },
        order: { publishedAt: 'DESC', createdAt: 'DESC' },
      }),
      this.galleryRepo.find({
        where: { applicationId: menu.applicationId, locale: menu.languageCode, status: ContentStatus.PUBLISHED },
        order: { publishedAt: 'DESC', createdAt: 'DESC' },
      }),
      this.tenantRouteRepo.find({
        where: { applicationId: menu.applicationId, status: TenantRouteStatus.AVAILABLE },
        order: { source: 'ASC', routeKey: 'ASC' },
      }),
    ]);
    const refs = new Set(items.filter((item) => item.referenceId).map((item) => `${item.itemType}:${item.referenceId}`));
    const mapCandidate = (
      type: MenuItemType.PAGE | MenuItemType.ARTICLE | MenuItemType.POST | MenuItemType.GALLERY,
      content: { id: string; title: string; slug: string; publishedAt?: Date | null; updatedAt: Date },
    ): MenuContentCandidateDto => ({
      id: content.id,
      type,
      title: content.title,
      slug: content.slug,
      url: this.buildContentUrl(menu.languageCode, type, content.slug),
      alreadyInMenu: refs.has(`${type}:${content.id}`),
      publishedAt: content.publishedAt ? content.publishedAt.toISOString() : null,
      updatedAt: content.updatedAt.toISOString(),
    });
    return [
      ...pages.map((page) => mapCandidate(MenuItemType.PAGE, page)),
      ...articles.map((article) => mapCandidate(MenuItemType.ARTICLE, article)),
      ...posts.map((post) => mapCandidate(MenuItemType.POST, post)),
      ...galleries.map((gallery) => mapCandidate(MenuItemType.GALLERY, gallery)),
      ...tenantRoutes.map((route): MenuContentCandidateDto => ({
        id: route.id,
        type: MenuItemType.TENANT_ROUTE,
        title: route.titles[menu.languageCode] ?? route.titles.en ?? route.routeKey,
        slug: route.routeKey,
        url: this.resolveTenantRoutePath(route.pathTemplate, menu.languageCode),
        alreadyInMenu: refs.has(`${MenuItemType.TENANT_ROUTE}:${route.id}`),
        publishedAt: null,
        updatedAt: route.updatedAt.toISOString(),
      })),
    ];
  }

  async syncPublishedContent(menuId: string): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({ where: { id: menuId } });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    const candidates = await this.listPublishedContentCandidates(menuId);
    const existing = await this.itemRepo.find({ where: { menuId } });
    let nextSortOrder = existing.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
    const missing = candidates.filter((candidate) => !candidate.alreadyInMenu);
    for (const candidate of missing) {
      await this.itemRepo.save(this.itemRepo.create({
        id: uuidv4(),
        menuId,
        parentId: null,
        title: candidate.title,
        itemType: candidate.type,
        referenceId: candidate.id,
        url: candidate.url,
        target: MenuItemTarget.SELF,
        icon: null,
        cssClass: null,
        sortOrder: nextSortOrder++,
        isVisible: true,
        ...(await this.resolveOwnership(candidate.type, candidate.id)),
      }));
    }
    return this.mapMenu(menu, true);
  }

  private async filterPublishedItems(application: ApplicationEntity, menu: MenuEntity, items: MenuItemEntity[]): Promise<MenuItemEntity[]> {
    const visible = items.filter((item) => item.isVisible);
    const pageIds = visible.filter((item) => item.itemType === MenuItemType.PAGE && item.referenceId).map((item) => item.referenceId as string);
    const articleIds = visible.filter((item) => item.itemType === MenuItemType.ARTICLE && item.referenceId).map((item) => item.referenceId as string);
    const postIds = visible.filter((item) => item.itemType === MenuItemType.POST && item.referenceId).map((item) => item.referenceId as string);
    const galleryIds = visible.filter((item) => item.itemType === MenuItemType.GALLERY && item.referenceId).map((item) => item.referenceId as string);
    const tenantRouteIds = visible.filter((item) => item.itemType === MenuItemType.TENANT_ROUTE && item.referenceId).map((item) => item.referenceId as string);
    const [pages, articles, posts, galleries, tenantRoutes] = await Promise.all([
      pageIds.length
        ? this.pageRepo.find({ where: { id: In(pageIds), applicationId: application.id, languageCode: menu.languageCode, status: ContentStatus.PUBLISHED } })
        : [],
      articleIds.length
        ? this.articleRepo.find({ where: { id: In(articleIds), applicationId: application.id, locale: menu.languageCode, status: ContentStatus.PUBLISHED } })
        : [],
      postIds.length
        ? this.postRepo.find({ where: { id: In(postIds), applicationId: application.id, locale: menu.languageCode, status: ContentStatus.PUBLISHED } })
        : [],
      galleryIds.length
        ? this.galleryRepo.find({ where: { id: In(galleryIds), applicationId: application.id, locale: menu.languageCode, status: ContentStatus.PUBLISHED } })
        : [],
      tenantRouteIds.length
        ? this.tenantRouteRepo.find({ where: { id: In(tenantRouteIds), applicationId: application.id, status: TenantRouteStatus.AVAILABLE } })
        : [],
    ]);
    const pageById = new Map(pages.map((page) => [page.id, page]));
    const articleById = new Map(articles.map((article) => [article.id, article]));
    const postById = new Map(posts.map((post) => [post.id, post]));
    const galleryById = new Map(galleries.map((gallery) => [gallery.id, gallery]));
    const tenantRouteById = new Map(tenantRoutes.map((route) => [route.id, route]));
    return visible
      .map((item) => {
        if (item.itemType === MenuItemType.PAGE) {
          const page = item.referenceId ? pageById.get(item.referenceId) : null;
          return page ? { ...item, url: item.url ?? `/${menu.languageCode}/${page.slug}` } as MenuItemEntity : null;
        }
        if (item.itemType === MenuItemType.ARTICLE) {
          const article = item.referenceId ? articleById.get(item.referenceId) : null;
          return article ? { ...item, url: item.url ?? `/${menu.languageCode}/articles/${article.slug}` } as MenuItemEntity : null;
        }
        if (item.itemType === MenuItemType.POST) {
          const post = item.referenceId ? postById.get(item.referenceId) : null;
          return post ? { ...item, url: item.url ?? `/${menu.languageCode}/posts/${post.slug}` } as MenuItemEntity : null;
        }
        if (item.itemType === MenuItemType.GALLERY) {
          const gallery = item.referenceId ? galleryById.get(item.referenceId) : null;
          return gallery ? { ...item, url: item.url ?? `/${menu.languageCode}/gallery/${gallery.slug}` } as MenuItemEntity : null;
        }
        if (item.itemType === MenuItemType.TENANT_ROUTE) {
          const route = item.referenceId ? tenantRouteById.get(item.referenceId) : null;
          return route ? {
            ...item,
            title: route.titles[menu.languageCode] ?? route.titles.en ?? item.title,
            url: this.resolveTenantRoutePath(route.pathTemplate, menu.languageCode),
            icon: route.icon ?? item.icon,
            cssClass: route.cssClass ?? item.cssClass,
          } as MenuItemEntity : null;
        }
        return item;
      })
      .filter(Boolean) as MenuItemEntity[];
  }

  async getPublicByCode(application: ApplicationEntity, languageCode: string, code: string): Promise<MenuResponseDto> {
    const menu = await this.menuRepo.findOne({
      where: { applicationId: application.id, languageCode, code, status: MenuStatus.ACTIVE },
    });
    if (!menu) {
      throw new NotFoundException('Menu not found.');
    }
    const items = await this.itemRepo.find({ where: { menuId: menu.id } });
    const publicItems = await this.filterPublishedItems(application, menu, items);
    return new MenuResponseDto(
      menu.id,
      menu.applicationId,
      menu.code,
      menu.title,
      menu.location,
      menu.languageCode,
      menu.status,
      this.buildTree(publicItems),
      menu.createdAt.toISOString(),
      menu.updatedAt.toISOString(),
    );
  }

  async getPublicByLocation(application: ApplicationEntity, languageCode: string, location: MenuLocation): Promise<MenuResponseDto[]> {
    const menus = await this.menuRepo.find({
      where: { applicationId: application.id, languageCode, location, status: MenuStatus.ACTIVE },
      order: { updatedAt: 'DESC' },
    });
    return Promise.all(menus.map((menu) => this.getPublicByCode(application, languageCode, menu.code)));
  }
}
