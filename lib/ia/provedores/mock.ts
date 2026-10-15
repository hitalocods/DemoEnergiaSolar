import type { ContextoIA, ProvedorIA, RespostaIA } from "../tipos";

type CampoPendente =
  | "cidade"
  | "conta_media"
  | "tipo"
  | "imovel_proprio"
  | "financiamento"
  | "foto"
  | "completo";

export class ProvedorMock implements ProvedorIA {
  async responder(ctx: ContextoIA): Promise<RespostaIA> {
    const { lead, mensagens } = ctx;

    const msgsIa = mensagens.filter((m) => m.from === "ia");
    const ultimasDoLead = mensagens.filter((m) => m.from === "lead");
    const ultimaMsgLead = ultimasDoLead[ultimasDoLead.length - 1];
    const textoLead = (ultimaMsgLead?.text || "").trim();
    const textoLeadLower = textoLead.toLowerCase();

    // 1. Se já estiver completo antes desta mensagem: não responda nada
    if (this.estaTotalmenteCompleto(lead, mensagens)) {
      return { texto: "" };
    }

    // 2. Interceptação: Pedidos de atendente / pessoa / xingamentos
    const termosHumano = [
      "atendente",
      "humano",
      "pessoa",
      "consultor",
      "falar com alguém",
      "falar com alguem",
      "falar com atendente",
      "falar com uma pessoa",
      "passa pra alguém",
      "passa para alguem",
      "robô",
      "robo",
      "idiota",
      "burro",
      "lixo",
      "merda",
      "caralho",
      "porra",
    ];
    if (termosHumano.some((t) => textoLeadLower.includes(t))) {
      return {
        texto: "Claro! Já vou chamar um consultor para falar com você.",
        transferir: { motivo: "solicitou atendimento humano" },
      };
    }

    // 3. Interceptação: Desinteresse / Pare
    const termosDesinteresse = [
      "não tenho interesse",
      "nao tenho interesse",
      "sem interesse",
      "não quero",
      "nao quero",
      "pare",
      "parar",
      "cancela",
      "cancelar",
      "não quero mais",
      "nao quero mais",
    ];
    if (termosDesinteresse.some((t) => textoLeadLower.includes(t))) {
      return {
        texto:
          "Tudo bem! Agradeço pela sua atenção. Se mudar de ideia, estamos à disposição.",
      };
    }

    // 4. Tratamento de imagem: foto da conta enviada
    const enviouFoto =
      ultimaMsgLead?.attachment?.type === "image" ||
      textoLead === "[imagem]" ||
      textoLeadLower.includes("[imagem]") ||
      textoLeadLower.includes("[o lead enviou uma imagem]");

    if (enviouFoto) {
      const prox = this.proximoCampoPendente(
        { ...lead, billSent: true },
        { contaEnviada: true }
      );

      if (prox === "completo") {
        return {
          texto:
            "Recebi sua conta! ✅ Um consultor vai analisar e entrar em contato em breve com uma simulação personalizada.",
          atualizacoes: { contaEnviada: true },
        };
      } else {
        const pergunta = this.obterPergunta(prox, 0);
        const prefixo =
          msgsIa.length === 0
            ? "Olá! 👋 Sou a assistente virtual da EBS Energia Solar. Recebi sua conta! ✅ "
            : "Recebi sua conta! ✅ ";
        return {
          texto: `${prefixo}${pergunta}`,
          atualizacoes: { contaEnviada: true },
        };
      }
    }

    // 5. Primeira mensagem da IA: Apresentação e pergunta da cidade
    if (msgsIa.length === 0) {
      return {
        texto:
          "Olá! 👋 Sou a assistente virtual da EBS Energia Solar. Vou fazer algumas perguntas rápidas para preparar sua simulação; ao continuar, você concorda com o uso dos seus dados para esse fim. Pode me informar sua cidade?",
      };
    }

    // Determina qual campo o lead está respondendo (baseado na última pergunta da IA)
    const ultimaMsgIa = msgsIa[msgsIa.length - 1];
    const campoEsperado = this.deduzirCampoEsperado(ultimaMsgIa.text, lead);

    // 6. Interceptação: Perguntas sobre preços, economia ou prazos
    const termosPreco = [
      "quanto custa",
      "preço",
      "preco",
      "valor",
      "economia",
      "quanto economiza",
      "parcela",
      "quantas placas",
      "prazo",
      "potência",
      "potencia",
    ];
    if (termosPreco.some((t) => textoLeadLower.includes(t))) {
      const perguntaAtual = this.obterPergunta(campoEsperado, 0);
      return {
        texto: `Isso o consultor te passa numa simulação personalizada, já já ele entra em contato. Posso continuar com as perguntas? ${perguntaAtual}`,
      };
    }

    // 7. Processar resposta para o campo esperado
    const tentativas = this.contarTentativasCampo(mensagens, campoEsperado);

    switch (campoEsperado) {
      case "cidade": {
        const cidade = this.extrairCidade(textoLead);
        if (cidade) {
          const prox = this.proximoCampoPendente({ ...lead, city: cidade }, { cidade });
          const pergunta = this.obterPergunta(prox, 0);
          return {
            texto: pergunta,
            atualizacoes: { cidade },
          };
        }
        return this.tratarErroOuRepetir(campoEsperado, tentativas);
      }

      case "conta_media": {
        const valor = this.extrairContaMedia(textoLead);
        if (valor !== null) {
          const prox = this.proximoCampoPendente({ ...lead, billValue: valor }, { contaMedia: valor });
          const pergunta = this.obterPergunta(prox, 0);
          return {
            texto: pergunta,
            atualizacoes: { contaMedia: valor },
          };
        }
        return this.tratarErroOuRepetir(campoEsperado, tentativas);
      }

      case "tipo": {
        const tipo = this.extrairTipo(textoLeadLower);
        if (tipo) {
          const prox = this.proximoCampoPendente(lead, { tipo });
          const pergunta = this.obterPergunta(prox, 0);
          return {
            texto: pergunta,
            atualizacoes: { tipo },
          };
        }
        return this.tratarErroOuRepetir(campoEsperado, tentativas);
      }

      case "imovel_proprio": {
        const proprio = this.extrairImovelProprio(textoLeadLower);
        if (proprio !== null) {
          const prox = this.proximoCampoPendente(
            { ...lead, ownProperty: proprio },
            { imovelProprio: proprio }
          );
          const pergunta = this.obterPergunta(prox, 0);
          return {
            texto: pergunta,
            atualizacoes: { imovelProprio: proprio },
          };
        }
        return this.tratarErroOuRepetir(campoEsperado, tentativas);
      }

      case "financiamento": {
        const financ = this.extrairFinanciamento(textoLeadLower);
        if (financ !== null) {
          const prox = this.proximoCampoPendente(
            { ...lead, wantsFinancing: financ },
            { financiamento: financ }
          );
          const pergunta = this.obterPergunta(prox, 0);
          return {
            texto: pergunta,
            atualizacoes: { financiamento: financ },
          };
        }
        return this.tratarErroOuRepetir(campoEsperado, tentativas);
      }

      case "foto": {
        const termosRecusa = [
          "não tenho",
          "nao tenho",
          "prefiro não",
          "prefiro nao",
          "depois",
          "não quero",
          "nao quero",
          "não consigo",
          "nao consigo",
          "não posso",
          "nao posso",
          "sem foto",
        ];
        if (termosRecusa.some((t) => textoLeadLower.includes(t))) {
          return {
            texto:
              "Perfeito, recebi tudo! ✅ Um consultor vai entrar em contato em breve com uma simulação personalizada.",
            atualizacoes: { recusouFoto: true },
          };
        }

        return this.tratarErroOuRepetir(campoEsperado, tentativas);
      }

      default:
        return {
          texto:
            "Perfeito, recebi tudo! ✅ Um consultor vai entrar em contato em breve com uma simulação personalizada.",
        };
    }
  }

