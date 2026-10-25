import { db } from "@/db";
import { configuracoesSistema } from "@/db/schema";

export interface SystemConfig {
  id: string;
  empresaId: string;
  nomeEmpresa: string;
  nomeConsultor: string;
  msgBoasVindas: string;
  msgConclusao: string;
  percentualEconomia: number;
  multiplicadorProposta: number;
  valorMinimoLeadQuente: number;
  iaAtiva24h: boolean;
  pedirFotoConta: boolean;
  notificarLeadQuente: boolean;
  pausarIaQuandoHumano: boolean;
  telefoneNotificacao: string;
}

const DEFAULT_CONFIG: SystemConfig = {
  id: "config_padrao",
  empresaId: "empresa_solarmais_1",
  nomeEmpresa: "EBS Energia Solar",
  nomeConsultor: "Samuel",
  msgBoasVindas:
    "Olá! Seja muito bem-vindo à EBS Energia Solar ☀️.\n\nPara iniciarmos sua simulação rápida e personalizada, por onde você conheceu nossa empresa?",
  msgConclusao:
    "Excelente! Suas informações foram registradas com sucesso ✅\n\nNossa equipe de consultores da EBS Energia Solar já recebeu sua simulação e vai continuar seu atendimento aqui em instantes com a sua proposta personalizada!",
  percentualEconomia: 92,
  multiplicadorProposta: 25,
  valorMinimoLeadQuente: 300,
  iaAtiva24h: true,
  pedirFotoConta: true,
  notificarLeadQuente: true,
  pausarIaQuandoHumano: true,
  telefoneNotificacao: "558688269144",
};

let cachedConfig: SystemConfig | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 30_000; // 30 segundos de cache para ultra performance

export async function getSystemConfig(): Promise<SystemConfig> {
  const now = Date.now();
  if (cachedConfig && now - lastCacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const rows = await db.select().from(configuracoesSistema).limit(1);
    if (rows.length > 0) {
      const r = rows[0];
      cachedConfig = {
        id: r.id,
        empresaId: r.empresaId,
        nomeEmpresa: r.nomeEmpresa || DEFAULT_CONFIG.nomeEmpresa,
        nomeConsultor: r.nomeConsultor || DEFAULT_CONFIG.nomeConsultor,
        msgBoasVindas: r.msgBoasVindas || DEFAULT_CONFIG.msgBoasVindas,
        msgConclusao: r.msgConclusao || DEFAULT_CONFIG.msgConclusao,
        percentualEconomia: Number(r.percentualEconomia) || DEFAULT_CONFIG.percentualEconomia,
        multiplicadorProposta: Number(r.multiplicadorProposta) || DEFAULT_CONFIG.multiplicadorProposta,
        valorMinimoLeadQuente: Number(r.valorMinimoLeadQuente) || DEFAULT_CONFIG.valorMinimoLeadQuente,
        iaAtiva24h: r.iaAtiva24h ?? true,
        pedirFotoConta: r.pedirFotoConta ?? true,
        notificarLeadQuente: r.notificarLeadQuente ?? true,
        pausarIaQuandoHumano: r.pausarIaQuandoHumano ?? true,
        telefoneNotificacao: r.telefoneNotificacao || DEFAULT_CONFIG.telefoneNotificacao,
      };
      lastCacheTime = now;
      return cachedConfig;
    }
  } catch (err) {
    console.error("Aviso: Falha ao carregar configuracoesSistema do banco, usando padrão:", err);
  }

  return DEFAULT_CONFIG;
}

export function invalidarCacheConfig() {
  cachedConfig = null;
  lastCacheTime = 0;
}
