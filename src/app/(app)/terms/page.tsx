'use client';

export default function TermsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Termos de Uso</h1>
      <p className="text-sm text-muted-foreground text-justify">
        Este software é de propriedade de <strong>Nexus Systems LPJ</strong> (CNPJ 62.618.880/0001-11). Ao utilizar nossa plataforma ("Serviço"), você concorda em cumprir os seguintes Termos de Uso.
      </p>
      <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground text-justify">
        <li>
          <strong>Uso do Serviço:</strong> Você concorda em utilizar o sistema de acordo com a legislação vigente e para os fins a que se destina, sendo responsável por toda a atividade que ocorre em sua conta.
        </li>
        <li>
          <strong>Contas e Responsabilidades:</strong> Você é responsável por manter a segurança de sua conta e senha. A empresa não pode e não será responsável por qualquer perda ou dano decorrente de sua falha em cumprir com esta obrigação de segurança.
        </li>
        <li>
          <strong>Pagamentos e Assinaturas:</strong> As taxas para os planos de assinatura são cobradas antecipadamente de forma recorrente e não são reembolsáveis, exceto quando exigido por lei. O cancelamento da assinatura impede novas cobranças, mantendo o acesso até o final do período já pago.
        </li>
        <li>
          <strong>Propriedade Intelectual:</strong> O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão como propriedade exclusiva da Nexus Systems LPJ. Não é permitida a engenharia reversa, cópia não autorizada ou redistribuição do software.
        </li>
        <li>
          <strong>Limitação de Responsabilidade:</strong> O serviço é fornecido "como está". Em nenhuma circunstância seremos responsáveis por quaisquer danos diretos ou indiretos resultantes do uso ou da incapacidade de usar o serviço.
        </li>
         <li>
          <strong>Rescisão:</strong> Podemos rescindir ou suspender seu acesso ao nosso Serviço imediatamente, sem aviso prévio ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar os Termos.
        </li>
      </ol>
    </div>
  );
}
