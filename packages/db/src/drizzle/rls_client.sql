CREATE USER rls_client
WITH LOGIN PASSWORD 'your_strong_password_for_rls_client';

GRANT anon TO rls_client;

GRANT authenticated TO rls_client;
