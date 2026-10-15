"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import {
  criarNovoLeadDemoAction,
  limparLeadsDemoAction,
  simularMensagemLead,
} from "@/app/actions";
import type { Lead, Message } from "@/lib/types";
import { ConsultantLiveView } from "./ConsultantLiveView";
import { PhoneMockup } from "./PhoneMockup";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Falha ao consultar status da demo");
    return res.json();
  });

interface DemoContainerProps {
  initialTelefone?: string;
  initialLead?: Lead | null;
  initialMessages?: Message[];
}

export function DemoContainer({
  initialTelefone,
  initialLead = null,
  initialMessages = [],
}: DemoContainerProps) {
  const [telefone, setTelefone] = useState<string>(() => {
    if (initialTelefone) return initialTelefone;
    if (typeof window !== "undefined") {
      const salvo = sessionStorage.getItem("solarmais_demo_phone");
      if (salvo && salvo.startsWith("demo-")) {
        return salvo;
      }
    }
    return "";
  });
  const [isTyping, setIsTyping] = useState(false);
  const [isNovoLoading, setIsNovoLoading] = useState(false);
  const [isLimparLoading, setIsLimparLoading] = useState(false);

  // Inicializa um novo lead se nenhum estiver salvo
  useEffect(() => {
    if (!telefone) {
      void criarNovo();
    }
  }, [telefone]);

  async function criarNovo() {
    setIsNovoLoading(true);
    try {
      const res = await criarNovoLeadDemoAction();
      if (res.success && res.telefone) {
        setTelefone(res.telefone);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("solarmais_demo_phone", res.telefone);
        }
      }
    } catch (err) {
      console.error("Erro ao criar lead de demo:", err);
    } finally {
      setIsNovoLoading(false);
    }
  }

  // Polling regular a cada 1,5 segundos (conforme requisito)
  const { data, mutate } = useSWR<{ lead: Lead | null; messages: Message[] }>(
    telefone ? `/api/demo/status?telefone=${encodeURIComponent(telefone)}` : null,
    fetcher,
    {
      refreshInterval: 1500,
      fallbackData: {
        lead: initialLead,
        messages: initialMessages,
      },
      revalidateOnFocus: true,
    }
  );

  const currentLead = data?.lead ?? initialLead;
  const currentMessages = data?.messages ?? initialMessages;

  async function handleSendMessage(texto: string, file?: File) {
    if (!telefone) return;

    // Simula estado de digitando por ~1,5s
    setIsTyping(true);

    const formData = new FormData();
    formData.append("telefone", telefone);
    formData.append("texto", texto);
    if (file) {
      formData.append("imagem", file);
    }

    try {
      // Inicia o processamento no backend
      await simularMensagemLead(formData);

      // Mantém a animação de digitando da IA por aproximadamente 1,5s
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await mutate();
    } catch (err) {
      console.error("Erro ao enviar mensagem na demo:", err);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleLimparLeads() {
    if (!confirm("Deseja realmente limpar todos os leads de demonstração?")) {
      return;
    }
    setIsLimparLoading(true);
    try {
      await limparLeadsDemoAction();
      // Após limpar, cria um lead novinho para continuar a experiência
      await criarNovo();
      await mutate();
    } catch (err) {
      console.error("Erro ao limpar leads:", err);
    } finally {
      setIsLimparLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
      {/* Coluna da Esquerda: Mockup do Smartphone (WhatsApp) */}
      <div className="lg:col-span-5 flex justify-center">
        <PhoneMockup
          messages={currentMessages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          disabled={!telefone || isNovoLoading}
        />
      </div>

      {/* Coluna da Direita: O que o consultor vê */}
      <div className="lg:col-span-7">
        <ConsultantLiveView
          lead={currentLead}
          onNovoLead={criarNovo}
          onLimparLeads={handleLimparLeads}
          isNovoLoading={isNovoLoading}
          isLimparLoading={isLimparLoading}
        />
      </div>
    </div>
  );
}
