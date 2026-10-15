"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { assumirLead, devolverParaIA, getLeads, updateLeadStage } from "@/lib/data";
import type { FunnelStageId, Lead } from "@/lib/types";

interface LeadsContextValue {
  leads: Lead[];
  loading: boolean;
  getById: (id: string) => Lead | undefined;
  assumir: (id: string) => Promise<Lead>;
  devolver: (id: string) => Promise<Lead>;
  moveStage: (id: string, stage: FunnelStageId) => Promise<void>;
  /** Atualiza o "último texto" exibido para um lead (após enviar mensagem). */
  touchLastMessage: (id: string, text: string) => void;
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

/**
 * Estado compartilhado dos leads no painel (memória/React state).
 * Toda leitura e escrita passa por /lib/data.ts.
 */
export function LeadsProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getLeads().then((data) => {
      if (!active) return;
      setLeads(data);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const replace = useCallback((updated: Lead) => {
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? { ...l, ...updated, lastMessage: l.lastMessage } : l)));
  }, []);

  const assumir = useCallback(
    async (id: string) => {
      const updated = await assumirLead(id);
      replace(updated);
      return updated;
    },
    [replace],
  );

  const devolver = useCallback(
    async (id: string) => {
      const updated = await devolverParaIA(id);
      replace(updated);
      return updated;
    },
    [replace],
  );

  const moveStage = useCallback(async (id: string, stage: FunnelStageId) => {
    // Otimista: move na hora e confirma na camada de dados.
    let previous: FunnelStageId | null = null;
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        previous = l.stage;
        return { ...l, stage };
      }),
    );
    try {
      await updateLeadStage(id, stage);
    } catch {
      setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, stage: previous } : l)));
    }
  }, []);

  const touchLastMessage = useCallback((id: string, text: string) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, lastMessage: text } : l)));
  }, []);

  const value = useMemo<LeadsContextValue>(
    () => ({
      leads,
      loading,
      getById: (id) => leads.find((l) => l.id === id),
      assumir,
      devolver,
      moveStage,
      touchLastMessage,
    }),
    [leads, loading, assumir, devolver, moveStage, touchLastMessage],
  );

  return <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>;
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads deve ser usado dentro de <LeadsProvider>");
  return ctx;
}