  private estaTotalmenteCompleto(
    lead: ContextoIA["lead"],
    mensagens: ContextoIA["mensagens"]
  ): boolean {
    const jaEnviouConclusao = mensagens.some(
      (m) =>
        m.from === "ia" &&
        (m.text.includes("recebi tudo") ||
          m.text.includes("Recebi sua conta! ✅ Um consultor vai analisar"))
    );
    if (jaEnviouConclusao) return true;

    const temCidade =
      Boolean(lead.city) &&
      lead.city.trim() !== "" &&
      lead.city.trim().toLowerCase() !== "não informada";
    const temConta = Boolean(lead.billValue && lead.billValue > 0);
    const temProprio =
      lead.ownProperty !== null && lead.ownProperty !== undefined;
    const temFinanc =
      lead.wantsFinancing !== null && lead.wantsFinancing !== undefined;
    const temFoto = Boolean(lead.billSent || lead.refusedPhoto);

    return temCidade && temConta && temProprio && temFinanc && temFoto;
  }

  private deduzirCampoEsperado(
    ultimaPerguntaIa: string,
    lead: ContextoIA["lead"]
  ): CampoPendente {
    const t = ultimaPerguntaIa.toLowerCase();

    if (
      t.includes("recebi tudo") ||
      t.includes("recebi sua conta! ✅ um consultor vai analisar") ||
      t.includes("analisar e entrar em contato")
    ) {
      return "completo";
    }
    if (t.includes("foto")) return "foto";
    if (t.includes("financiamento") || t.includes("parcel")) return "financiamento";
    if (t.includes("próprio") || t.includes("proprio") || t.includes("alugado") || t.includes("alugad")) {
      return "imovel_proprio";
    }
    if (
      t.includes("residencial") ||
      t.includes("comercial") ||
      t.includes("rural") ||
      t.includes("casa, comércio") ||
      t.includes("sítio") ||
      t.includes("fazenda") ||
      t.includes("consumo")
    ) {
      return "tipo";
    }
    if (
      t.includes("valor médio") ||
      t.includes("valor aproximado") ||
      t.includes("conta de energia") ||
      t.includes("conta de luz") ||
      t.includes("paga de energia") ||
      t.includes("reais") ||
      t.includes("conta")
    ) {
      return "conta_media";
    }
    if (t.includes("cidade")) return "cidade";

    // Fallback: próximo campo pendente do lead
    return this.proximoCampoPendente(lead);
  }

