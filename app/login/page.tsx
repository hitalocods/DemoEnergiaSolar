import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm, LoginShowcase } from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o painel de atendimento SolarMais.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <LoginForm />
      </div>
      <LoginShowcase />
    </div>
  );
}
