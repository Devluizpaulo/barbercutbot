"use client"

import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, Calendar } from "lucide-react";

export default function ReportsPage() {
  const params = useParams();
  const shopId = params.shopId as string;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline">Relatórios</h1>
        <p className="text-muted-foreground">Gere relatórios e exporte informações do seu negócio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Comece pelos relatórios financeiros</CardTitle>
          <CardDescription>Selecione um período em Finanças e baixe os gráficos como PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href={`/dashboard/${shopId}/finance`} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5" />
                <div>
                  <div className="font-medium">Relatórios Financeiros</div>
                  <div className="text-sm text-muted-foreground">Receitas, despesas e lucro</div>
                </div>
              </div>
              <Button size="sm">Abrir</Button>
            </Link>
            <Link href={`/dashboard/${shopId}/appointments`} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" />
                <div>
                  <div className="font-medium">Agendamentos</div>
                  <div className="text-sm text-muted-foreground">Volume por período e status</div>
                </div>
              </div>
              <Button size="sm">Abrir</Button>
            </Link>
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5" />
                <div>
                  <div className="font-medium">Mais relatórios em breve</div>
                  <div className="text-sm text-muted-foreground">Customizações e exportações</div>
                </div>
              </div>
              <Button size="sm" disabled>Em breve</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
