import type { ContextoIA, ProvedorIA, RespostaIA } from "../tipos";

/**
 * Provedor Anthropic Claude (será ativado na próxima etapa com chave de API).
 */
export class ProvedorAnthropic implements ProvedorIA {
  async responder(_ctx: ContextoIA): Promise<RespostaIA> {
    void _ctx;
    throw new Error(
      "Provedor Anthropic ainda não implementado. Use IA_PROVIDER=mock para testes locais."
    );
  }
}
