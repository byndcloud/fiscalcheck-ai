-- ============================================================
-- FiscoCheck AI — Inicialização do PostgreSQL
-- Aplicado apenas no primeiro start do container.
-- ============================================================

-- Bancos
CREATE DATABASE fiscocheck_test;

-- Conecta no banco principal
\c fiscocheck

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector (embeddings do copilot)
CREATE EXTENSION IF NOT EXISTS "age";     -- Apache AGE (grafo)

-- Carrega AGE para a sessão atual
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- Cria o grafo do FiscoCheck (módulo 2 — graph analytics)
SELECT create_graph('fisco_graph');

-- Repete no banco de teste
\c fiscocheck_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "age";
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT create_graph('fisco_graph');
