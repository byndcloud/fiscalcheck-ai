import type { AuditLogEntry } from "@fiscalcheck/shared-types";

/*
  Verificação de integridade da trilha (T19+ · módulo 6 · TR 5.4.9).

  Hash encadeado sobre os campos imutáveis de cada evento, do mais
  antigo ao mais recente: o hash do evento N entra como semente do
  evento N+1. Alterar ou remover qualquer evento passado muda o hash
  final — é isso que torna a imutabilidade DEMONSTRÁVEL em tela, não
  apenas narrada.

  FNV-1a 32 bits é suficiente para o mock (determinístico e síncrono);
  em produção a cadeia usa SHA-256 com âncora externa (ex.: publicação
  periódica do hash em diário oficial).
*/

export const CHAIN_ALGORITHM = "FNV-1a encadeado (mock — produção: SHA-256 ancorado)";

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv1a(input: string, seed: number = FNV_OFFSET): number {
  let hash = seed;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

function entryFingerprint(entry: AuditLogEntry): string {
  return [
    entry.id,
    entry.timestamp,
    entry.action,
    entry.actorId,
    entry.actorRole,
    entry.resource,
    entry.result,
  ].join("|");
}

/**
 * Calcula o hash da cadeia sobre os eventos em ordem cronológica
 * (mais antigo primeiro). A trilha in-memory guarda o mais recente
 * primeiro (`unshift`), então o chamador deve passar o array como
 * está — a inversão acontece aqui para manter a semântica única.
 */
export function computeChainHash(entriesNewestFirst: readonly AuditLogEntry[]): string {
  let hash = FNV_OFFSET;
  for (let i = entriesNewestFirst.length - 1; i >= 0; i -= 1) {
    const entry = entriesNewestFirst[i];
    if (!entry) continue;
    hash = fnv1a(entryFingerprint(entry), hash);
  }
  return hash.toString(16).padStart(8, "0");
}
