"use client";

import { UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";

type OwnerOption = {
  id: string;
  name: string;
};

type ImportFieldOption = {
  value: string;
  label: string;
};

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text: string) {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("O CSV precisa ter cabecalho e pelo menos uma linha.");
  }

  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) ?? []).length;
  const semicolonCount = (firstLine.match(/;/g) ?? []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const headers = splitCsvLine(firstLine, delimiter).map((header, index) => header || `coluna_${index + 1}`);
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line, delimiter);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index] ?? "";
      return acc;
    }, {});
  });

  return { headers, rows };
}

function isCsvFile(file: File) {
  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel";
}

function guessField(header: string) {
  const value = header.trim().toLowerCase();

  if (value.includes("nome")) return "fullName";
  if (value.includes("whatsapp") || value.includes("wpp")) return "whatsapp";
  if (value.includes("telefone") || value.includes("celular") || value === "phone") return "phone";
  if (value.includes("email")) return "email";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("cidade")) return "city";
  if (value.includes("estado") || value === "uf") return "state";
  if (value.includes("empresa")) return "company";
  if (value.includes("origem principal")) return "sourcePrimary";
  if (value.includes("origem")) return "sourceDetail";
  if (value.includes("interesse") || value.includes("servico")) return "mainInterest";
  if (value.includes("valor")) return "potentialValue";
  if (value.includes("respons")) return "ownerId";
  return "ignore";
}

export function CampaignImporter({
  owners,
  importFields,
  currentUserRole
}: {
  owners: OwnerOption[];
  importFields: ImportFieldOption[];
  currentUserRole: "ADMIN" | "SELLER";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaultOwnerId, setDefaultOwnerId] = useState(owners[0]?.id ?? "");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  return (
    <Card className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-slate-950">Importar contatos via CSV</h3>
        <p className="text-sm text-slate-500">
          Suba uma planilha com contatos de campanha, mapeie as colunas e alimente automaticamente os leads que serao usados nos disparos.
        </p>
      </div>

      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50/80 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-slate-950">{fileName || "Nenhum arquivo selecionado"}</p>
              <p className="text-sm text-slate-500">Aceita CSV separado por virgula ou ponto e virgula.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;

                setError(null);
                setFileName(file.name);

                if (!isCsvFile(file)) {
                  setHeaders([]);
                  setRows([]);
                  setMapping({});
                  setError("Esse modulo aceita apenas arquivos .csv. Se sua planilha estiver em .xlsx, abra no Excel e salve como CSV antes de importar.");
                  toast.error("Arquivo invalido. Use um CSV.");
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                  return;
                }

                file
                  .text()
                  .then((text) => {
                    const parsed = parseCsv(text);
                    setHeaders(parsed.headers);
                    setRows(parsed.rows);
                    setMapping(
                      parsed.headers.reduce<Record<string, string>>((acc, header) => {
                        acc[header] = guessField(header);
                        return acc;
                      }, {})
                    );
                    toast.success("CSV carregado. Revise o mapeamento antes de importar.");
                  })
                  .catch((parseError: Error) => {
                    setHeaders([]);
                    setRows([]);
                    setMapping({});
                    setError(parseError.message);
                    toast.error(parseError.message);
                  });
              }}
            />
            <Button type="button" variant="ghost" onClick={() => inputRef.current?.click()}>
              Escolher CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Responsavel padrao dos contatos">
          <Select value={defaultOwnerId} onChange={(event) => setDefaultOwnerId(event.target.value)} disabled={currentUserRole !== "ADMIN"}>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Contatos ja existentes">
          <Select value={String(updateExisting)} onChange={(event) => setUpdateExisting(event.target.value === "true")}>
            <option value="true">Atualizar quando encontrar telefone/WhatsApp/email</option>
            <option value="false">Pular duplicados</option>
          </Select>
        </Field>
      </div>

      {headers.length > 0 ? (
        <div className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <p className="font-medium text-slate-950">Mapeamento de colunas</p>
            <p className="mt-1 text-sm text-slate-500">Revise cada coluna e diga ao CRM o que ela representa.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {headers.map((header) => (
                <div key={header} className="rounded-[20px] border border-slate-100 bg-slate-50/70 p-3">
                  <p className="mb-2 text-sm font-medium text-slate-900">{header}</p>
                  <Select value={mapping[header] ?? "ignore"} onChange={(event) => setMapping((current) => ({ ...current, [header]: event.target.value }))}>
                    {importFields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">Pre-visualizacao</p>
                <p className="text-sm text-slate-500">Primeiras {previewRows.length} linhas do arquivo.</p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">{rows.length} linhas lidas</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="px-3 py-2 text-left font-medium text-slate-500">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((row, index) => (
                    <tr key={`${row[headers[0]]}-${index}`}>
                      {headers.map((header) => (
                        <td key={`${header}-${index}`} className="px-3 py-2 text-slate-700">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="flex justify-end">
        <Button
          type="button"
          disabled={isPending || rows.length === 0}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const response = await fetch("/api/import/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  rows,
                  mapping,
                  defaultOwnerId,
                  updateExisting
                })
              });
              const data = await response.json();

              if (!response.ok) {
                setError(data.error ?? "Nao foi possivel importar os contatos.");
                toast.error(data.error ?? "Nao foi possivel importar os contatos.");
                return;
              }

              toast.success(`Importacao concluida: ${data.created} criados, ${data.updated} atualizados e ${data.skipped} ignorados.`);
              if (Array.isArray(data.errors) && data.errors.length > 0) {
                toast.message(`Algumas linhas foram ignoradas. Ex.: ${data.errors[0]}`);
              }
              router.refresh();
            });
          }}
        >
          {isPending ? "Importando..." : "Importar contatos"}
        </Button>
      </div>
    </Card>
  );
}
