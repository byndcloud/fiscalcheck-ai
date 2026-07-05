"use client";

import { ChevronDownIcon, LogOutIcon, PencilLineIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type {
  DensityPreference,
  FontSizePreference,
  UserPreferences,
} from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SkeletonText } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useUpdatePreferences, useUserProfile } from "@/hooks/use-user-profile";
import { ROLE_LABEL_PT } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useSession } from "@/stores/session-store";

/*
  Menu do avatar (T27 · Transversal).

  Popover no header com: identidade do usuário logado (nome, papel,
  e-mail, matrícula), dados cadastrais detalhados quando o papel é
  `cidadao`, preferências de interface persistidas na camada de
  serviço fake (tamanho da letra, densidade, notificações) e Sair.

  Usamos Popover (não menu Radix) porque o conteúdo tem controles
  interativos — switches e segmentados — que não devem fechar o
  painel a cada clique, como itens de menu fariam.
*/

const FONT_OPTIONS: readonly { value: FontSizePreference; label: string }[] = [
  { value: "padrao", label: "Padrão" },
  { value: "grande", label: "Grande" },
];

const DENSITY_OPTIONS: readonly { value: DensityPreference; label: string }[] = [
  { value: "confortavel", label: "Confortável" },
  { value: "compacta", label: "Compacta" },
];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return `${first}${last}`.toUpperCase();
}

type SegmentedProps<T extends string> = {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | undefined;
  disabled?: boolean;
  onChange: (value: T) => void;
};

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  disabled,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span aria-hidden="true" className="text-xs text-muted-foreground">
        {label}
      </span>
      <fieldset className="flex rounded-md border border-border bg-n-25 p-0.5">
        <legend className="sr-only">{label}</legend>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                if (!selected) onChange(option.value);
              }}
              className={cn(
                "rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
                selected
                  ? "bg-surface text-brand shadow-[var(--e-1)]"
                  : "text-muted-foreground hover:text-text-strong",
                disabled && "opacity-60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}

export function UserMenu() {
  const router = useRouter();
  const role = useSession((s) => s.role);
  const sessionUser = useSession((s) => s.user);
  const clear = useSession((s) => s.clear);
  const [open, setOpen] = useState(false);

  const profileQuery = useUserProfile();
  const updatePreferences = useUpdatePreferences();

  const profile = profileQuery.data;
  const preferences = profile?.preferencias;
  const fontScale = preferences?.tamanhoFonte;
  const density = preferences?.densidade;

  /*
    Aplica as preferências visuais no <html>. O cleanup devolve o
    padrão ao desmontar (logout leva à tela de login, sem header).
  */
  useEffect(() => {
    const rootEl = document.documentElement;
    if (!fontScale || !density) return;
    rootEl.dataset.fontScale = fontScale;
    rootEl.dataset.density = density;
    return () => {
      delete rootEl.dataset.fontScale;
      delete rootEl.dataset.density;
    };
  }, [fontScale, density]);

  function savePreference(patch: Partial<UserPreferences>) {
    updatePreferences.mutate(patch);
  }

  function handleLogout() {
    setOpen(false);
    clear();
    router.push("/login");
  }

  const displayName = profile?.nome ?? sessionUser?.displayName ?? "Sessão anônima";
  const roleLabel = role ? ROLE_LABEL_PT[role] : "Sem papel";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Abrir menu do usuário — ${displayName}`}
          className={cn(
            "flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-brand-050",
            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
          )}
        >
          <span
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#0c326f,#1351b4)] text-xs font-bold text-white"
          >
            {initialsOf(displayName)}
          </span>
          <span className="hidden text-right sm:grid sm:gap-0">
            <span className="text-xs font-medium text-text-strong leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {roleLabel}
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="hidden size-3.5 text-muted-foreground sm:block"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        {profileQuery.isPending ? (
          <div className="px-4 py-4">
            <SkeletonText lines={3} />
          </div>
        ) : (
          <>
            <header className="flex items-start gap-3 px-4 py-3.5">
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#0c326f,#1351b4)] text-sm font-bold text-white"
              >
                {initialsOf(displayName)}
              </span>
              <div className="grid gap-0.5">
                <p className="text-sm font-semibold text-text-strong leading-tight">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-brand">{roleLabel}</span>
                  {profile?.matricula ? (
                    <>
                      {" · matrícula "}
                      <span className="font-data">{profile.matricula}</span>
                    </>
                  ) : null}
                </p>
              </div>
            </header>

            {/*
              T27+: os dados cadastrais completos moraram na sidebar do
              cidadão; aqui fica só o atalho para a página de edição.
            */}
            {profile?.dadosCadastrais ? (
              <>
                <Separator />
                <div className="px-3 py-2">
                  <Link
                    href="/citizen/dados"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-text-strong",
                      "transition-colors hover:bg-brand-050",
                      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300",
                    )}
                  >
                    <PencilLineIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                    Meus dados cadastrais
                    <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                      ver e editar
                    </span>
                  </Link>
                </div>
              </>
            ) : null}

            <Separator />
            <section aria-label="Preferências" className="grid gap-2.5 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Preferências
              </p>
              <SegmentedControl
                label="Tamanho da letra"
                options={FONT_OPTIONS}
                value={preferences?.tamanhoFonte}
                disabled={updatePreferences.isPending}
                onChange={(value) => savePreference({ tamanhoFonte: value })}
              />
              <SegmentedControl
                label="Densidade da interface"
                options={DENSITY_OPTIONS}
                value={preferences?.densidade}
                disabled={updatePreferences.isPending}
                onChange={(value) => savePreference({ densidade: value })}
              />
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="pref-notifications" className="text-xs text-muted-foreground">
                  Notificações no sino
                </label>
                <Switch
                  id="pref-notifications"
                  checked={preferences?.notificacoesAtivas ?? true}
                  disabled={updatePreferences.isPending}
                  onCheckedChange={(checked) => savePreference({ notificacoesAtivas: checked })}
                />
              </div>
            </section>

            <Separator />
            <div className="px-3 py-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOutIcon aria-hidden="true" />
                Sair
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
