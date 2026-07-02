-- ============================================================
-- FiscalCheck AI — Inicialização do PostgreSQL (MVP)
-- Aplicado apenas no primeiro start do container.
--
-- Habilita o subconjunto de extensões que roda no Replit Postgres
-- gerenciado e em qualquer Postgres 16 padrão. Para a stack
-- completa com Apache AGE (apenas dev local), aplique também
-- postgres-init-age.sql via perfil docker-compose `graph`
-- (ver ADR-0002).
-- ============================================================

-- Bancos
CREATE DATABASE fiscalcheck_test;

-- Conecta no banco principal
\c fiscalcheck

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector (embeddings do copilot)

-- Repete no banco de teste
\c fiscalcheck_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
