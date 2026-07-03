/*
  Máscaras de dados sensíveis (T19 · módulo 6).

  Todo dado identificável de contribuinte (CPF, CNPJ) e todo IP de
  origem devem ser mascarados por padrão nas visualizações da trilha,
  do dossiê e do agente. A revelação (`data-sensitive` + botão
  explícito no drill-in) é uma AÇÃO auditada — jamais implícita.

  Estas funções são puras e reversíveis somente pelo backend real; no
  mock, "revelar" apenas retorna o valor original que já veio no
  fixture, e a intenção é registrada como evento próprio na trilha.
*/

/*
  Mantém apenas dígitos e mascara o miolo. Padrão brasileiro:
  CPF  vira 000.[***].[***]-00
  CNPJ vira 00.[***].[***]/[****]-00
  Fallback: mantém últimos 4 dígitos.
*/
export function maskCpf(cpfRaw: string): string {
  const digits = cpfRaw.replace(/\D/g, "");
  if (digits.length !== 11) return maskGenericDocument(digits);
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
}

export function maskCnpj(cnpjRaw: string): string {
  const digits = cnpjRaw.replace(/\D/g, "");
  if (digits.length !== 14) return maskGenericDocument(digits);
  return `${digits.slice(0, 2)}.***.***/****-${digits.slice(12)}`;
}

function maskGenericDocument(digits: string): string {
  if (digits.length <= 4) return "***";
  const tail = digits.slice(-4);
  return `***.***.${tail}`;
}

/*
  IPv4 → mantém os dois primeiros octetos legíveis (rede) e mascara os
  dois últimos (host). O objetivo é permitir análise de origem sem
  exposição direta do endpoint específico.

  Ex.: `200.19.42.88` → `200.19.***.**`
*/
export function maskIp(ipRaw: string): string {
  const parts = ipRaw.trim().split(".");
  if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p))) return "***.***.***.***";
  return `${parts[0]}.${parts[1]}.***.**`;
}

/*
  Escolhe automaticamente a máscara apropriada quando o formato é
  ambíguo (texto livre do `dadosAcessados`). Retorna o valor mascarado
  para o primeiro padrão que casar; caso contrário, devolve o texto
  original — a UI é responsável por marcar visualmente.
*/
const CPF_PATTERN = /\d{3}\.\d{3}\.\d{3}-\d{2}/g;
const CNPJ_PATTERN = /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g;
const IP_PATTERN = /(?:\d{1,3}\.){3}\d{1,3}/g;

export function maskSensitiveText(text: string): string {
  return text
    .replace(CNPJ_PATTERN, (m) => maskCnpj(m))
    .replace(CPF_PATTERN, (m) => maskCpf(m))
    .replace(IP_PATTERN, (m) => maskIp(m));
}
