"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { roleLabels } from "@/lib/constants";

type UserFormValues = {
  id?: string;
  name?: string;
  email?: string;
  title?: string | null;
  role?: UserRole;
  isActive?: boolean;
};

export function UserForm({
  initialValues,
  submitLabel,
  title,
  description,
  disableRole = false,
  disableStatus = false
}: {
  initialValues?: UserFormValues;
  submitLabel: string;
  title: string;
  description: string;
  disableRole?: boolean;
  disableStatus?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          const formData = new FormData(event.currentTarget);
          const payload = Object.fromEntries(formData.entries());

          startTransition(async () => {
            const response = await fetch(initialValues?.id ? `/api/users/${initialValues.id}` : "/api/users", {
              method: initialValues?.id ? "PATCH" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
              const message = data.error ?? "Nao foi possivel salvar o usuario.";
              setError(message);
              toast.error(message);
              return;
            }

            toast.success(initialValues?.id ? "Usuario atualizado com sucesso." : "Usuario criado com sucesso.");
            if (!initialValues?.id) {
              event.currentTarget.reset();
            }
            router.refresh();
          });
        }}
      >
        <Field label="Nome">
          <Input name="name" defaultValue={initialValues?.name ?? ""} required />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" defaultValue={initialValues?.email ?? ""} required />
        </Field>
        <Field label="Cargo">
          <Input name="title" defaultValue={initialValues?.title ?? ""} placeholder="Executivo comercial, gerente..." />
        </Field>
        <Field label="Perfil">
          <Select
            name="role"
            defaultValue={initialValues?.role ?? UserRole.SELLER}
            disabled={disableRole}
            className={disableRole ? "cursor-not-allowed opacity-70" : undefined}
          >
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={initialValues?.id ? "Nova senha" : "Senha"}>
          <Input
            name="password"
            type="password"
            defaultValue=""
            required={!initialValues?.id}
            placeholder={initialValues?.id ? "Deixe em branco para manter" : "Minimo de 8 caracteres"}
          />
        </Field>
        <Field label="Status">
          <Select
            name="isActive"
            defaultValue={String(initialValues?.isActive ?? true)}
            disabled={disableStatus}
            className={disableStatus ? "cursor-not-allowed opacity-70" : undefined}
          >
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </Select>
        </Field>

        {error ? <p className="md:col-span-2 text-sm text-rose-600">{error}</p> : null}

        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Salvando..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
