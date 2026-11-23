export type MotivoForaExpediente = "feriado" | "fim_de_semana" | null;

const TIMEZONE_BR = "America/Fortaleza";

// Feriados fixos (MM-DD): nacionais + Piauí/Teresina
const FERIADOS_FIXOS = new Set<string>([
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "08-16", // Aniversário de Teresina
  "09-07", // Independência do Brasil
  "10-12", // Nossa Senhora Aparecida
  "10-19", // Dia do Piauí
  "11-02", // Finados
  "11-15", // Proclamação da República
  "11-20", // Dia da Consciência Negra
  "12-08", // Nossa Senhora da Conceição (Teresina)
  "12-25", // Natal
]);

/** Calcula a data da Páscoa gregoriana (algoritmo Meeus/Jones/Butcher) em UTC. */
function calcularPascoaUTC(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function formatMonthDayUTC(date: Date): string {
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${m}-${d}`;
}

function addDaysUTC(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Retorna os feriados móveis do ano em "MM-DD" (Carnaval, Sexta-feira Santa e Corpus Christi). */
function getFeriadosMoveis(year: number): Set<string> {
  const pascoa = calcularPascoaUTC(year);
  return new Set<string>([
    formatMonthDayUTC(addDaysUTC(pascoa, -48)), // Segunda de Carnaval
    formatMonthDayUTC(addDaysUTC(pascoa, -47)), // Terça de Carnaval
    formatMonthDayUTC(addDaysUTC(pascoa, -2)),  // Sexta-feira Santa
    formatMonthDayUTC(addDaysUTC(pascoa, 60)),  // Corpus Christi
  ]);
}

function getDatePartsBR(date: Date): {
  year: number;
  mmdd: string;
  weekday: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE_BR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }

  return {
    year: Number(map.year),
    mmdd: `${map.month}-${map.day}`,
    weekday: map.weekday,
  };
}

/**
 * Verifica se a data (no fuso de Teresina/Brasília) cai em feriado ou final de semana.
 */
export function getMotivoForaExpediente(
  date: Date = new Date()
): MotivoForaExpediente {
  const { year, mmdd, weekday } = getDatePartsBR(date);

  if (FERIADOS_FIXOS.has(mmdd) || getFeriadosMoveis(year).has(mmdd)) {
    return "feriado";
  }

  if (weekday === "Sat" || weekday === "Sun") {
    return "fim_de_semana";
  }

  return null;
}

/**
 * Retorna a mensagem final da qualificação (Etapa 6/6), adaptando o texto
 * automaticamente em finais de semana e feriados.
 */
export function getMensagemConclusao(
  msgPadrao: string,
  nomeEmpresa = "EBS Engenharia e Energia Solar",
  date: Date = new Date()
): string {
  const motivo = getMotivoForaExpediente(date);
  if (!motivo) return msgPadrao;

  const empresa = (nomeEmpresa || "EBS Engenharia e Energia Solar").trim();

  if (motivo === "feriado") {
    return (
      "Excelente! Suas informações foram registradas com sucesso ✅\n\n" +
      `Como hoje é feriado, nosso time de consultores da ${empresa} pode demorar um pouquinho mais para responder. Assim que retomarmos o expediente, entraremos em contato com a sua proposta personalizada! ☀️`
    );
  }

  return (
    "Excelente! Suas informações foram registradas com sucesso ✅\n\n" +
    `Como estamos em final de semana, nosso time de consultores da ${empresa} pode demorar um pouquinho mais para responder. Assim que retomarmos o expediente, entraremos em contato com a sua proposta personalizada! ☀️`
  );
}
