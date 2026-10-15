import { Suspense } from "react";
import type { Metadata } from "next";
import {
  ConversationSkeleton,
  LeadConversation,
} from "@/components/chat/LeadConversation";
import { requireSessionUser } from "@/lib/auth";
import { getLead, getMessages } from "@/lib/data";

export const metadata: Metadata = {
  title: "Conversa com lead",
  description: "Histórico da conversa com o lead e perfil de qualificação.",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSessionUser();
  const { id } = await params;
  const [lead, messages] = await Promise.all([getLead(id), getMessages(id)]);

  return (
    <Suspense fallback={<ConversationSkeleton />}>
      <LeadConversation initialLead={lead} initialMessages={messages} />
    </Suspense>
  );
}
