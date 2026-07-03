import {
  GlobeIcon,
  type LucideIcon,
  MailIcon,
  MessageCircleIcon,
  SmartphoneIcon,
} from "lucide-react";

import type { CanalComunicacao } from "@fiscalcheck/shared-types";

import { cn } from "@/lib/utils";

/*
  Ícone + label canônicos por canal (T15). Reutilizado no filtro, na
  linha da tabela e no header do drill-in — mantém identidade visual
  consistente. Cores em tokens do DS (nunca hex avulso).
*/

const META: Record<
  CanalComunicacao,
  { label: string; Icon: LucideIcon; toneClass: string; bgClass: string; ariaLabel: string }
> = {
  portal: {
    label: "Portal",
    Icon: GlobeIcon,
    toneClass: "text-brand",
    bgClass: "bg-brand-050",
    ariaLabel: "Portal do Contribuinte",
  },
  email: {
    label: "E-mail",
    Icon: MailIcon,
    toneClass: "text-[color:var(--c-risk-3)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-3)_14%,var(--surface))]",
    ariaLabel: "E-mail",
  },
  sms: {
    label: "SMS",
    Icon: SmartphoneIcon,
    toneClass: "text-[color:var(--c-risk-4)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-4)_14%,var(--surface))]",
    ariaLabel: "SMS",
  },
  whatsapp: {
    label: "WhatsApp",
    Icon: MessageCircleIcon,
    toneClass: "text-[color:var(--c-risk-2)]",
    bgClass: "bg-[color-mix(in_srgb,var(--c-risk-2)_14%,var(--surface))]",
    ariaLabel: "WhatsApp",
  },
};

type Props = {
  canal: CanalComunicacao;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
};

export function ChannelIcon({ canal, size = "sm", showLabel = false, className }: Props) {
  const meta = META[canal];
  const Icon = meta.Icon;
  const isSm = size === "sm";
  return (
    <span className={cn("inline-flex items-center gap-2", className)} aria-label={meta.ariaLabel}>
      <span
        aria-hidden="true"
        className={cn(
          "grid place-items-center rounded-md",
          meta.bgClass,
          meta.toneClass,
          isSm ? "size-7" : "size-9",
        )}
      >
        <Icon className={isSm ? "size-3.5" : "size-4"} />
      </span>
      {showLabel ? (
        <span className={cn("font-medium text-foreground", isSm ? "text-xs" : "text-sm")}>
          {meta.label}
        </span>
      ) : null}
    </span>
  );
}

export const CHANNEL_LABEL: Record<CanalComunicacao, string> = {
  portal: META.portal.label,
  email: META.email.label,
  sms: META.sms.label,
  whatsapp: META.whatsapp.label,
};
