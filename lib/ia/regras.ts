export const CONTA_QUENTE_MIN = 600;
export const FATOR_ECONOMIA = 0.8;

export type LeadTemperatura = "quente" | "morno" | "aguardando_conta";

export interface DadosParaClassificacao {
  cidade?: string | null;
  city?: string | null;
  contaMedia?: number | string | null;
  billValue?: number | string | null;
  tipo?: string | null;
  propertyType?: string | null;
  imovelProprio?: boolean | null;
  ownProperty?: boolean | null;
  financiamento?: boolean | null;
  wantsFinancing?: boolean | null;
  contaEnviada?: boolean | null;
  billSent?: boolean | null;
  recusouFoto?: boolean | null;
  refusedPhoto?: boolean | null;
}

export interface ClassificacaoResult {
  temperatura: LeadTemperatura;
  economiaEstimada: number;
  dadosCompletos: boolean;
}

/**
 * Classifica a temperatura e calcula a economia estimada de um lead deterministamente em código.
 * A IA NUNCA define a temperatura diretamente.
 */
export function classificarLead(dados: DadosParaClassificacao): ClassificacaoResult {
  const cidade = (dados.cidade || dados.city || "").trim();
  const conta = Number(dados.contaMedia ?? dados.billValue ?? 0);
  const economiaEstimada = Math.round(conta * FATOR_ECONOMIA * 100) / 100;

  const tipoRaw = (dados.tipo || dados.propertyType || "").toLowerCase();
  const imovelProprio = dados.imovelProprio !== undefined ? dados.imovelProprio : dados.ownProperty;
  const financiamento = dados.financiamento !== undefined ? dados.financiamento : dados.wantsFinancing;
  const contaEnviada = dados.contaEnviada !== undefined ? dados.contaEnviada : dados.billSent;
  const recusouFoto = dados.recusouFoto !== undefined ? dados.recusouFoto : dados.refusedPhoto;

  const temCidade = Boolean(
    cidade !== "" && cidade.toLowerCase() !== "não informada"
  );
  const temConta = conta > 0;
  const temTipo = Boolean(
    tipoRaw !== "" && ["residencial", "comercial", "rural"].includes(tipoRaw)
  );
  const temImovelProprio = imovelProprio !== null && imovelProprio !== undefined;
  const temFinanciamento = financiamento !== null && financiamento !== undefined;

  const dadosCompletos = temCidade && temConta && temTipo && temImovelProprio && temFinanciamento;
  const fotoResolvida = Boolean(contaEnviada || recusouFoto);

  let temperatura: LeadTemperatura = "aguardando_conta";

  if (dadosCompletos && fotoResolvida) {
    if (conta >= CONTA_QUENTE_MIN && imovelProprio === true) {
      temperatura = "quente";
    } else {
      temperatura = "morno";
    }
  }

  return {
    temperatura,
    economiaEstimada,
    dadosCompletos,
  };
}
