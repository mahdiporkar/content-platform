create table if not exists admin_user_system_permissions (
    admin_user_id varchar(36) not null,
    permission varchar(64) not null,
    primary key (admin_user_id, permission),
    constraint fk_admin_user_system_permissions_user
        foreign key (admin_user_id) references admin_users(id) on delete cascade
);

create table if not exists admin_user_service_permissions (
    admin_user_id varchar(36) not null,
    permission varchar(64) not null,
    primary key (admin_user_id, permission),
    constraint fk_admin_user_service_permissions_user
        foreign key (admin_user_id) references admin_users(id) on delete cascade
);
