
'use client';

import { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';
import type { Appointment } from '@/lib/data';
import { services, shops } from '@/lib/data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, Share2 } from 'lucide-react';
import { useParams } from 'next/navigation';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment;
}

export function ReceiptDialog({ open, onOpenChange, appointment }: ReceiptDialogProps) {
  const params = useParams();
  const shopId = params.shopId as string;
  const shop = shops.find((s) => s.id === shopId);
  const service = services.find((s) => s.name === appointment.service);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    if (!receiptRef.current) return;
    html2canvas(receiptRef.current, { backgroundColor: null }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'px', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 15, 25, pdfWidth - 30, pdfHeight - 30);
      pdf.save(`recibo-${appointment.clientName.toLowerCase().replace(' ', '-')}.pdf`);
    });
  };

  const handleShareWhatsApp = () => {
    const receiptText = `
*Recibo de Pagamento - ${shop?.name}*

Olá, ${appointment.clientName}!
Obrigado por sua preferência.

*Serviço:* ${appointment.service}
*Barbeiro:* ${appointment.barber}
*Data:* ${format(appointment.dateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

*Valor Pago:* R$${service?.price.toFixed(2)}

Volte sempre!
    `.trim();

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(receiptText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recibo de Pagamento</DialogTitle>
          <DialogDescription>
            Pagamento recebido com sucesso. Compartilhe o recibo com o cliente.
          </DialogDescription>
        </DialogHeader>
        
        <div ref={receiptRef} className="p-6 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
            <div className="flex justify-between items-start mb-6">
                <Logo />
                <div className="text-right">
                    <p className="font-bold text-lg">{shop?.name}</p>
                    <p className="text-xs text-muted-foreground">{shop?.location}</p>
                </div>
            </div>

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold font-headline">Recibo</h2>
                <p className="text-sm text-muted-foreground">#{appointment.id.split('-')[1]}</p>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                    <p className="text-muted-foreground">CLIENTE</p>
                    <p className="font-semibold">{appointment.clientName}</p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground">DATA</p>
                    <p className="font-semibold">{format(appointment.dateTime, "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
            </div>

            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left font-semibold py-2">Descrição</th>
                        <th className="text-right font-semibold py-2">Valor</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-2">
                           <p>{appointment.service}</p>
                           <p className="text-xs text-muted-foreground">com {appointment.barber}</p>
                        </td>
                        <td className="text-right py-2">R${service?.price.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

             <Separator className="my-4" />
            
             <div className="flex justify-end items-center">
                 <div className="text-right">
                    <p className="text-muted-foreground">TOTAL PAGO</p>
                    <p className="text-2xl font-bold">R${service?.price.toFixed(2)}</p>
                 </div>
             </div>
        </div>

        <DialogFooter className="sm:justify-start gap-2">
          <Button type="button" className="w-full" onClick={handleShareWhatsApp}>
            <Share2 className="mr-2" />
            Enviar por WhatsApp
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={handleDownloadPdf}>
            <Download className="mr-2" />
            Baixar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
