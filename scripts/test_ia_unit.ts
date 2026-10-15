import { classificarLead } from "../lib/ia/regras";
import { ProvedorMock } from "../lib/ia/provedores/mock";
import type { Lead, Message } from "../lib/types";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("--- TESTANDO REGRAS DE CLASSIFICAÇÃO ---");
  
  // 1. Incompleto sem cidade
  const r1 = classificarLead({
    cidade: "Não informada",
    contaMedia: 800,
    tipo: "residencial",
    imovelProprio: true,
    financiamento: true,
    contaEnviada: true,
  });
  assert(r1.temperatura === "aguardando_conta", "Sem cidade deve ser aguardando_conta");
  assert(r1.dadosCompletos === false, "dadosCompletos deve ser false");
  assert(r1.economiaEstimada === 640, "economiaEstimada deve ser 800 * 0.8 = 640");

  // 2. Completo e quente (conta >= 600 e imóvel próprio)
  const r2 = classificarLead({
    cidade: "Teresina",
    contaMedia: 950,
    tipo: "residencial",
    imovelProprio: true,
    financiamento: false,
    contaEnviada: true,
  });
  assert(r2.temperatura === "quente", "Completo com conta >= 600 e proprio deve ser quente");
  assert(r2.dadosCompletos === true, "dadosCompletos deve ser true");
  assert(r2.economiaEstimada === 760, "economia 950 * 0.8 = 760");

  // 3. Completo e morno com recusouFoto e conta < 600
  const r3 = classificarLead({
    cidade: "Picos",
    contaMedia: 450,
    tipo: "comercial",
    imovelProprio: true,
    financiamento: true,
    recusouFoto: true,
  });
  assert(r3.temperatura === "morno", "Conta < 600 deve ser morno");
  assert(r3.dadosCompletos === true, "dadosCompletos true");

  // 4. Completo e morno com alugado
  const r4 = classificarLead({
    cidade: "Floriano",
    contaMedia: 1200,
    tipo: "rural",
    imovelProprio: false,
    financiamento: true,
    contaEnviada: true,
  });
  assert(r4.temperatura === "morno", "Alugado deve ser morno mesmo conta >= 600");

  console.log("✓ Regras de classificação: 100% OK!");

  console.log("--- TESTANDO PROVEDOR MOCK (MÁQUINA DE ESTADOS) ---");
  const provedor = new ProvedorMock();

  let lead: Lead = {
    id: "lead_test",
    name: "Lead Teste",
    phone: "5586900000001",
    city: "Não informada",
    state: "PI",
    billValue: 0,
    propertyType: "Residencial",
    status: "aguardando_conta",
    createdAt: new Date().toISOString(),
    ownProperty: null,
    wantsFinancing: null,
    adSource: "Direto",
    interest: "Solar",
    attendance: "ia",
    stage: null,
    billSent: false,
    refusedPhoto: false,
  };

  const msgs: Message[] = [
    {
      id: "m1",
      leadId: lead.id,
      from: "lead",
      text: "Olá, quero saber mais sobre energia solar",
      createdAt: new Date().toISOString(),
    },
  ];

  // Turno 1: Primeira resposta da IA
  const res1 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 1:", res1.texto);
  assert(res1.texto.includes("Sou a assistente virtual da EBS Energia Solar"), "Deve apresentar assistente virtual");
  assert(res1.texto.includes("Pode me informar sua cidade?"), "Deve perguntar cidade");

  msgs.push({
    id: "m2",
    leadId: lead.id,
    from: "ia",
    text: res1.texto,
    createdAt: new Date().toISOString(),
  });

  // Turno 2: Lead responde cidade
  msgs.push({
    id: "m3",
    leadId: lead.id,
    from: "lead",
    text: "Moro em Teresina",
    createdAt: new Date().toISOString(),
  });

  const res2 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 2:", res2.texto, res2.atualizacoes);
  assert(res2.atualizacoes?.cidade === "Teresina", "Deve extrair cidade Teresina");
  assert(res2.texto.includes("conta de energia"), "Deve perguntar valor da conta");

  lead = { ...lead, city: res2.atualizacoes!.cidade! };
  msgs.push({
    id: "m4",
    leadId: lead.id,
    from: "ia",
    text: res2.texto,
    createdAt: new Date().toISOString(),
  });

  // Teste de pergunta de preço no meio da qualificação
  msgs.push({
    id: "m5_preco",
    leadId: lead.id,
    from: "lead",
    text: "Mas quanto custa esse sistema?",
    createdAt: new Date().toISOString(),
  });
  const resPreco = await provedor.responder({ lead, mensagens: msgs });
  console.log("Interrupção Preço:", resPreco.texto);
  assert(resPreco.texto.includes("Isso o consultor te passa"), "Deve responder mensagem padrão de preço");
  assert(resPreco.texto.includes("Posso continuar com as perguntas?"), "Deve pedir para continuar");
  assert(resPreco.texto.includes("conta de energia"), "Deve retomar a pergunta de conta");

  msgs.pop(); // remove a mensagem de preço para prosseguir fluxo

  // Turno 3: Lead responde valor da conta "R$ 950 reais"
  msgs.push({
    id: "m5",
    leadId: lead.id,
    from: "lead",
    text: "Minha conta vem uns R$ 950 reais por mês",
    createdAt: new Date().toISOString(),
  });

  const res3 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 3:", res3.texto, res3.atualizacoes);
  assert(res3.atualizacoes?.contaMedia === 950, "Deve extrair 950");
  assert(res3.texto.includes("residencial, comercial ou rural"), "Deve perguntar tipo");

  lead = { ...lead, billValue: Number(res3.atualizacoes!.contaMedia!) };
  msgs.push({
    id: "m6",
    leadId: lead.id,
    from: "ia",
    text: res3.texto,
    createdAt: new Date().toISOString(),
  });

  // Turno 4: Lead responde tipo "É pra minha casa"
  msgs.push({
    id: "m7",
    leadId: lead.id,
    from: "lead",
    text: "É pra minha casa",
    createdAt: new Date().toISOString(),
  });

  const res4 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 4:", res4.texto, res4.atualizacoes);
  assert(res4.atualizacoes?.tipo === "residencial", "Deve extrair residencial");
  assert(res4.texto.includes("próprio ou alugado"), "Deve perguntar imóvel próprio");

  msgs.push({
    id: "m8",
    leadId: lead.id,
    from: "ia",
    text: res4.texto,
    createdAt: new Date().toISOString(),
  });

  // Turno 5: Lead responde "É próprio"
  msgs.push({
    id: "m9",
    leadId: lead.id,
    from: "lead",
    text: "É próprio",
    createdAt: new Date().toISOString(),
  });

  const res5 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 5:", res5.texto, res5.atualizacoes);
  assert(res5.atualizacoes?.imovelProprio === true, "Deve extrair imovelProprio = true");
  assert(res5.texto.includes("financiamento"), "Deve perguntar financiamento");

  lead = { ...lead, ownProperty: true };
  msgs.push({
    id: "m10",
    leadId: lead.id,
    from: "ia",
    text: res5.texto,
    createdAt: new Date().toISOString(),
  });

  // Turno 6: Lead responde financiamento "Sim, tenho interesse"
  msgs.push({
    id: "m11",
    leadId: lead.id,
    from: "lead",
    text: "Sim, tenho interesse",
    createdAt: new Date().toISOString(),
  });

  const res6 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 6:", res6.texto, res6.atualizacoes);
  assert(res6.atualizacoes?.financiamento === true, "Deve extrair financiamento = true");
  assert(res6.texto.includes("foto da sua conta"), "Deve perguntar foto da conta");

  lead = { ...lead, wantsFinancing: true };
  msgs.push({
    id: "m12",
    leadId: lead.id,
    from: "ia",
    text: res6.texto,
    createdAt: new Date().toISOString(),
  });

  // Turno 7: Lead responde "Não tenho foto agora"
  msgs.push({
    id: "m13",
    leadId: lead.id,
    from: "lead",
    text: "Não tenho a foto agora, prefiro não mandar",
    createdAt: new Date().toISOString(),
  });

  const res7 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 7:", res7.texto, res7.atualizacoes);
  assert(res7.atualizacoes?.recusouFoto === true, "Deve registrar recusouFoto = true");
  assert(res7.texto.includes("Perfeito, recebi tudo! ✅"), "Deve enviar mensagem final");

  lead = { ...lead, refusedPhoto: true, billSent: false };
  msgs.push({
    id: "m14",
    leadId: lead.id,
    from: "ia",
    text: res7.texto,
    createdAt: new Date().toISOString(),
  });

  // Turno 8: Mensagem após conclusão: deve retornar texto vazio (não responde nada)
  msgs.push({
    id: "m15",
    leadId: lead.id,
    from: "lead",
    text: "Obrigado, fico no aguardo!",
    createdAt: new Date().toISOString(),
  });
  const res8 = await provedor.responder({ lead, mensagens: msgs });
  console.log("Turno 8 (após conclusão):", JSON.stringify(res8.texto));
  assert(res8.texto === "", "Após conclusão não deve responder nada");

  // Teste de pedido de consultor (durante atendimento)
  const leadEmAtendimento: Lead = {
    ...lead,
    refusedPhoto: false,
    billSent: false,
  };
  const resHumano = await provedor.responder({
    lead: leadEmAtendimento,
    mensagens: [
      {
        id: "hx",
        leadId: lead.id,
        from: "lead",
        text: "Quero falar com um atendente humano agora",
        createdAt: new Date().toISOString(),
      },
    ],
  });
  console.log("Pedido humano:", resHumano.texto, resHumano.transferir);
  assert(resHumano.texto.includes("Claro! Já vou chamar um consultor"), "Deve confirmar chamada de consultor");
  assert(resHumano.transferir?.motivo === "solicitou atendimento humano", "Motivo de transferência correto");

  // Teste de desinteresse (durante atendimento)
  const resDesinteresse = await provedor.responder({
    lead: leadEmAtendimento,
    mensagens: [
      {
        id: "dx",
        leadId: lead.id,
        from: "lead",
        text: "Não tenho interesse mais, pare",
        createdAt: new Date().toISOString(),
      },
    ],
  });
  console.log("Desinteresse:", resDesinteresse.texto);
  assert(resDesinteresse.texto.includes("Agradeço pela sua atenção"), "Deve agradecer sem insistir");
  assert(!resDesinteresse.transferir, "Não deve transferir no desinteresse");

  // Teste de 3 tentativas com falha (deve transferir na 3ª com motivo "não entendeu as respostas")
  const msgsFalha: Message[] = [
    { id: "f1", leadId: lead.id, from: "ia", text: "Pode me informar sua cidade?", createdAt: new Date().toISOString() },
    { id: "f2", leadId: lead.id, from: "lead", text: "Não sei responder isso blablabla 123", createdAt: new Date().toISOString() },
    { id: "f3", leadId: lead.id, from: "ia", text: "Qual é o nome da sua cidade?", createdAt: new Date().toISOString() },
    { id: "f4", leadId: lead.id, from: "lead", text: "Continuo sem saber blablabla 456", createdAt: new Date().toISOString() },
    { id: "f5", leadId: lead.id, from: "ia", text: "Pode me dizer apenas o nome da sua cidade? Exemplo: Teresina", createdAt: new Date().toISOString() },
    { id: "f6", leadId: lead.id, from: "lead", text: "Ainda não entendi nada 789", createdAt: new Date().toISOString() },
  ];
  const res3Falhas = await provedor.responder({ lead: leadEmAtendimento, mensagens: msgsFalha });
  console.log("3 Falhas consecutivas:", res3Falhas.texto, res3Falhas.transferir);
  assert(res3Falhas.transferir?.motivo === "não entendeu as respostas", "Deve transferir por não entender respostas");

  // Teste de xingamento
  const resXingamento = await provedor.responder({
    lead: leadEmAtendimento,
    mensagens: [
      { id: "x1", leadId: lead.id, from: "lead", text: "Seu robô idiota", createdAt: new Date().toISOString() },
    ],
  });
  console.log("Xingamento:", resXingamento.texto, resXingamento.transferir);
  assert(resXingamento.transferir?.motivo === "solicitou atendimento humano", "Xingamento deve transferir");

  // Teste de envio de foto da conta quando todos os dados estão preenchidos
  const leadQuaseCompleto: Lead = {
    ...lead,
    city: "Teresina",
    billValue: 950,
    propertyType: "Residencial",
    ownProperty: true,
    wantsFinancing: true,
    billSent: false,
    refusedPhoto: false,
  };
  const resFotoCompleta = await provedor.responder({
    lead: leadQuaseCompleto,
    mensagens: [
      { id: "p1", leadId: lead.id, from: "ia", text: "Você teria uma foto da sua conta de energia para enviar? Se não tiver agora, só me avisar.", createdAt: new Date().toISOString() },
      { id: "p2", leadId: lead.id, from: "lead", text: "conta_energia.jpg", attachment: { type: "image", label: "conta.jpg" }, createdAt: new Date().toISOString() },
    ],
  });
  console.log("Foto quando completo:", resFotoCompleta.texto, resFotoCompleta.atualizacoes);
  assert(resFotoCompleta.atualizacoes?.contaEnviada === true, "Deve marcar contaEnviada = true");
  assert(resFotoCompleta.texto.includes("Recebi sua conta! ✅ Um consultor vai analisar"), "Deve confirmar recebimento da conta");

  // Teste de envio de foto quando ainda faltam campos
  const leadSemCidade: Lead = {
    ...lead,
    city: "Não informada",
    billValue: 0,
    ownProperty: null,
    wantsFinancing: null,
    billSent: false,
    refusedPhoto: false,
  };
  const resFotoIncompleta = await provedor.responder({
    lead: leadSemCidade,
    mensagens: [
      { id: "pi1", leadId: lead.id, from: "lead", text: "conta.jpg", attachment: { type: "image", label: "conta.jpg" }, createdAt: new Date().toISOString() },
    ],
  });
  console.log("Foto quando incompleto:", resFotoIncompleta.texto, resFotoIncompleta.atualizacoes);
  assert(resFotoIncompleta.atualizacoes?.contaEnviada === true, "Deve marcar contaEnviada = true");
  assert(resFotoIncompleta.texto.includes("Recebi sua conta! ✅"), "Deve agradecer a foto");
  assert(resFotoIncompleta.texto.includes("cidade"), "Deve fazer a próxima pergunta pendente (cidade)");

  console.log("\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!");
}

runTests().catch((err) => {
  console.error("❌ ERRO NO TESTE:", err);
  process.exit(1);
});
