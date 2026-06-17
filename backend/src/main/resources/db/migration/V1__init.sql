-- ============================================================
-- CloudBox initial schema
-- Metadata lives here; file bytes live in MinIO (object_key points to them).
-- ============================================================

create table users (
    id            bigserial primary key,
    email         varchar(255) not null unique,
    password_hash varchar(255) not null,
    display_name  varchar(255) not null,
    storage_used  bigint       not null default 0,
    storage_quota bigint       not null default 1073741824, -- 1 GB
    created_at    timestamptz  not null default now()
);

create table folders (
    id               bigserial primary key,
    owner_id         bigint      not null references users (id) on delete cascade,
    parent_folder_id bigint      references folders (id) on delete cascade,
    name             varchar(255) not null,
    starred          boolean     not null default false,
    deleted_at       timestamptz,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);

create table files (
    id           bigserial primary key,
    owner_id     bigint       not null references users (id) on delete cascade,
    folder_id    bigint       references folders (id) on delete cascade,
    name         varchar(255) not null,
    object_key   varchar(512) not null,
    size         bigint       not null,
    content_type varchar(255),
    starred      boolean      not null default false,
    deleted_at   timestamptz,
    created_at   timestamptz  not null default now(),
    updated_at   timestamptz  not null default now()
);

create table shares (
    id         bigserial primary key,
    file_id    bigint      references files (id) on delete cascade,
    folder_id  bigint      references folders (id) on delete cascade,
    token      varchar(64) not null unique,
    permission varchar(16) not null default 'VIEW',
    expires_at timestamptz,
    created_by bigint      not null references users (id) on delete cascade,
    created_at timestamptz not null default now(),
    -- a share points at exactly one of file or folder
    constraint shares_target_chk check (
        (file_id is not null and folder_id is null) or
        (file_id is null and folder_id is not null)
    )
);

create index idx_folders_owner   on folders (owner_id);
create index idx_folders_parent  on folders (parent_folder_id);
create index idx_files_owner      on files (owner_id);
create index idx_files_folder     on files (folder_id);
create index idx_shares_token     on shares (token);
create index idx_shares_creator   on shares (created_by);
