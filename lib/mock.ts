// Dados mockados do SolarMais.
// Nada aqui deve ser importado diretamente pela UI — use sempre /lib/data.ts.

import type {
  FunnelStage,
  Lead,
  Message,
  MessageAuthor,
  MetricItem,
} from "./types";

const MINUTE = 60_000;
const NOW = Date.now();

/** ISO de N minutos atrás (relativo ao carregamento do módulo). */
const minutesAgo = (n: number) => new Date(NOW - n * MINUTE).toISOString();

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export const MOCK_LEADS: Lead[] = [
  {
    id: "l1",
    name: "Maria do Socorro Lima",
    phone: "5586994127788",
    city: "Teresina",
    state: "PI",
    billValue: 680,
    propertyType: "Residencial",
    status: "quente",
    createdAt: minutesAgo(18),
    ownProperty: true,
    wantsFinancing: true,
    adSource: "Instagram · Campanha Conta Zero",
    interest: "Zerar a conta de luz e instalar ar-condicionado",
    attendance: "ia",
    stage: "proposta",
    proposalValue: 18900,
  },
  {
    id: "l2",
    name: "José Ribamar Sousa",
    phone: "5599981543320",
    city: "Timon",
    state: "MA",
    billValue: 1450,
    propertyType: "Comercial",
    status: "quente",
    createdAt: minutesAgo(42),
    ownProperty: true,
    wantsFinancing: false,
    adSource: "Facebook · Energia para Empresas",
    interest: "Sistema para mercadinho com 3 freezers",
    attendance: "ia",
    stage: "negociacao",
    proposalValue: 38500,
  },
  {
    id: "l3",
    name: "Ana Clara Ferreira",
    phone: "5586988021456",
    city: "Teresina",
    state: "PI",
    billValue: 420,
    propertyType: "Residencial",
    status: "aguardando_conta",
    createdAt: minutesAgo(65),
    ownProperty: false,
    wantsFinancing: true,
    adSource: "Google · Pesquisa \"energia solar Teresina\"",
    interest: "Entender quanto economiza morando de aluguel",
    attendance: "ia",
    stage: null,
  },
  {
    id: "l4",
    name: "Francisco das Chagas Rocha",
    phone: "5586999314470",
    city: "José de Freitas",
    state: "PI",
    billValue: 1780,
    propertyType: "Rural",
    status: "quente",
    createdAt: minutesAgo(130),
    ownProperty: true,
    wantsFinancing: true,
    adSource: "Instagram · Agro Solar",
    interest: "Bombeamento de poço e irrigação",
    attendance: "humano",
    assignedTo: "Samuel",
    stage: "venda",
    proposalValue: 52000,
  },
  {
    id: "l5",
    name: "Raimunda Nonata Alves",
    phone: "5586994550912",
    city: "Parnaíba",
    state: "PI",
    billValue: 560,
    propertyType: "Residencial",
    status: "morno",
    createdAt: minutesAgo(190),
    ownProperty: true,
    wantsFinancing: null,
    adSource: "Facebook · Campanha Conta Zero",
    interest: "Reduzir a conta, ainda pesquisando preços",
    attendance: "ia",
    stage: "proposta",
    proposalValue: 15200,
  },
  {
    id: "l6",
    name: "Antônio Carlos Mendes",
    phone: "5599991208834",
    city: "Caxias",
    state: "MA",
    billValue: 920,
    propertyType: "Comercial",
    status: "morno",
    createdAt: minutesAgo(310),
    ownProperty: true,
    wantsFinancing: true,
    adSource: "Google · Display",
    interest: "Energia para oficina mecânica",
    attendance: "ia",
    stage: "negociacao",
    proposalValue: 26400,
  },
  {
    id: "l7",
    name: "Luana Beatriz Costa",
    phone: "5586981776603",
    city: "Teresina",
    state: "PI",
    billValue: 750,
    propertyType: "Residencial",
    status: "quente",
    createdAt: minutesAgo(430),
    ownProperty: true,
    wantsFinancing: true,
    adSource: "Instagram · Reels Depoimentos",
    interest: "Casa nova, quer já construir com solar",
    attendance: "humano",
    assignedTo: "Samuel",
    stage: "venda",
    proposalValue: 21000,
  },
  {
    id: "l8",
    name: "Pedro Henrique Araújo",
    phone: "5589994013387",
    city: "Picos",
    state: "PI",
    billValue: 480,
    propertyType: "Residencial",
    status: "aguardando_conta",
    createdAt: minutesAgo(545),
    ownProperty: true,
    wantsFinancing: false,
    adSource: "TikTok Ads",
    interest: "Pagamento à vista com desconto",
    attendance: "ia",
    stage: null,
  },
  {
    id: "l9",
    name: "Sandra Regina Moura",
    phone: "5599984420015",
    city: "Timon",
    state: "MA",
    billValue: 1100,
    propertyType: "Comercial",
    status: "morno",
    createdAt: minutesAgo(1460),
    ownProperty: false,
    wantsFinancing: true,
    adSource: "Facebook · Energia para Empresas",
    interest: "Clínica odontológica, prédio alugado",
    attendance: "ia",
    stage: "perdido",
    proposalValue: 31000,
  },
  {
    id: "l10",
    name: "Joaquim Batista Neto",
    phone: "5586995587241",
    city: "Campo Maior",
    state: "PI",
    billValue: 1620,
    propertyType: "Rural",
    status: "morno",
    createdAt: minutesAgo(1640),
    ownProperty: true,
    wantsFinancing: true,
    adSource: "Google · Pesquisa \"energia solar rural\"",
    interest: "Granja de frangos com climatização",
    attendance: "ia",
    stage: "proposta",
    proposalValue: 44800,
  },
  {
    id: "l11",
    name: "Fernanda Oliveira Santos",
    phone: "5589981339906",
    city: "Floriano",
    state: "PI",
    billValue: 640,
    propertyType: "Residencial",
    status: "aguardando_conta",
    createdAt: minutesAgo(1820),
    ownProperty: null,
    wantsFinancing: null,
    adSource: "Instagram · Stories",
    interest: "Pediu simulação rápida",
    attendance: "ia",
    stage: null,
  },
  {
    id: "l12",
    name: "Marcos Vinícius Carvalho",
    phone: "5586999862254",
    city: "Altos",
    state: "PI",
    billValue: 890,
    propertyType: "Comercial",
    status: "quente",
    createdAt: minutesAgo(2900),
    ownProperty: true,
    wantsFinancing: false,
    adSource: "Facebook · Energia para Empresas",
    interest: "Padaria, consumo alto de manhã",
    attendance: "ia",
    stage: "perdido",
    proposalValue: 24500,
  },
];

