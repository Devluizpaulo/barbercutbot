'use client';

export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Política de Privacidade</h1>
      <p className="text-sm text-muted-foreground text-justify">
        Este software é de propriedade de <strong>Nexus Systems LPJ</strong> (CNPJ 62.618.880/0001-11). Esta Política de Privacidade descreve como suas informações são coletadas, usadas e compartilhadas quando você utiliza nossa plataforma.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground text-justify">
        <li>
          <strong>Coleta de Informações:</strong> Coletamos informações que você nos fornece diretamente, como nome, e-mail e dados do seu negócio, bem como informações geradas pelo uso da plataforma, como agendamentos e registros financeiros, para a operação do serviço.
        </li>
        <li>
          <strong>Uso dos Dados:</strong> Seus dados são utilizados para autenticação, prestação de suporte, processamento de pagamentos, melhoria de nossos produtos e comunicação sobre atualizações importantes do serviço.
        </li>
        <li>
          <strong>Compartilhamento de Dados:</strong> Não compartilhamos suas informações pessoais com terceiros, exceto quando necessário para a prestação do serviço (ex: provedores de pagamento como Stripe) ou se exigido por lei.
        </li>
        <li>
          <strong>Segurança:</strong> Empregamos medidas de segurança para proteger suas informações contra acesso, alteração, divulgação ou destruição não autorizada.
        </li>
        <li>
          <strong>Seus Direitos:</strong> Você pode solicitar o acesso, correção ou exclusão de seus dados pessoais a qualquer momento, entrando em contato com nosso suporte, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
        </li>
        <li>
          <strong>Alterações na Política:</strong> Podemos atualizar esta política periodicamente. Notificaremos você sobre quaisquer alterações significativas através da plataforma ou por e-mail.
        </li>
      </ol>
    </div>
  );
}
