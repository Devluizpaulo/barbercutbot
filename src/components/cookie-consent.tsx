"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie_consent"; // values: "accepted" | "rejected"

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      if (!saved) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const setChoice = (value: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="mx-auto max-w-4xl p-4">
        <div className="rounded-lg border bg-background/95 backdrop-blur shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Usamos cookies para melhorar sua experiência, analisar o tráfego e personalizar conteúdo. Veja nossa {""}
            <Link href="/privacy" className="underline">Política de Privacidade</Link> e {""}
            <Link href="/terms" className="underline">Termos de Uso</Link>.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setChoice("rejected")}>Rejeitar</Button>
            <Button onClick={() => setChoice("accepted")}>
              Aceitar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
