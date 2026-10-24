# Rastreio de Origem de Leads (Fase 4A)

Este módulo rastreia de onde vêm os leads que entram em contato com a **EBS Energia Solar** pelo WhatsApp (Google Ads, Instagram, Google Meu Negócio, campanhas com UTMs e acessos diretos).

---

## 🚀 Instalação no Site / Landing Page do Cliente

Para rastrear automaticamente os cliques no botão de WhatsApp do seu site e capturar `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` e `gclid`, basta colar o trecho de 2 linhas abaixo no seu HTML (logo antes de fechar `</body>` ou dentro do `<head>`):

```html
<script src="https://SEU_DOMINIO/track.js" defer></script>
<a href="#" data-whatsapp class="btn-whatsapp">Falar no WhatsApp</a>
```

> **Dica:** Qualquer elemento (botão, banner, ícone flutuante) que possua o atributo `data-whatsapp` será automaticamente interceptado pelo script.

---

## 🔍 Como Funciona o Fluxo

1. O visitante acessa o site vindo de um anúncio (ex.: `https://seusite.com.br/?utm_source=google&utm_campaign=solar_residencial&gclid=123456`).
2. O script `track.js` lê os parâmetros e guarda em `sessionStorage` (não se perdem ao navegar entre as páginas).
3. Ao clicar no botão com `data-whatsapp`, o script envia um `POST /api/track` gerando um código único de 8 caracteres (ex.: `ref: K9L2M8P1`).
4. O visitante é redirecionado instantaneamente para o WhatsApp com a mensagem pré-preenchida contendo o código de referência.
5. Quando o lead envia a primeira mensagem no WhatsApp, o sistema identifica automaticamente a campanha, gclid e canal de origem, salvando o lead já qualificado no painel.
6. Se a conexão falhar ou houver timeout, o visitante é redirecionado imediatamente para o WhatsApp sem código, garantindo que nenhum contato seja perdido.