// ---------------------------------------------------------------------------
// Conversas
// ---------------------------------------------------------------------------

type Line = [MessageAuthor, string] | [MessageAuthor, string, string]; // [autor, texto, anexo?]

/** Monta uma conversa a partir do horário de entrada do lead, 1 min entre mensagens. */
function conversation(leadId: string, startMinutesAgo: number, lines: Line[]): Message[] {
  return lines.map(([from, text, attachment], i) => ({
    id: `${leadId}-m${i + 1}`,
    leadId,
    from,
    text,
    createdAt: minutesAgo(Math.max(startMinutesAgo - i, 0)),
    ...(attachment ? { attachment: { type: "image" as const, label: attachment } } : {}),
  }));
}

const FULL_CONVERSATIONS: Message[] = [
  ...conversation("l1", 18, [
    ["lead", "Oi, vi o anúncio de vocês no Instagram. Queria saber sobre energia solar"],
    ["ia", "Olá, Maria! 😊 Sou a assistente virtual da EBS Energia Solar. Vou te fazer algumas perguntas rápidas para montar uma simulação. Em qual cidade fica o imóvel?"],
    ["lead", "Teresina, no bairro Dirceu"],
    ["ia", "Ótimo, atendemos todo o Dirceu! Quanto vem, em média, a sua conta de luz por mês?"],
    ["lead", "Uns 680 reais. No B-R-O-Bró passa de 800 😅"],
    ["ia", "Entendi, o calor de Teresina pesa mesmo! O consumo é residencial, comercial ou rural?"],
    ["lead", "Residencial. Casa com 3 quartos"],
    ["ia", "Perfeito. O imóvel é próprio ou alugado?"],
    ["lead", "Próprio, já quitado"],
    ["ia", "Excelente! Você teria interesse em financiamento? Hoje temos parcelas que costumam ficar abaixo do valor da conta atual."],
    ["lead", "Tenho sim, se a parcela ficar menor que a conta eu fecho"],
    ["ia", "Maravilha! Para calcular o sistema ideal, pode me enviar uma foto da sua conta de luz mais recente? Precisamos ver o histórico de consumo em kWh."],
    ["lead", "Aqui está", "conta_equatorial_setembro.jpg"],
    ["ia", "Recebido, obrigada! Pelo seu consumo (~520 kWh/mês), um sistema de 4,4 kWp deve zerar praticamente toda a conta. Vou encaminhar para um especialista finalizar sua proposta. ☀️"],
  ]),
  ...conversation("l2", 42, [
    ["lead", "Boa tarde. Tenho um mercadinho em Timon e a energia tá me matando"],
    ["ia", "Boa tarde, José! Sou a assistente da EBS Energia Solar e posso ajudar. Só para confirmar: o mercadinho fica em Timon mesmo?"],
    ["lead", "Isso, no bairro Parque Piauí"],
    ["ia", "Certo! Qual o valor médio da conta de energia do comércio?"],
    ["lead", "Entre 1.400 e 1.500. Tenho 3 freezers e 2 expositores"],
    ["ia", "Entendi. Então o consumo é comercial, correto? Funciona todos os dias?"],
    ["lead", "Comercial, de segunda a domingo, das 6h às 21h"],
    ["ia", "O imóvel do mercadinho é próprio ou alugado?"],
    ["lead", "Próprio. O prédio é meu, moro em cima"],
    ["ia", "Ótimo, isso facilita muito a instalação no telhado. Você pensa em pagar à vista ou tem interesse em financiamento?"],
    ["lead", "Prefiro à vista se tiver um desconto bom"],
    ["ia", "Temos condições especiais à vista! Pode me mandar uma foto da última conta de energia? Assim calculo o tamanho exato do sistema."],
    ["lead", "Mandei", "conta_comercial_agosto.jpg"],
    ["ia", "Perfeito, José! Pelo consumo (~1.150 kWh/mês) o ideal é um sistema de ~9 kWp. Retorno estimado em 3 anos. Já sinalizei para o time comercial preparar a proposta com desconto à vista."],
    ["lead", "Show. Pode mandar que eu analiso hoje ainda"],
  ]),
  ...conversation("l3", 65, [
    ["lead", "Olá! Moro de aluguel, dá pra colocar energia solar?"],
    ["ia", "Oi, Ana Clara! Ótima pergunta. Dá sim, existem algumas alternativas. Antes, em qual cidade você mora?"],
    ["lead", "Teresina, zona leste"],
    ["ia", "Legal! E quanto costuma vir sua conta de luz?"],
    ["lead", "Mais ou menos 420"],
    ["ia", "Certo. O consumo é residencial, né? É casa ou apartamento?"],
    ["lead", "Residencial, casa"],
    ["ia", "Você comentou que é alugado. O proprietário costuma permitir reformas? Muitos clientes negociam a instalação com o dono do imóvel."],
    ["lead", "Acho que sim, ele é tranquilo. Mas eu queria saber se compensa"],
    ["ia", "Compensa bastante! Inclusive o sistema pode ser levado numa mudança. Você teria interesse em financiamento?"],
    ["lead", "Sim, não tenho o valor todo agora"],
    ["ia", "Sem problemas! Para eu simular a parcela certinha, pode me enviar uma foto da sua conta de luz mais recente? 📸"],
    ["lead", "Vou pegar aqui e já te mando"],
  ]),
];

