import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Página "em breve" bem desenhada, com prévia das funcionalidades futuras. */
export function ComingSoon({
  icon: Icon,
  eyebrow,
  title,
  description,
  features,
  preview,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  features: { icon: LucideIcon; title: string; text: string }[];
  preview?: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-[radial-gradient(circle,rgb(59_130_246/0.45),transparent_65%)]" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-80 rounded-full bg-[radial-gradient(circle,rgb(251_191_36/0.18),transparent_65%)]" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-200 ring-1 ring-inset ring-white/15">
              <Sparkles className="size-3.5" /> {eyebrow}
            </span>
            <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-400">{description}</p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 ring-1 ring-inset ring-white/10">
              <span className="size-1.5 rounded-full bg-amber-400" /> Em desenvolvimento · próxima fase
            </span>
          </div>
          <div className="relative">
            {preview ?? (
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-white/5 ring-1 ring-inset ring-white/10">
                <Icon className="size-16 text-blue-300/70" />
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {features.map((f, i) => (
          <article
            key={f.title}
            style={{ animationDelay: `${i * 60}ms` }}
            className={cn(
              "animate-fade-up rounded-2xl border border-slate-200/70 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-brand">
              <f.icon className="size-5" />
            </span>
            <h2 className="mt-4 font-display text-base font-bold text-slate-900">{f.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
