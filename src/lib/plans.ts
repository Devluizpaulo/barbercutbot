
export interface Plan {
    id: 'starter' | 'pro' | 'premium' | 'addon-ia';
    name: string;
    description: string;
    price: number;
    priceDetails: string;
    features: string[];
    isFeatured?: boolean;
    priceId?: string; // Stripe Price ID
    metadata: Record<string, any>;
}

// ATENÇÃO: Substitua os valores de priceId pelos IDs reais gerados no seu painel da Stripe.
// Você pode encontrá-los na seção "Produtos" do seu dashboard Stripe.
export const PLANS: Plan[] = [
    {
        id: 'starter',
        name: 'FlowCuts Starter',
        description: 'Digitalize sua barbearia com o essencial para começar. Agenda inteligente, cadastro de clientes e serviços em um só lugar.',
        price: 89.90,
        priceDetails: 'por mês',
        features: [
            'Gestão de Agendamentos (Calendário)',
            'CRM - Cadastro completo de Clientes',
            'Catálogo de Serviços',
            'Perfil de Divulgação com QR Code',
            'Acesso ilimitado para 1 profissional',
            'Suporte por email',
        ],
        priceId: 'price_1SHntO4tLg09x1bm9YRfwz1h', 
        metadata: {
            features: "agenda,crm,servicos,qrcode",
            max_profissionais: "1",
            suporte: "email"
        }
    },
    {
        id: 'pro',
        name: 'FlowCuts Pro',
        description: 'Tudo do Starter + Controle Financeiro Completo e Gestão Operacional. Saiba exatamente quanto seu negócio está lucrando.',
        price: 179.90,
        priceDetails: 'por mês',
        isFeatured: true,
        features: [
            'Todos os recursos do Starter',
            'Ponto de Venda (PDV/Caixa)',
            'Lançamento de Receitas e Despesas',
            'Relatórios de Desempenho com Gráficos',
            'Gestão de Equipe (até 5 profissionais)',
            'Controle de Produtos e Estoque',
            'Suporte prioritário via chat',
        ],
        priceId: 'price_1SHntx4tLg09x1bmxF6aRWvs', 
        metadata: {
            features: "agenda,crm,servicos,qrcode,financeiro,pdv,estoque,equipe",
            max_profissionais: "5",
            suporte: "chat"
        }
    },
    {
        id: 'premium',
        name: 'FlowCuts Premium',
        description: 'A solução COMPLETA para barbearias modernas. Tudo do Pro + Assistente com IA que atende e agenda automaticamente via WhatsApp 24/7.',
        price: 349.90,
        priceDetails: 'por mês',
        features: [
            'Todos os recursos do Pro',
            'Assistente Virtual com IA para WhatsApp',
            'Agendamento 100% AUTÔNOMO via IA',
            'Até 2.000 mensagens WhatsApp/mês',
            'Profissionais ilimitados',
            'Campanhas de reativação',
            'Suporte VIP prioritário via WhatsApp',
        ],
        priceId: 'price_1SHntc4tLg09x1bmGIw5Aus3', 
        metadata: {
            features: "completo,ia,whatsapp,marketing,automacao",
            max_profissionais: "ilimitado",
            max_mensagens_ia: "2000",
            suporte: "whatsapp_vip"
        }
    },
    {
        id: 'addon-ia',
        name: 'Assistente IA FlowCuts',
        description: 'Adicione Inteligência Artificial ao seu plano e automatize o atendimento no WhatsApp. Seu assistente virtual trabalha 24/7.',
        price: 159.90,
        priceDetails: 'por mês (add-on)',
        features: [
            'Atende clientes instantaneamente',
            'Agenda horários automaticamente',
            'Consulta disponibilidade em tempo real',
            'Até 2.000 mensagens WhatsApp/mês',
            '100.000 tokens de processamento IA/mês'
        ],
        priceId: 'price_1SHo1n4tLg09x1bmlc92xkHS',
        metadata: {
            tipo: "addon",
            max_mensagens_ia: "2000",
            max_tokens_ia: "100000",
            compativel_com: "starter,pro"
        }
    }
];