/** Conversa curta padrão para os leads sem histórico completo. */
function defaultConversation(lead: Lead): Message[] {
  const start = Math.round((NOW - new Date(lead.createdAt).getTime()) / MINUTE);
  const first = lead.name.split(" ")[0];
  const lines: Line[] = [
    ["lead", "Olá, tenho interesse em energia solar"],
    ["ia", `Olá, ${first}! Sou a assistente virtual da EBS Energia Solar ☀️ Em qual cidade fica o imóvel?`],
    ["lead", `${lead.city} - ${lead.state}`],
    ["ia", "Ótimo! E qual o valor médio da sua conta de luz?"],
    ["lead", `Fica em torno de R$ ${lead.billValue.toLocaleString("pt-BR")}`],
  ];
  if (lead.status === "aguardando_conta") {
    lines.push(["ia", "Perfeito! Pode me enviar uma foto da sua conta de luz para eu montar a simulação? 📸"]);
  } else {
    lines.push(["ia", `Obrigada! Com uma conta desse valor, a economia pode passar de 90%. Um consultor vai te passar os detalhes da proposta.`]);
  }
  return conversation(lead.id, start, lines);
}

const LEADS_WITH_FULL_CONVERSATION = new Set(["l1", "l2", "l3"]);

export const MOCK_MESSAGES: Message[] = [
  ...FULL_CONVERSATIONS,
  ...MOCK_LEADS.filter((l) => !LEADS_WITH_FULL_CONVERSATION.has(l.id)).flatMap(defaultConversation),
];

// ---------------------------------------------------------------------------
// Métricas (base: últimos 30 dias)
// ---------------------------------------------------------------------------

export const MOCK_METRICS_30D: MetricItem[] = [
  { key: "recebidos", label: "Leads recebidos", value: 124, change: 12.4, trend: [8, 11, 9, 14, 12, 16, 13, 18, 15, 19] },
  { key: "atendidosIA", label: "Atendidos pela IA", value: 118, change: 10.8, trend: [7, 10, 9, 13, 12, 15, 13, 17, 14, 18] },
  { key: "qualificados", label: "Qualificados", value: 56, change: 8.3, trend: [4, 5, 4, 6, 7, 6, 8, 7, 9, 10] },
  { key: "assumidos", label: "Assumidos", value: 38, change: 5.6, trend: [3, 4, 3, 4, 5, 4, 5, 6, 5, 6] },
  { key: "vendas", label: "Vendas", value: 12, change: 20, trend: [0, 1, 1, 0, 2, 1, 2, 1, 2, 2] },
  { key: "perdidos", label: "Perdidos", value: 14, change: -6.7, trend: [3, 2, 2, 1, 2, 1, 1, 2, 0, 1] },
];

export const MOCK_FUNNEL_30D: Omit<FunnelStage, "percent">[] = [
  { id: "proposta", label: "Proposta enviada", count: 18 },
  { id: "negociacao", label: "Negociação", count: 10 },
  { id: "venda", label: "Venda", count: 12 },
  { id: "perdido", label: "Perdido", count: 14 },
];
