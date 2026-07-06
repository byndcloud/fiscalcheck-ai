"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, LoaderCircleIcon, SettingsIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { type Role, RoleSchema } from "@fiscalcheck/shared-types";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABEL_PT, homeRouteForRole } from "@/lib/roles";
import { useSession } from "@/stores/session-store";

/*
  Formulário de acesso.
  - Login (email ou CPF/CNPJ), Senha (com toggle visibilidade)
  - Botão Entrar dispara mock: seta role em useSession e redireciona.
  - Popover oculto (SettingsIcon) revela o Select de perfil — default `auditor`.
  - Validação com Zod. Mensagens em pt-BR.
*/

const LoginSchema = z.object({
  identifier: z.string().min(3, "Informe seu login (e-mail ou CPF/CNPJ).").max(100),
  password: z.string().min(4, "Informe uma senha de ao menos 4 caracteres."),
  role: RoleSchema,
});

type LoginFormValues = z.infer<typeof LoginSchema>;

const ROLE_OPTIONS: readonly { value: Role; label: string }[] = [
  { value: "auditor", label: ROLE_LABEL_PT.auditor },
  { value: "supervisor", label: ROLE_LABEL_PT.supervisor },
  { value: "admin", label: ROLE_LABEL_PT.admin },
  { value: "cidadao", label: ROLE_LABEL_PT.cidadao },
];

export function LoginForm() {
  const router = useRouter();
  const setRole = useSession((s) => s.setRole);
  const [showPassword, setShowPassword] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [govBrLoading, setGovBrLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: "",
      password: "",
      role: "auditor",
    },
  });

  const selectedRole = form.watch("role");

  async function onSubmit(values: LoginFormValues) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    setRole(values.role);
    toast.success("Bem-vindo(a) ao FiscalCheck AI");
    router.push(homeRouteForRole(values.role));
  }

  async function handleGovBrLogin() {
    setGovBrLoading(true);
    // Simula o redirect de OAuth do gov.br — em produção será o fluxo real.
    // Autentica no perfil ativo (engrenagem), disponível para todos os papéis.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRole(selectedRole);
    toast.success("Identificação gov.br confirmada.");
    router.push(homeRouteForRole(selectedRole));
  }

  return (
    <div className="grid gap-6">
      <Image
        src="/brand/logo-horizontal.png"
        alt="FiscalCheck AI — Inteligência fiscal agêntica"
        width={1536}
        height={640}
        priority
        sizes="(min-width: 768px) 320px, 260px"
        className="h-auto w-[260px] md:w-[320px]"
      />

      <div className="grid gap-1.5">
        <h2 className="font-display text-2xl font-semibold text-text-strong">Acesse sua conta</h2>
        <p className="text-sm text-muted-foreground">
          Autentique-se com suas credenciais institucionais para continuar.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Login</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="username"
                    inputMode="email"
                    placeholder="seu.email@brusque.sc.gov.br ou CPF/CNPJ"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Senha</FormLabel>
                  <button
                    type="button"
                    onClick={() =>
                      toast.info("Recuperação de senha estará disponível em produção.")
                    }
                    className="text-xs font-medium text-brand hover:underline focus-visible:outline-none focus-visible:underline"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pr-10"
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 grid w-9 place-items-center rounded-sm text-muted-foreground hover:text-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-300"
                    >
                      {showPassword ? (
                        <EyeOffIcon aria-hidden="true" className="size-4" />
                      ) : (
                        <EyeIcon aria-hidden="true" className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="mt-2 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </Button>

          {/* T16 — acesso via conta gov.br (mock), disponível para qualquer perfil. */}
          <div aria-hidden="true" className="h-px w-full bg-border" />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={govBrLoading || form.formState.isSubmitting}
            onClick={handleGovBrLogin}
          >
            {govBrLoading ? (
              <>
                <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                Conectando ao gov.br…
              </>
            ) : (
              <>
                Entrar com <span className="font-extrabold tracking-tight text-brand">gov.br</span>
                <span className="sr-only">(simulação para demonstração)</span>
              </>
            )}
          </Button>
        </form>
      </Form>

      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <p>
          Perfil ativo:{" "}
          <span className="font-medium text-text-strong">{ROLE_LABEL_PT[selectedRole]}</span>
        </p>
        <Popover open={profileOpen} onOpenChange={setProfileOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              aria-label="Selecionar perfil de acesso"
              className="text-[11px]"
            >
              <SettingsIcon aria-hidden="true" />
              Perfil
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 space-y-3">
            <div>
              <p className="text-sm font-semibold text-text-strong">Perfil de acesso</p>
              <p className="text-xs text-muted-foreground">
                Escolha o papel que será aplicado após entrar. Em produção, o papel virá do provedor
                de identidade institucional.
              </p>
            </div>
            <Select
              value={selectedRole}
              onValueChange={(value) => form.setValue("role", value as Role, { shouldDirty: true })}
            >
              <SelectTrigger aria-label="Perfil de acesso">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