  private proximoCampoPendente(
    lead: ContextoIA["lead"],
    novosDados: Partial<{
      cidade: string;
      contaMedia: number;
      tipo: string;
      imovelProprio: boolean;
      financiamento: boolean;
      contaEnviada: boolean;
      recusouFoto: boolean;
    }> = {}
  ): CampoPendente {
    const cidade = novosDados.cidade || lead.city;
    if (!cidade || cidade.trim() === "" || cidade.toLowerCase() === "não informada") {
      return "cidade";
    }

    const conta = novosDados.contaMedia ?? lead.billValue;
    if (!conta || conta <= 0) {
      return "conta_media";
    }

    if (!novosDados.tipo && lead.ownProperty === null && lead.wantsFinancing === null) {
      return "tipo";
    }

    const proprio = novosDados.imovelProprio ?? lead.ownProperty;
    if (proprio === null || proprio === undefined) {
      return "imovel_proprio";
    }

    const financ = novosDados.financiamento ?? lead.wantsFinancing;
    if (financ === null || financ === undefined) {
      return "financiamento";
    }

    const fotoOk =
      novosDados.contaEnviada ||
      novosDados.recusouFoto ||
      lead.billSent ||
      lead.refusedPhoto;
    if (!fotoOk) {
      return "foto";
    }

    return "completo";
  }

  private obterPergunta(campo: CampoPendente, nivelTentativa: number): string {
    switch (campo) {
      case "cidade":
        if (nivelTentativa === 1) {
          return "Qual é o nome da sua cidade?";
        }
        if (nivelTentativa === 2) {
          return "Pode me dizer apenas o nome da sua cidade? Exemplo: Teresina";
        }
        return "Pode me informar sua cidade?";

      case "conta_media":
        if (nivelTentativa === 1) {
          return "Mais ou menos quanto você paga de energia por mês em reais?";
        }
        if (nivelTentativa === 2) {
          return "Pode me dizer só o valor aproximado da conta por mês? Exemplo: 800";
        }
        return "Qual é o valor médio mensal da sua conta de energia?";

      case "tipo":
        if (nivelTentativa === 1) {
          return "A instalação seria para sua casa, comércio ou área rural?";
        }
        if (nivelTentativa === 2) {
          return "Me informe se é para residência, empresa ou sítio/fazenda.";
        }
        return "O seu consumo é residencial, comercial ou rural?";

      case "imovel_proprio":
        if (nivelTentativa === 1) {
          return "Você é o proprietário do imóvel ou ele é alugado?";
        }
        if (nivelTentativa === 2) {
          return "O imóvel onde será instalado é seu (próprio) ou é alugado?";
        }
        return "O imóvel é próprio ou alugado?";

      case "financiamento":
        if (nivelTentativa === 1) {
          return "Gostaria de financiar ou prefere não?";
        }
        if (nivelTentativa === 2) {
          return "Pode me informar se tem interesse em financiamento? Sim ou não?";
        }
        return "Você tem interesse em financiamento?";

      case "foto":
        if (nivelTentativa === 1) {
          return "Consegue enviar uma foto da conta de luz? Se não tiver agora ou preferir não enviar, só me avisar.";
        }
        if (nivelTentativa === 2) {
          return "Pode mandar a foto da conta de luz? Se não quiser ou não tiver, só dizer 'não tenho' que seguimos.";
        }
        return "Você teria uma foto da sua conta de energia para enviar? Se não tiver agora, só me avisar.";

      default:
        return "Perfeito, recebi tudo! ✅ Um consultor vai entrar em contato em breve com uma simulação personalizada.";
    }
  }

