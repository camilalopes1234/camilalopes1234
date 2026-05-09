"use client";

import { type UserRole } from "@prisma/client";
import { Building2, CheckCircle2, DownloadCloud, Globe2, LoaderCircle, MapPinned, Search, Sparkles, Upload } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OwnerOption = {
  id: string;
  name: string;
};

type SearchResult = {
  provider: "GOOGLE_PLACES";
  mode: "live" | "simulation";
  providerLabel: string;
  message: string;
  searchedAt: string;
  queryLabel: string;
  results: ProspectItem[];
};

type ProspectItem = {
  id: string;
  provider: "GOOGLE_PLACES";
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  region: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  rating: number | null;
  reviewCount: number | null;
  sourceLabel: string;
  duplicateLeadId: string | null;
  duplicateLeadName: string | null;
  qualityScore: number;
};

function exportProspectsCsv(items: ProspectItem[]) {
  const headers = ["Empresa", "Categoria", "Cidade", "Estado", "Telefone", "Site", "Instagram", "Endereco", "Qualidade"];
  const rows = items.map((item) => [
    item.name,
    item.category || "",
    item.city || "",
    item.state || "",
    item.whatsapp || item.phone || "",
    item.website || "",
    item.instagram || "",
    item.address || "",
    item.qualityScore
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "prospeccao-externa.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ProspectingManager({
  owners,
  currentUserRole,
  googlePlacesConfigured
}: {
  owners: OwnerOption[];
  currentUserRole: UserRole | "ADMIN" | "SELLER";
  googlePlacesConfigured: boolean;
}) {
  const [searchPending, startSearchTransition] = useTransition();
  const [importPending, startImportTransition] = useTransition();
  const [searchData, setSearchData] = useState<SearchResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [ownerId, setOwnerId] = useState(owners[0]?.id ?? "");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  const selectedItems = useMemo(
    () => searchData?.results.filter((item) => selectedIds.includes(item.id)) ?? [],
    [searchData, selectedIds]
  );

  const importableItems = useMemo(
    () => searchData?.results.filter((item) => item.whatsapp || item.phone) ?? [],
    [searchData]
  );

  const duplicatesCount = searchData?.results.filter((item) => item.duplicateLeadId).length ?? 0;
  const highQualityCount = searchData?.results.filter((item) => item.qualityScore >= 80).length ?? 0;

  function toggleSelection(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }

  function toggleSelectAll() {
    if (!searchData?.results.length) return;
    if (selectedIds.length === importableItems.length) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds(importableItems.map((item) => item.id));
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <Card className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Nova prospeccao segmentada</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                Monte sua busca por nicho, cidade e regiao. A base entra em pre-analise antes de virar lead dentro do CRM.
              </p>
            </div>
          </div>

          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              setSearchError(null);
              setImportSummary(null);
              const formData = new FormData(event.currentTarget);
              const payload = Object.fromEntries(formData.entries());

              startSearchTransition(async () => {
                const response = await fetch("/api/prospecting/search", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                  const message = data.error ?? "Nao foi possivel buscar prospects.";
                  setSearchError(message);
                  toast.error(message);
                  return;
                }

                setSearchData(data);
                setSelectedIds((data.results as ProspectItem[]).filter((item) => item.whatsapp || item.phone).map((item) => item.id));
                toast.success(data.mode === "live" ? "Busca externa concluida." : "Simulacao pronta para validacao.");
              });
            }}
          >
            <Field label="Provider">
              <Select name="provider" defaultValue="GOOGLE_PLACES">
                <option value="GOOGLE_PLACES">Google Places</option>
              </Select>
            </Field>
            <Field label="Categoria">
              <Input name="category" placeholder="Ex.: clinica de estetica" required />
            </Field>
            <Field label="Cidade">
              <Input name="city" placeholder="Ex.: Sao Paulo" />
            </Field>
            <Field label="Estado">
              <Input name="state" placeholder="Ex.: SP" maxLength={2} />
            </Field>
            <Field label="Regiao/Bairro">
              <Input name="region" placeholder="Ex.: Zona Sul" />
            </Field>
            <Field label="Palavra-chave">
              <Input name="keyword" placeholder="Ex.: harmonizacao facial" />
            </Field>
            <Field label="Raio (km)">
              <Input type="number" name="radiusKm" min={1} max={200} defaultValue={15} />
            </Field>
            <Field label="Limite de resultados">
              <Input type="number" name="resultLimit" min={1} max={25} defaultValue={12} />
            </Field>

            <div className="md:col-span-2 xl:col-span-4 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-slate-50/70 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={googlePlacesConfigured ? "success" : "warning"}>
                  {googlePlacesConfigured ? "Google Places conectado" : "Modo simulacao guiada"}
                </Badge>
                <span className="text-xs text-slate-500">
                  {googlePlacesConfigured
                    ? "A busca usa o provider oficial quando a chave estiver configurada."
                    : "Sem GOOGLE_MAPS_API_KEY no ambiente. A tela continua funcional para desenho do fluxo."}
                </span>
              </div>
              <Button type="submit" disabled={searchPending}>
                {searchPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                Buscar prospects
              </Button>
            </div>
          </form>

          {searchError ? <p className="text-sm text-rose-600">{searchError}</p> : null}
        </Card>

        <div className="space-y-4">
          <Card className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50/70 p-3.5">
              <p className="text-[12px] text-slate-500">Prospects encontrados</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950">{searchData?.results.length ?? 0}</p>
            </div>
            <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-3.5">
              <p className="text-[12px] text-emerald-700">Alta completude</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-950">{highQualityCount}</p>
            </div>
            <div className="rounded-[20px] border border-amber-100 bg-amber-50/70 p-3.5">
              <p className="text-[12px] text-amber-700">Duplicados detectados</p>
              <p className="mt-1 text-2xl font-semibold text-amber-950">{duplicatesCount}</p>
            </div>
            <div className="rounded-[20px] border border-sky-100 bg-sky-50/70 p-3.5">
              <p className="text-[12px] text-sky-700">Selecionados para importar</p>
              <p className="mt-1 text-2xl font-semibold text-sky-950">{selectedIds.length}</p>
            </div>
          </Card>

          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-700" />
              <p className="font-medium text-slate-950">Fluxo da v1</p>
            </div>
            <ol className="space-y-2 text-sm text-slate-600">
              <li>1. Buscar empresas por nicho, cidade e regiao.</li>
              <li>2. Revisar qualidade e duplicidade antes de importar.</li>
              <li>3. Mandar os selecionados direto para leads e campanhas.</li>
            </ol>
          </Card>
        </div>
      </div>

      {searchData ? (
        <Card className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-950">Resultados da prospeccao</h3>
                <Badge tone={searchData.mode === "live" ? "success" : "warning"}>
                  {searchData.mode === "live" ? "Busca real" : "Modo simulado"}
                </Badge>
                <Badge tone="info">{searchData.providerLabel}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-500">{searchData.message}</p>
              <p className="mt-1 text-xs text-slate-400">{searchData.queryLabel}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="ghost" onClick={() => exportProspectsCsv(searchData.results)} disabled={!searchData.results.length}>
                <DownloadCloud className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
              <Button type="button" variant="ghost" onClick={toggleSelectAll} disabled={!importableItems.length}>
                {selectedIds.length === importableItems.length ? "Limpar selecao" : "Selecionar importaveis"}
              </Button>
            </div>
          </div>

          {searchData.results.length === 0 ? (
            <EmptyState
              title="Nenhum prospect encontrado"
              description="Tente trocar categoria, cidade ou palavra-chave. O modulo fica pronto para outros providers depois."
            />
          ) : (
            <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="grid gap-3 md:grid-cols-2">
                {searchData.results.map((item) => {
                  const selectable = Boolean(item.phone || item.whatsapp);
                  const selected = selectedIds.includes(item.id);

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectable && toggleSelection(item.id)}
                      disabled={!selectable}
                      className={cn(
                        "rounded-[22px] border p-4 text-left transition-all",
                        selected ? "border-sky-300 bg-sky-50/80 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300",
                        !selectable && "cursor-not-allowed opacity-70"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-medium text-slate-950">{item.name}</p>
                            {item.duplicateLeadId ? <Badge tone="warning">Ja existe</Badge> : null}
                            {!selectable ? <Badge tone="danger">Sem contato</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{item.category || "Categoria nao identificada"}</p>
                        </div>
                        <div
                          className={cn(
                            "inline-flex h-6 min-w-6 items-center justify-center rounded-full border px-2 text-[11px] font-semibold",
                            item.qualityScore >= 80
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600"
                          )}
                        >
                          {item.qualityScore}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2 text-[13px] text-slate-600">
                        <p className="flex items-center gap-2">
                          <MapPinned className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">
                            {[item.region, item.city, item.state].filter(Boolean).join(" • ") || "Localizacao parcial"}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{item.whatsapp || item.phone || "Sem telefone valido"}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Globe2 className="h-3.5 w-3.5 text-slate-400" />
                          <span className="truncate">{item.website || item.instagram || "Sem site/Instagram"}</span>
                        </p>
                      </div>

                      {item.duplicateLeadName ? (
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
                          Duplicado potencial: {item.duplicateLeadName}
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-4">
                <Card className="space-y-4 border-slate-200 bg-slate-50/70">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-emerald-700" />
                    <p className="font-medium text-slate-950">Importar para Leads</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Responsavel de destino">
                      <Select
                        value={ownerId}
                        onChange={(event) => setOwnerId(event.target.value)}
                        disabled={currentUserRole !== "ADMIN"}
                      >
                        {owners.map((owner) => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <label className="flex items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(event) => setUpdateExisting(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      Atualizar duplicados
                    </label>
                  </div>
                  <div className="rounded-[18px] border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-600">
                    <p>{selectedItems.length} prospects selecionados.</p>
                    <p className="mt-1">{selectedItems.filter((item) => item.duplicateLeadId).length} deles ja existem no CRM.</p>
                  </div>
                  <Button
                    type="button"
                    disabled={!selectedItems.length || importPending}
                    onClick={() => {
                      startImportTransition(async () => {
                        const response = await fetch("/api/prospecting/import", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ownerId,
                            updateExisting,
                            items: selectedItems
                          })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                          toast.error(data.error ?? "Nao foi possivel importar os prospects.");
                          return;
                        }

                        setImportSummary({
                          created: data.created,
                          updated: data.updated,
                          skipped: data.skipped
                        });
                        toast.success(`Importacao concluida: ${data.created} criados, ${data.updated} atualizados.`);
                      });
                    }}
                  >
                    {importPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Importar selecionados
                  </Button>
                </Card>

                <Card className="space-y-3 border-slate-200 bg-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <p className="font-medium text-slate-950">Leitura rapida da base</p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <p>Com telefone valido: {importableItems.length}</p>
                    <p>Com site informado: {searchData.results.filter((item) => item.website).length}</p>
                    <p>Com Instagram: {searchData.results.filter((item) => item.instagram).length}</p>
                    <p>Com rating publico: {searchData.results.filter((item) => item.rating).length}</p>
                  </div>
                  {importSummary ? (
                    <div className="rounded-[18px] border border-emerald-200 bg-emerald-50/80 px-3.5 py-3 text-sm text-emerald-900">
                      Importacao concluida: {importSummary.created} criados, {importSummary.updated} atualizados, {importSummary.skipped} ignorados.
                    </div>
                  ) : null}
                </Card>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          title="Sua prospeccao comecara aqui"
          description="Defina uma categoria, localizacao e termo comercial. O CRM prepara a busca externa, cruza com a base atual e deixa tudo pronto para importar."
        />
      )}
    </div>
  );
}
