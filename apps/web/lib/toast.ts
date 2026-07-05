import { toast as sonnerToast } from "sonner";

import { resolveErrorMessage } from "@/lib/errors";

/*
  Ponto único de disparo de toast do FiscalCheck AI (T25 — módulo
  transversal). Fica sobre o `sonner` (que já está integrado em
  providers.tsx via components/ui/sonner.tsx). Motivos para envolver:

    1. `notifyApiError(error)` centraliza o mapeamento de `ApiError`
       → mensagem amigável pt-BR (ver lib/errors.ts). Nenhum consumidor
       precisa lidar com stack, status ou code cru.
    2. Preserva assinatura idiomática: `notify.success`, `.error`,
       `.warning`, `.info` — os mesmos 4 tipos que o DS define.
    3. Sonner cuida de fila, auto-dismiss, `role=status`/`role=alert`,
       `aria-live` e botão de fechar por padrão.

  Não substituímos o `toast` do sonner — quem tem código legado com
  `import { toast } from "sonner"` continua funcionando. O `notify`
  daqui é apenas o caminho recomendado a partir do T25.
*/

export type ToastOptions = {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
};

function normalize(options?: ToastOptions) {
  if (!options) return undefined;
  return {
    description: options.description,
    duration: options.duration,
    action: options.action
      ? { label: options.action.label, onClick: options.action.onClick }
      : undefined,
  };
}

export const notify = {
  success(message: string, options?: ToastOptions): string | number {
    return sonnerToast.success(message, normalize(options));
  },
  error(message: string, options?: ToastOptions): string | number {
    return sonnerToast.error(message, normalize(options));
  },
  warning(message: string, options?: ToastOptions): string | number {
    return sonnerToast.warning(message, normalize(options));
  },
  info(message: string, options?: ToastOptions): string | number {
    return sonnerToast.info(message, normalize(options));
  },
  /**
   * Converte qualquer erro (ApiError, Error, unknown) em toast de erro
   * seguro. **Sempre** use este helper em mutation.onError e no
   * `QueryClient` global — nunca `toast.error(error.message)` cru.
   */
  apiError(error: unknown, extra?: ToastOptions): string | number {
    const resolved = resolveErrorMessage(error);
    return sonnerToast.error(resolved.title, {
      description: extra?.description ?? resolved.description,
      duration: extra?.duration,
      action: extra?.action
        ? { label: extra.action.label, onClick: extra.action.onClick }
        : undefined,
    });
  },
  dismiss(id?: string | number): void {
    sonnerToast.dismiss(id);
  },
};

export type Notify = typeof notify;
