-- ============================================================
-- FiscoCheck AI — Inicialização do Apache AGE (OPT-IN, dev local)
--
-- Este arquivo NÃO é aplicado por padrão. É carregado apenas pelo
-- perfil `graph` do docker-compose, ou manualmente por desenvolvedores
-- que queiram testar a implementação `AgeGraphStore` em preparação
-- à migração para nuvem nacional (ver ADR-0002).
--
-- Não execute no Replit Postgres — a extensão `age` não está
-- disponível no ambiente gerenciado.
-- ============================================================

\c fiscocheck

CREATE EXTENSION IF NOT EXISTS "age";
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT create_graph('fisco_graph');

\c fiscocheck_test

CREATE EXTENSION IF NOT EXISTS "age";
LOAD 'age';
SET search_path = ag_catalog, "$user", public;
SELECT create_graph('fisco_graph');
