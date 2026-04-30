import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/components/forms/login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(96,165,250,0.18),transparent_30%)]" />
        <div className="relative">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-200/80">Premium Sales CRM</p>
          <h1 className="mt-8 max-w-xl text-5xl font-semibold leading-tight">
            Operação comercial premium para equipes que vendem com método.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Gerencie leads, pipeline, follow-ups e oportunidades com uma interface pronta para uso real e preparada para escalar.
          </p>
        </div>
        <div className="relative grid gap-4">
          {["Pipeline consultivo em Kanban", "Agenda comercial com follow-ups", "Dashboard executivo por usuário"].map((item) => (
            <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
