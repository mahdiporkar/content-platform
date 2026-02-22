alter table posts
    add column if not exists locale varchar(5);

update posts
set locale = 'fa'
where locale is null or trim(locale) = '';

alter table posts
    alter column locale set not null;

alter table posts
    alter column locale set default 'fa';

alter table articles
    add column if not exists locale varchar(5);

update articles
set locale = 'fa'
where locale is null or trim(locale) = '';

alter table articles
    alter column locale set not null;

alter table articles
    alter column locale set default 'fa';

alter table videos
    add column if not exists locale varchar(5);

update videos
set locale = 'fa'
where locale is null or trim(locale) = '';

alter table videos
    alter column locale set not null;

alter table videos
    alter column locale set default 'fa';
