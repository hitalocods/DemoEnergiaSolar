"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SyncData {
  totalLeads: number;
  totalMensagens: number;
  ultimaAtualizacao: number;
  ultimoLead: {
    id: string;
    nome: string;
    telefone: string;
  } | null;
}

export function LiveSyncProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const lastStateRef = useRef<string | null>(null);

  // Polling a cada 3.5 segundos para detectar novos leads ou novas mensagens
  const { data } = useSWR<SyncData>("/api/sync/status", fetcher, {
    refreshInterval: 3500,
    revalidateOnFocus: true,
  });

  useEffect(() => {
    if (!data) return;

    const currentState = `${data.totalLeads}_${data.totalMensagens}_${data.ultimaAtualizacao}`;

    if (lastStateRef.current === null) {
      lastStateRef.current = currentState;
      return;
    }

    if (lastStateRef.current !== currentState) {
      lastStateRef.current = currentState;

      // Se um novo lead chegou ou mensagem foi recebida, atualiza automaticamente a tela
      router.refresh();

      // Notificação nativa se o usuário tiver autorizado no celular
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        data.ultimoLead
      ) {
        try {
          new Notification("☀️ Novo Lead no CRM!", {
            body: `${data.ultimoLead.nome} acabou de enviar mensagem no WhatsApp.`,
            icon: "/ebs-logo.png",
          });
        } catch {
          // Ignora se o browser restringir notificações sem Service Worker
        }
      }
    }
  }, [data, router]);

  return <>{children}</>;
}
