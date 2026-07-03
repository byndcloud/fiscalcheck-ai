"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  type Role,
  RoleSchema,
  type SystemUser,
  type SystemUserStatus,
  SystemUserStatusSchema,
  type UserCreateRequest,
  UserCreateRequestSchema,
  type UserUpdateRequest,
} from "@fiscalcheck/shared-types";
import { z } from "zod";

import { StepUpMfaDialog } from "@/components/compliance/step-up-mfa-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, apiRequest } from "@/lib/api-client";
import { useSession } from "@/stores/session-store";

/*
  Diálogo de criação/edição de usuário (T19 · módulo 6).

  Fluxo:
   1. Admin abre o dialog, preenche os campos, submete;
   2. RHF+Zod valida (mesmo schema server-side do `UserCreateRequest`);
   3. Antes de enviar o PATCH/POST, abrimos o `StepUpMfaDialog`;
   4. Ao confirmar o MFA, disparamos a mutation com o header
      `X-Actor-Role: admin` (MSW recusa qualquer outro papel).

  Schema de edição relaxa `mfaHabilitado` e permite alterar `status`
  (que não existe no create). Refinamento pt-BR mantém a regra
  "papéis internos precisam de MFA".
*/

const INTERNAL_ROLES: readonly Role[] = ["auditor", "supervisor", "admin"] as const;

const UserFormSchema = z
  .object({
    nome: z.string().trim().min(2, "Nome muito curto."),
    email: z.string().email("E-mail inválido."),
    matricula: z.string().trim().min(3, "Matrícula muito curta."),
    role: RoleSchema,
    status: SystemUserStatusSchema,
    mfaHabilitado: z.boolean(),
    observacoes: z.string().trim().max(280, "Máximo 280 caracteres.").optional(),
  })
  .refine(
    (data) => !(INTERNAL_ROLES as readonly Role[]).includes(data.role) || data.mfaHabilitado,
    {
      message: "Papéis internos exigem MFA habilitado.",
      path: ["mfaHabilitado"],
    },
  );

type UserFormValues = z.infer<typeof UserFormSchema>;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "auditor", label: "Auditor Fiscal" },
  { value: "supervisor", label: "Gestor" },
  { value: "admin", label: "Administrador" },
  { value: "cidadao", label: "Cidadão" },
  { value: "agente_sistema", label: "Agente do sistema" },
];

const STATUS_OPTIONS: { value: SystemUserStatus; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "suspenso", label: "Suspenso" },
  { value: "inativo", label: "Inativo" },
];

const CREATE_DEFAULTS: UserFormValues = {
  nome: "",
  email: "",
  matricula: "",
  role: "auditor",
  status: "ativo",
  mfaHabilitado: true,
  observacoes: "",
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: SystemUser | null;
};

export function UserFormDialog({ open, onOpenChange, user }: Props) {
  const mode = user ? "edit" : "create";
  const role = useSession((s) => s.role);
  const actorUser = useSession((s) => s.user);
  const queryClient = useQueryClient();
  const [mfaOpen, setMfaOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<UserFormValues | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: CREATE_DEFAULTS,
  });

  useEffect(() => {
    if (!open) return;
    if (user) {
      form.reset({
        nome: user.nome,
        email: user.email,
        matricula: user.matricula,
        role: user.role,
        status: user.status,
        mfaHabilitado: user.mfaHabilitado,
        observacoes: user.observacoes ?? "",
      });
    } else {
      form.reset(CREATE_DEFAULTS);
    }
    setPendingValues(null);
    setMfaOpen(false);
  }, [open, user, form]);

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      const headers = {
        "X-Actor-Role": role ?? "admin",
        "X-Actor-Id": actorUser?.id ?? "mock-admin",
        "X-Actor-Name": actorUser?.displayName ?? "Administrador",
      } as const;

      if (mode === "create") {
        const payload: UserCreateRequest = UserCreateRequestSchema.parse({
          nome: values.nome,
          email: values.email,
          matricula: values.matricula,
          role: values.role,
          mfaHabilitado: values.mfaHabilitado,
          observacoes: values.observacoes || undefined,
        });
        return apiRequest<SystemUser>("/users", {
          method: "POST",
          body: payload,
          headers,
        });
      }

      if (!user) throw new Error("Usuário ausente para edição.");
      const payload: UserUpdateRequest = {
        nome: values.nome !== user.nome ? values.nome : undefined,
        email: values.email !== user.email ? values.email : undefined,
        matricula: values.matricula !== user.matricula ? values.matricula : undefined,
        role: values.role !== user.role ? values.role : undefined,
        status: values.status !== user.status ? values.status : undefined,
        mfaHabilitado:
          values.mfaHabilitado !== user.mfaHabilitado ? values.mfaHabilitado : undefined,
        observacoes:
          (values.observacoes || undefined) !== user.observacoes
            ? values.observacoes || undefined
            : undefined,
      };
      const hasChanges = Object.values(payload).some((v) => v !== undefined);
      if (!hasChanges) {
        return user;
      }
      return apiRequest<SystemUser>(`/users/${user.id}`, {
        method: "PATCH",
        body: payload,
        headers,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["compliance", "users"] });
      queryClient.invalidateQueries({ queryKey: ["compliance", "audit-log-v2"] });
      toast.success(
        mode === "create" ? `Usuário ${data.nome} criado.` : `Usuário ${data.nome} atualizado.`,
      );
      onOpenChange(false);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Falha ao salvar usuário.";
      toast.error(message);
    },
  });

  const onSubmit = (values: UserFormValues) => {
    setPendingValues(values);
    setMfaOpen(true);
  };

  const handleMfaConfirmed = () => {
    if (!pendingValues) return;
    setMfaOpen(false);
    mutation.mutate(pendingValues);
  };

  const dialogTitle = mode === "create" ? "Novo usuário" : `Editar ${user?.nome ?? ""}`;
  const dialogDescription =
    mode === "create"
      ? "Cadastro operacional. Todo novo usuário exige step-up MFA do Administrador."
      : "Alterações registram evento na trilha de auditoria e exigem step-up MFA.";

  return (
    <>
      <Dialog
        open={open && !mfaOpen}
        onOpenChange={(next) => (!mutation.isPending ? onOpenChange(next) : null)}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-4"
              noValidate
              id="user-form"
            >
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail institucional</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="matricula"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matrícula</FormLabel>
                      <FormControl>
                        <Input autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Papel</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
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
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={mode === "create"}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mfaHabilitado"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-start gap-2 rounded-[var(--r-md)] border border-border bg-n-50/40 p-3">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                          id="mfa-toggle"
                          className="mt-0.5"
                        />
                      </FormControl>
                      <div className="grid gap-0.5">
                        <Label htmlFor="mfa-toggle" className="cursor-pointer text-[13px]">
                          MFA obrigatório para este usuário
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Auditor, Gestor e Administrador exigem MFA. Cidadãos autenticam via
                          gov.br; agentes usam credenciais de serviço.
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={2} maxLength={280} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" form="user-form" variant="default" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Salvando…"
                : mode === "create"
                  ? "Continuar com MFA"
                  : "Salvar com MFA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StepUpMfaDialog
        open={mfaOpen}
        onOpenChange={setMfaOpen}
        onConfirmed={handleMfaConfirmed}
        isPending={mutation.isPending}
        actionLabel={mode === "create" ? "criar o novo usuário" : "salvar as alterações"}
      />
    </>
  );
}
