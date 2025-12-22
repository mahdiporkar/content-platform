create table applications (
    id varchar(36) primary key,
    name varchar(255) not null
);

create table admin_users (
    id varchar(36) primary key,
    email varchar(255) not null unique,
    password_hash varchar(255) not null
);

create table admin_user_applications (
    admin_user_id varchar(36) not null,
    application_id varchar(36) not null,
    primary key (admin_user_id, application_id),
    constraint fk_admin_user_apps_user foreign key (admin_user_id) references admin_users(id) on delete cascade,
    constraint fk_admin_user_apps_app foreign key (application_id) references applications(id) on delete cascade
);

create table posts (
    id varchar(36) primary key,
    application_id varchar(36) not null,
    title varchar(255) not null,
    slug varchar(255) not null,
    content text not null,
    status varchar(16) not null,
    published_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint fk_posts_app foreign key (application_id) references applications(id) on delete cascade,
    constraint uq_posts_app_slug unique (application_id, slug)
);

create index idx_posts_app_status_published_at on posts (application_id, status, published_at desc);

create table articles (
    id varchar(36) primary key,
    application_id varchar(36) not null,
    title varchar(255) not null,
    slug varchar(255) not null,
    content text not null,
    status varchar(16) not null,
    published_at timestamptz,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint fk_articles_app foreign key (application_id) references applications(id) on delete cascade,
    constraint uq_articles_app_slug unique (application_id, slug)
);

create index idx_articles_app_status_published_at on articles (application_id, status, published_at desc);

create table videos (
    id varchar(36) primary key,
    application_id varchar(36) not null,
    title varchar(255) not null,
    description text,
    status varchar(16) not null,
    published_at timestamptz,
    object_key varchar(512) not null,
    content_type varchar(255) not null,
    size_bytes bigint not null,
    created_at timestamptz not null,
    updated_at timestamptz not null,
    constraint fk_videos_app foreign key (application_id) references applications(id) on delete cascade
);

create index idx_videos_app_status_published_at on videos (application_id, status, published_at desc);
