

'use client';

import { useForm } from 'react-hook-form';
import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoaderCircle, PenSquare, DollarSign, Clock, Tag, Image as ImageIcon, Percent, Users, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFirestore } from '@/firebase';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { Service } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'O nome do serviço é obrigatório.'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
  cost: z.coerce.number().min(0, 'O custo não pode ser negativo.').optional(),
  duration: z.coerce.number().min(0, 'A duração deve ser um número positivo em minutos.'),
  imageUrl: z.string().url('URL inválida.').optional().or(z.literal('')),
  isCommissionEnabled: z.boolean().default(false),
  commissionType: z.enum(['fixed', 'percentage']).optional(),
  commissionValue: z.coerce.number().optional(),
  ativo: z.boolean().default(true),
});

type AddServiceFormValues = z.infer<typeof formSchema>;

interface AddServiceFormProps {
  shopId: string;
  initialData?: Service;
  onSuccess?: () => void;
}

export function AddServiceForm({ shopId, initialData, onSuccess }: AddServiceFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const MAX_BYTES = 1024 * 1024; // 1MB
  const ALLOWED_TYPES = ['image/png', 'image/jpeg'];

  async function cropCenterSquare(file: File): Promise<Blob> {
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, sx, sy, size, size, 0, 0, size, size);
    const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const quality = mime === 'image/jpeg' ? 0.85 : undefined;
    return await new Promise((resolve) => canvas.toBlob(b => resolve(b as Blob), mime, quality));
  }

  const onUploadImage = async (file: File) => {
    try {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ variant: 'destructive', title: 'Formato inválido', description: 'Envie PNG ou JPG.' });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast({ variant: 'destructive', title: 'Arquivo muito grande', description: 'Tamanho máximo de 1MB.' });
        return;
      }
      setUploading(true);
      const cropped = await cropCenterSquare(file);
      const storage = getStorage();
      const key = `barberShops/${shopId}/services/${initialData?.id || 'new'}/image_${Date.now()}`;
      const ref = storageRef(storage, key);
      const task = uploadBytesResumable(ref, cropped, { contentType: file.type });
      task.on('state_changed', (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        setUploadProgress(pct);
      });
      await task;
      const url = await getDownloadURL(ref);
      form.setValue('imageUrl', url, { shouldDirty: true, shouldValidate: true });
      toast({ title: 'Imagem atualizada!', description: 'Upload concluído com sucesso.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Falha no upload', description: 'Tente novamente.' });
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const form = useForm<AddServiceFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      imageUrl: initialData.imageUrl || '',
      description: initialData.description || '',
      cost: initialData.cost || 0,
      isCommissionEnabled: initialData.partnership?.isCommissionEnabled || false,
      commissionType: initialData.partnership?.commissionType,
      commissionValue: initialData.partnership?.commissionValue,
      ativo: initialData.ativo === undefined ? true : initialData.ativo,
    } : {
      name: '',
      description: '',
      price: 0,
      cost: 0,
      duration: 30,
      imageUrl: '',
      isCommissionEnabled: false,
      commissionType: 'percentage',
      commissionValue: 0,
      ativo: true,
    },
  });

  const { isSubmitting } = form.formState;
  const isCommissionEnabled = form.watch('isCommissionEnabled');

  const onSubmit = async (values: AddServiceFormValues) => {
    try {
        const serviceData = {
            name: values.name,
            description: values.description,
            price: values.price,
            cost: values.cost,
            duration: values.duration,
            imageUrl: values.imageUrl,
            barberShopId: shopId,
            ativo: values.ativo,
            partnership: {
                isCommissionEnabled: values.isCommissionEnabled,
                commissionType: values.commissionType,
                commissionValue: values.commissionValue,
            },
            createdAt: serverTimestamp()
        };

        if (initialData) {
            const serviceRef = doc(firestore, 'barberShops', shopId, 'services', initialData.id);
            setDocumentNonBlocking(serviceRef, serviceData, { merge: true });
        } else {
            const serviceRef = collection(firestore, 'barberShops', shopId, 'services');
            addDocumentNonBlocking(serviceRef, serviceData);
        }

        toast({
            title: initialData ? 'Serviço Atualizado!' : 'Serviço Adicionado!',
            description: `O serviço "${values.name}" foi salvo com sucesso.`,
        });
        onSuccess?.();
        if (!initialData) form.reset();

    } catch(error) {
        console.error("Error saving service: ", error);
        toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar o serviço.',
        });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Serviço</FormLabel>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Input placeholder="Ex: Corte de Cabelo" {...field} className="pl-10" />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <div className="relative">
                <PenSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <FormControl>
                  <Textarea
                    placeholder="Descreva o serviço, ex: Corte clássico ou moderno, na tesoura ou máquina."
                    {...field}
                    className="pl-10"
                    value={field.value || ''}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Preço (R$)</FormLabel>
                <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input type="number" placeholder="50.00" {...field} className="pl-10" />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel>Custo (R$)</FormLabel>
                  <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                      <Input type="number" placeholder="15.00" {...field} className="pl-10" />
                      </FormControl>
                  </div>
                  <FormMessage />
                  </FormItem>
              )}
              />
            <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
                <FormItem className="lg:col-span-1">
                <FormLabel>Duração (minutos)</FormLabel>
                <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                    <Input type="number" placeholder="30" {...field} step="15" className="pl-10" />
                    </FormControl>
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Parceria e Comissão</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <FormField
                control={form.control}
                name="isCommissionEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Habilitar Parceria/Comissão
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Ative para definir uma comissão para parceiros.
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isCommissionEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <FormField
                    control={form.control}
                    name="commissionType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tipo de Comissão</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="percentage" />
                              </FormControl>
                              <FormLabel className="font-normal">Porcentagem (%)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="fixed" />
                              </FormControl>
                              <FormLabel className="font-normal">Valor Fixo (R$)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="commissionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor da Comissão</FormLabel>
                        <div className="relative">
                          {form.watch('commissionType') === 'fixed' ? (
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          )}
                          <FormControl>
                            <Input type="number" placeholder="50" {...field} className="pl-10" />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="space-y-4 rounded-lg border p-4 mt-4">
                <FormField
                  control={form.control}
                  name="ativo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Serviço Ativo</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Desative para ocultar este serviço da lista de agendamentos.
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>


        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Salvar Alterações' : 'Salvar Serviço'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

    
