
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { clients, appointments } from "@/lib/data"
import { ArrowLeft, Edit, Mail, Phone, DollarSign, Calendar } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

export default function ClientDetailsPage({ params }: { params: { shopId: string, clientId: string } }) {
  const client = clients.find(c => c.id === params.clientId)
  const clientAppointments = appointments.filter(a => a.clientName.includes(client?.name.split(' ')[0] ?? ''))

  if (!client) {
    return (
      <div className="text-center">
        <p>Client not found.</p>
        <Button asChild variant="link">
          <Link href={`/dashboard/${params.shopId}/clients`}>Go back to clients</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/${params.shopId}/clients`}>
                <ArrowLeft className="h-4 w-4" />
            </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold tracking-tight font-headline">
            {client.name}
            </h1>
            <p className="text-muted-foreground">
            Client Profile and History
            </p>
        </div>
        <Button className="ml-auto">
            <Edit className="mr-2 h-4 w-4" />
            Edit Client
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{client.email}</span>
            </div>
             <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{client.phone}</span>
            </div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="font-headline text-lg">Key Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="font-bold">${client.totalSpent.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                    <p className="font-bold">{client.lastVisit}</p>
                    <p className="text-xs text-muted-foreground">Last Visit</p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Appointment History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Barber</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientAppointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>{format(appointment.dateTime, "MMM d, yyyy 'at' h:mm a")}</TableCell>
                  <TableCell>{appointment.service}</TableCell>
                  <TableCell>{appointment.barber}</TableCell>
                  <TableCell>
                    <Badge variant={appointment.status === 'Completed' ? 'secondary' : appointment.status === 'Cancelled' ? 'destructive' : 'default'}>
                      {appointment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
               {clientAppointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No appointments found for this client.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