  private contarTentativasCampo(
    mensagens: ContextoIA["mensagens"],
    campo: CampoPendente
  ): number {
    const ultimasIa = mensagens
      .filter((m) => m.from === "ia")
      .slice(-4)
      .reverse();

    let count = 0;
    for (const msg of ultimasIa) {
      const t = msg.text.toLowerCase();
      if (campo === "cidade" && t.includes("cidade")) count++;
      else if (
        campo === "conta_media" &&
        (t.includes("conta") || t.includes("energia") || t.includes("luz") || t.includes("reais"))
      )
        count++;
      else if (
        campo === "tipo" &&
        (t.includes("residencial") || t.includes("comercial") || t.includes("rural") || t.includes("consumo"))
      )
        count++;
      else if (
        campo === "imovel_proprio" &&
        (t.includes("próprio") || t.includes("proprio") || t.includes("alugad"))
      )
        count++;
      else if (
        campo === "financiamento" &&
        (t.includes("financiamento") || t.includes("parcel"))
      )
        count++;
      else if (campo === "foto" && t.includes("foto")) count++;
      else break;
    }
    return count;
  }

  private tratarErroOuRepetir(
    campo: CampoPendente,
    tentativasAtuais: number
  ): RespostaIA {
    if (tentativasAtuais >= 2) {
      return {
        texto:
          "Tive um pouco de dificuldade para entender. Já vou chamar um consultor para continuar o atendimento com você.",
        transferir: { motivo: "não entendeu as respostas" },
      };
    }

    const proximaPergunta = this.obterPergunta(campo, tentativasAtuais + 1);
    return {
      texto: proximaPergunta,
    };
  }

  // --- Funções de Extração ---

  private extrairCidade(texto: string): string | null {
    const limpo = texto
      .replace(/^(moro em|sou de|aqui é|aqui e|cidade de|em|na cidade de)\s+/i, "")
      .replace(/[.,!?;:]/g, "")
      .trim();

    if (!limpo) return null;
    const palavras = limpo.split(/\s+/);
    if (palavras.length > 4) return null;

    // Converte para Title Case
    return palavras
      .map(
        (p) =>
          p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
      )
      .join(" ");
  }

  private extrairContaMedia(texto: string): number | null {
    // Procura números com ou sem separador de milhar e centavos
    // Ex: "R$ 950", "950 reais", "1.200,50", "850,00", "500"
    const match = texto.match(/(\d+(?:[.,]\d+)*)/);
    if (!match) return null;

    let numStr = match[1];
    if (numStr.includes(".") && numStr.includes(",")) {
      numStr = numStr.replace(/\./g, "").replace(",", ".");
    } else if (numStr.includes(",")) {
      numStr = numStr.replace(",", ".");
    } else if (numStr.includes(".")) {
      const parts = numStr.split(".");
      if (parts.length === 2 && parts[1].length === 3) {
        numStr = parts[0] + parts[1];
      }
    }

    const valor = parseFloat(numStr);
    if (isNaN(valor) || valor <= 0 || valor > 100000) {
      return null;
    }
    return valor;
  }

  private extrairTipo(textoLower: string): "residencial" | "comercial" | "rural" | null {
    if (
      textoLower.includes("resid") ||
      textoLower.includes("casa") ||
      textoLower.includes("apart")
    ) {
      return "residencial";
    }
    if (
      textoLower.includes("comerc") ||
      textoLower.includes("loja") ||
      textoLower.includes("empresa") ||
      textoLower.includes("bar")
    ) {
      return "comercial";
    }
    if (
      textoLower.includes("rural") ||
      textoLower.includes("sítio") ||
      textoLower.includes("sitio") ||
      textoLower.includes("fazenda") ||
      textoLower.includes("chácara") ||
      textoLower.includes("chacara")
    ) {
      return "rural";
    }
    return null;
  }

  private extrairImovelProprio(textoLower: string): boolean | null {
    if (
      textoLower.includes("próprio") ||
      textoLower.includes("proprio") ||
      textoLower.includes("meu") ||
      textoLower.includes("minha") ||
      textoLower.includes("propriet")
    ) {
      return true;
    }
    if (textoLower.includes("alugad") || textoLower.includes("locad") || textoLower.includes("aluguel")) {
      return false;
    }
    return null;
  }

  private extrairFinanciamento(textoLower: string): boolean | null {
    if (
      textoLower.includes("não") ||
      textoLower.includes("nao") ||
      textoLower.includes("à vista") ||
      textoLower.includes("a vista") ||
      textoLower.includes("avista") ||
      textoLower.includes("sem financiamento")
    ) {
      return false;
    }
    if (
      textoLower.includes("sim") ||
      textoLower.includes("quero") ||
      textoLower.includes("tenho interesse") ||
      textoLower.includes("tenho") ||
      textoLower.includes("financiar") ||
      textoLower.includes("parcel") ||
      textoLower.includes("gostaria")
    ) {
      return true;
    }
    return null;
  }
}
