# 🔗 Integração: Next.js Barbearia + Evolution API

## 📊 Arquitetura de Integração

```
┌─────────────────────────────────────────────────┐
│  Frontend Next.js (Firebase Hosting)            │
│  https://barbearia-saas.web.app                 │
│  ├── Painel do Cliente                          │
│  ├── Agendamentos                               │
│  ├── Relatórios                                 │
│  └── Configurações                              │
└────────────────┬────────────────────────────────┘
                 │
                 │ HTTPS API Calls
                 ▼
┌─────────────────────────────────────────────────┐
│  Cloud Functions (Firebase)                     │
│  └── Proxy seguro para Evolution API            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│  Backend (GCP Free Tier)                        │
│  http://SEU_IP:8080                             │
│  ├── Evolution API (WhatsApp)                   │
│  ├── N8N (Automação)                            │
│  └── Webhooks                                   │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Passo a Passo de Integração

### 1️⃣ Clonar Seu Projeto Next.js

```bash
# No seu computador
cd C:\projetos
git clone https://github.com/Devluizpaulo/Barbearia-SaaS.git
cd Barbearia-SaaS

# Instalar dependências
npm install
```

---

### 2️⃣ Criar Serviço de API no Next.js

Crie `src/lib/evolutionApi.ts`:

```typescript
// src/lib/evolutionApi.ts
import { getAuth } from 'firebase/auth';

const EVOLUTION_API_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || 'free_tier_key_2024';

interface SendMessageParams {
  instanceName: string;
  phoneNumber: string;
  message: string;
}

interface CreateInstanceParams {
  instanceName: string;
}

class EvolutionApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = EVOLUTION_API_URL;
    this.apiKey = EVOLUTION_API_KEY;
  }

  // Headers padrão
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    };
  }

  // Criar instância WhatsApp
  async createInstance(params: CreateInstanceParams) {
    try {
      const response = await fetch(\`\${this.baseUrl}/instance/create\`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          instanceName: params.instanceName,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });

      if (!response.ok) {
        throw new Error(\`Erro ao criar instância: \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      throw error;
    }
  }

  // Conectar instância (obter QR Code)
  async connectInstance(instanceName: string) {
    try {
      const response = await fetch(\`\${this.baseUrl}/instance/connect/\${instanceName}\`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(\`Erro ao conectar instância: \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao conectar instância:', error);
      throw error;
    }
  }

  // Obter QR Code
  async getQRCode(instanceName: string) {
    try {
      const response = await fetch(\`\${this.baseUrl}/instance/qrcode/\${instanceName}\`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(\`Erro ao obter QR Code: \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao obter QR Code:', error);
      throw error;
    }
  }

  // Verificar status da instância
  async getInstanceStatus(instanceName: string) {
    try {
      const response = await fetch(\`\${this.baseUrl}/instance/connectionState/\${instanceName}\`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(\`Erro ao verificar status: \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      throw error;
    }
  }

  // Enviar mensagem de texto
  async sendTextMessage(params: SendMessageParams) {
    try {
      const response = await fetch(\`\${this.baseUrl}/message/sendText/\${params.instanceName}\`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          number: \`\${params.phoneNumber}@s.whatsapp.net\`,
          text: params.message,
        }),
      });

      if (!response.ok) {
        throw new Error(\`Erro ao enviar mensagem: \${response.statusText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  // Enviar lembrete de agendamento
  async sendAppointmentReminder(instanceName: string, appointment: any) {
    const message = \`
🗓️ *Lembrete de Agendamento*

Olá \${appointment.customerName}! 

Você tem um horário agendado:

📅 Data: \${new Date(appointment.date).toLocaleDateString('pt-BR')}
⏰ Horário: \${appointment.time}
✂️ Serviço: \${appointment.service}

Nos vemos em breve! 😊

_Caso precise cancelar ou reagendar, entre em contato._
    \`.trim();

    return this.sendTextMessage({
      instanceName,
      phoneNumber: appointment.customerPhone,
      message,
    });
  }

  // Enviar confirmação de agendamento
  async sendAppointmentConfirmation(instanceName: string, appointment: any) {
    const message = \`
✅ *Agendamento Confirmado!*

Olá \${appointment.customerName}!

Seu horário foi confirmado:

📅 Data: \${new Date(appointment.date).toLocaleDateString('pt-BR')}
⏰ Horário: \${appointment.time}
✂️ Serviço: \${appointment.service}
💰 Valor: R$ \${appointment.price}

Obrigado por escolher nossa barbearia! 😊
    \`.trim();

    return this.sendTextMessage({
      instanceName,
      phoneNumber: appointment.customerPhone,
      message,
    });
  }
}

export const evolutionApi = new EvolutionApiService();
```

---

### 3️⃣ Criar Variáveis de Ambiente

Crie `.env.local` no projeto Next.js:

```env
# Evolution API
NEXT_PUBLIC_EVOLUTION_API_URL=http://SEU_IP_GCP:8080
NEXT_PUBLIC_EVOLUTION_API_KEY=free_tier_key_2024

# Firebase (já deve ter)
NEXT_PUBLIC_FIREBASE_API_KEY=sua_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
# ... outras configs Firebase
```

---

### 4️⃣ Criar Componente de Conexão WhatsApp

Crie `src/components/WhatsAppConnect.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { evolutionApi } from '@/lib/evolutionApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QRCode from 'react-qr-code';

interface WhatsAppConnectProps {
  instanceName: string;
  onConnected?: () => void;
}

export function WhatsAppConnect({ instanceName, onConnected }: WhatsAppConnectProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Verificar status da conexão
  const checkStatus = async () => {
    try {
      const result = await evolutionApi.getInstanceStatus(instanceName);
      
      if (result.state === 'open') {
        setStatus('connected');
        setQrCode('');
        onConnected?.();
      } else {
        setStatus('disconnected');
      }
    } catch (err) {
      console.error('Erro ao verificar status:', err);
    }
  };

  // Conectar WhatsApp
  const handleConnect = async () => {
    try {
      setLoading(true);
      setError('');
      setStatus('connecting');

      // Criar instância se não existir
      try {
        await evolutionApi.createInstance({ instanceName });
      } catch (err) {
        // Instância já existe, tudo bem
      }

      // Conectar e obter QR Code
      const connectResult = await evolutionApi.connectInstance(instanceName);
      
      if (connectResult.qrcode?.base64) {
        setQrCode(connectResult.qrcode.base64);
      }

      // Verificar status a cada 3 segundos
      const interval = setInterval(async () => {
        await checkStatus();
      }, 3000);

      // Limpar interval após 2 minutos
      setTimeout(() => {
        clearInterval(interval);
        if (status === 'connecting') {
          setError('Tempo limite excedido. Tente novamente.');
          setStatus('disconnected');
          setQrCode('');
        }
      }, 120000);

    } catch (err: any) {
      setError(err.message || 'Erro ao conectar WhatsApp');
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Verificar status ao montar componente
  useEffect(() => {
    checkStatus();
  }, [instanceName]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">WhatsApp Business</h3>
            <p className="text-sm text-gray-500">
              Instância: {instanceName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={\`h-3 w-3 rounded-full \${
              status === 'connected' ? 'bg-green-500' :
              status === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }\`} />
            <span className="text-sm">
              {status === 'connected' ? 'Conectado' :
               status === 'connecting' ? 'Conectando...' :
               'Desconectado'}
            </span>
          </div>
        </div>

        {status === 'disconnected' && (
          <Button
            onClick={handleConnect}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Conectando...' : 'Conectar WhatsApp'}
          </Button>
        )}

        {status === 'connecting' && qrCode && (
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-white rounded-lg">
              <QRCode value={qrCode} size={256} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">
                Escaneie o QR Code com WhatsApp
              </p>
              <ol className="text-xs text-gray-500 space-y-1">
                <li>1. Abra o WhatsApp no celular</li>
                <li>2. Toque em Menu (⋮) → Aparelhos conectados</li>
                <li>3. Toque em Conectar um aparelho</li>
                <li>4. Escaneie o QR Code acima</li>
              </ol>
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-green-600">
              WhatsApp Conectado!
            </p>
            <p className="text-xs text-gray-500">
              Agora você pode enviar mensagens automáticas
            </p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

### 5️⃣ Integrar com Firestore (Agendamentos)

Crie `src/hooks/useAppointments.ts`:

```typescript
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { evolutionApi } from '@/lib/evolutionApi';

export interface Appointment {
  id?: string;
  customerName: string;
  customerPhone: string;
  service: string;
  date: Date;
  time: string;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reminderSent: boolean;
  confirmationSent: boolean;
  userId: string;
}

export function useAppointments(userId: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar agendamentos em tempo real
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
      })) as Appointment[];

      setAppointments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Criar novo agendamento
  const createAppointment = async (appointment: Omit<Appointment, 'id' | 'reminderSent' | 'confirmationSent'>) => {
    try {
      const docRef = await addDoc(collection(db, 'appointments'), {
        ...appointment,
        reminderSent: false,
        confirmationSent: false,
        createdAt: new Date(),
      });

      // Enviar confirmação via WhatsApp
      const instanceName = \`barbearia_\${userId}\`;
      await evolutionApi.sendAppointmentConfirmation(instanceName, appointment);

      // Atualizar que confirmação foi enviada
      await updateDoc(doc(db, 'appointments', docRef.id), {
        confirmationSent: true,
      });

      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  };

  // Enviar lembrete
  const sendReminder = async (appointmentId: string) => {
    try {
      const appointment = appointments.find(a => a.id === appointmentId);
      if (!appointment) throw new Error('Agendamento não encontrado');

      const instanceName = \`barbearia_\${userId}\`;
      await evolutionApi.sendAppointmentReminder(instanceName, appointment);

      // Atualizar que lembrete foi enviado
      await updateDoc(doc(db, 'appointments', appointmentId), {
        reminderSent: true,
      });

      return true;
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
      throw error;
    }
  };

  return {
    appointments,
    loading,
    createAppointment,
    sendReminder,
  };
}
```

---

### 6️⃣ Adicionar ao package.json

```json
{
  "dependencies": {
    // ... suas dependências existentes
    "react-qr-code": "^2.0.12"
  }
}
```

Instale:
```bash
npm install react-qr-code
```

---

### 7️⃣ Usar no Dashboard

Crie página `src/app/dashboard/whatsapp/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { WhatsAppConnect } from '@/components/WhatsAppConnect';
import { Button } from '@/components/ui/button';

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  
  const instanceName = user ? \`barbearia_\${user.uid}\` : '';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Business</h1>
          <p className="text-gray-600">
            Conecte seu WhatsApp para enviar mensagens automáticas
          </p>
        </div>

        <WhatsAppConnect
          instanceName={instanceName}
          onConnected={() => setConnected(true)}
        />

        {connected && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Recursos Disponíveis</h2>
            <div className="grid gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">✅ Confirmação de Agendamento</h3>
                <p className="text-sm text-gray-600">
                  Enviada automaticamente quando cliente agenda horário
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">🔔 Lembrete Automático</h3>
                <p className="text-sm text-gray-600">
                  Enviado 1 hora antes do horário agendado
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium">💬 Respostas Automáticas</h3>
                <p className="text-sm text-gray-600">
                  Responde perguntas frequentes automaticamente
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 🎯 Fluxo Completo

### Quando Cliente Agenda:

```typescript
// 1. Cliente agenda no frontend
const appointmentId = await createAppointment({
  customerName: 'João Silva',
  customerPhone: '5511999999999',
  service: 'Corte + Barba',
  date: new Date('2025-10-15'),
  time: '14:00',
  price: 35,
  status: 'confirmed',
  userId: user.uid,
});

// 2. Automaticamente envia confirmação via WhatsApp
// ✅ Mensagem enviada: "Agendamento Confirmado! ..."

// 3. N8N monitora e envia lembrete 1h antes
// 🔔 Webhook do N8N → Firestore → Evolution API → WhatsApp
```

---

## 🔐 Segurança (Cloud Functions)

Para produção, crie Cloud Functions para proteger a API:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendWhatsAppMessage = functions.https.onCall(async (data, context) => {
  // Verificar autenticação
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Usuário não autenticado');
  }

  const { instanceName, phoneNumber, message } = data;

  // Fazer requisição para Evolution API
  const response = await fetch(\`\${EVOLUTION_API_URL}/message/sendText/\${instanceName}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: \`\${phoneNumber}@s.whatsapp.net\`,
      text: message,
    }),
  });

  return await response.json();
});
```

---

## 📊 Resumo da Integração

| Componente | Função | Tecnologia |
|------------|--------|------------|
| **Frontend** | Interface do usuário | Next.js + Firebase Hosting |
| **Database** | Armazenamento de dados | Cloud Firestore |
| **Auth** | Autenticação | Firebase Auth |
| **WhatsApp** | Envio de mensagens | Evolution API (GCP) |
| **Automação** | Workflows | N8N (GCP) |
| **Segurança** | Proxy de API | Cloud Functions |

---

## 🚀 Deploy

```bash
# 1. Deploy Backend no GCP Free Tier
# Siga: DEPLOY_GCP_FREE.md

# 2. Deploy Frontend no Firebase
cd Barbearia-SaaS
npm run build
firebase deploy
```

---

**✅ Seu sistema estará 100% integrado e funcional!**

**Quer que eu crie um PR no seu repositório com essas integrações?**
