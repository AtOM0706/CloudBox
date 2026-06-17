-- OAuth (Google) support: password becomes optional, add external id.

alter table users alter column password_hash drop not null;
alter table users add column google_id varchar(255) unique;
