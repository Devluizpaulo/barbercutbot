
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { shops } from "@/lib/data";
import { Building, Calendar, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight font-headline mb-6">Selecione uma Barbearia</h1>
      <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        {shops.map((shop) => (
          <Card key={shop.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="font-headline text-2xl">{shop.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <Building className="h-4 w-4" /> {shop.location}
                  </CardDescription>
                </div>
                 <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/${shop.id}`}>
                        <ChevronRight className="h-5 w-5" />
                    </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{shop.todayAppointments}</p>
                    <p className="text-muted-foreground">Reservas de Hoje</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{shop.totalClients}</p>
                    <p className="text-muted-foreground">Total de Clientes</p>
                  </div>
                </div>
              </div>
               <Button className="w-full mt-6" asChild>
                    <Link href={`/dashboard/${shop.id}`}>Gerenciar Loja</Link>
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
