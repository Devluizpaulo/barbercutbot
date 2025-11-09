
'use client';

import { useForm } from 'react-hook-form';
import { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, LoaderCircle, Building2, ImageIcon, Phone, Hash, Instagram, Globe } from 'lucide-react';
import type { BarberShop } from '@/lib/types';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';

const profileFormSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  logo: z.string().url('URL da logo inválida.').optional().or(z.literal('')),
  document: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  website: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface ProfileFormProps {
  shopId: string;
  initialData: BarberShop;
}

export function ProfileForm({ shopId, initialData }: ProfileFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const uploadTaskRef = useRef<UploadTask | null>(null);
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: initialData.name || '',
      logo: initialData.logo || '',
      document: initialData.document || '',
      contactPerson: initialData.contactPerson || '',
      phone: initialData.phone || '',
      instagram: initialData.instagram || '',
      facebook: initialData.facebook || '',
      website: initialData.website || '',
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    const shopRef = doc(firestore, 'barberShops', shopId);
    const sanitizedValues = {
      ...values,
      logo: values.logo || '',
      document: values.document || '',
      contactPerson: values.contactPerson || '',
      phone: values.phone || '',
      instagram: values.instagram || '',
      facebook: values.facebook || '',
      website: values.website || '',
    };
    setDocumentNonBlocking(shopRef, sanitizedValues, { merge: true });
    toast({
      title: 'Perfil atualizado!',
      description: 'As informações do seu negócio foram salvas.',
    });
  };

  const onUploadLogo = async (file: File) => {    
    try {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: 'Formato inválido', description: 'Envie PNG ou JPG.', variant: 'destructive' });
        return;
      }
      if (file.size > MAX_BYTES) {
        toast({ title: 'Arquivo muito grande', description: 'Tamanho máximo de 1MB.', variant: 'destructive' });
        return;
      }
      setUploading(true);
      const cropped = await cropCenterSquare(file);
      const storage = getStorage();
      const key = `barberShops/${shopId}/logo_${Date.now()}`;
      const ref = storageRef(storage, key);
      const task = uploadBytesResumable(ref, cropped, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
      uploadTaskRef.current = task;
      await new Promise<void>((resolve, reject) => {
        task.on('state_changed', (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setUploadProgress(pct);
        }, (err) => reject(err), () => resolve());
      });
      const url = await getDownloadURL(ref);
      form.setValue('logo', url, { shouldDirty: true, shouldValidate: true });
      const shopRef = doc(firestore, 'barberShops', shopId);
      setDocumentNonBlocking(shopRef, { logo: url }, { merge: true });
      toast({ title: 'Logo atualizada!', description: 'A imagem foi enviada com sucesso.' });
    } catch (e: any) {
      if (e.code !== 'storage/canceled') {
        toast({ title: 'Falha ao enviar logo', description: e.message || 'Tente novamente.', variant: 'destructive' });
      }
    } finally {
      setUploading(false);
      setUploadProgress(null);
      uploadTaskRef.current = null;
    }
  };

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Perfil do Negócio</CardTitle>
            <CardDescription>
              Informações que seus clientes verão sobre sua barbearia.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div
                className="relative group"
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) onUploadLogo(f);
                }}
              >
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={form.watch('logo')}
                    alt={form.watch('name')}
                  />
                  <AvatarFallback>
                    <Building2 />
                  </AvatarFallback>
                </Avatar>
                {uploadProgress !== null && (
                   <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                     <div className="h-2 w-16 bg-muted rounded-full overflow-hidden">
                       <div className="h-full bg-primary" style={{ width: `${uploadProgress}%` }} />
                     </div>
                   </div>
                )}
                 <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <ImageIcon className="h-8 w-8 text-white" />
                 </div>
              </div>
              <div className="flex-1 space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadLogo(f);
                  }}
                />
                <div className="flex gap-2">
                    <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    >
                    {isUploading ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <ImageIcon className="mr-2" />}
                    Enviar imagem
                    </Button>
                    <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                        const currentUrl = form.getValues('logo');
                        if (currentUrl) {
                        try {
                            const storage = getStorage();
                            const ref = storageRef(storage, currentUrl);
                            await deleteObject(ref);
                        } catch {}
                        }
                        form.setValue('logo', '', { shouldDirty: true, shouldValidate: true });
                        const shopRef = doc(firestore, 'barberShops', shopId);
                        setDocumentNonBlocking(shopRef, { logo: '' }, { merge: true });
                        toast({ title: 'Logo removida', description: 'A logo foi resetada.' });
                    }}
                    >
                    Remover logo
                    </Button>
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Negócio</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Barbearia do Zé"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone para Contato</FormLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="(11) 99999-9999"
                          {...field}
                          value={field.value || ''}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="document"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ / CPF</FormLabel>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          value={field.value || ''}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="instagram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram</FormLabel>
                    <div className="relative">
                      <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="https://instagram.com/seu_negocio"
                          {...field}
                          value={field.value || ''}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input
                          placeholder="https://seunegocio.com.br"
                          {...field}
                          value={field.value || ''}
                          className="pl-10"
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-end w-full">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Salvar Perfil
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
