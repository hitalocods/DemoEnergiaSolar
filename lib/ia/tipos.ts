import type { Lead, Message } from "@/lib/types";

export interface CamposAtualizacaoLead {
  cidade?: string;
  contaMedia?: number | string;
  tipo?: "residencial" | "comercial" | "rural";
  imovelProprio?: boolean;
  financiamento?: boolean;
  contaEnviada?: boolean;
  recusouFoto?: boolean;
}

export interface RespostaIA {
  texto: string;
  atualizacoes?: Partial<CamposAtualizacaoLead>;
  transferir?: { motivo: string };
}

export interface ContextoIA {
  lead: Lead;
  mensagens: Message[];
}

export interface ProvedorIA {
  responder(ctx: ContextoIA): Promise<RespostaIA>;
}
