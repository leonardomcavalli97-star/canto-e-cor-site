import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso | Canto e Cor",
  description: "Regras e condições para encomendar uma aquarela personalizada no Ateliê Canto e Cor.",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Legal</p>
      <h1 className="font-serif-display text-4xl text-foreground">Termos de Uso</h1>
      <p className="mt-4 text-sm text-foreground/60">Última atualização: setembro de 2026.</p>

      <div className="mt-10 space-y-8 text-foreground/80">
        <section>
          <p>
            Este site é operado pelo <strong>Ateliê Canto e Cor</strong>, de Lívia Davila
            Lopes, e existe para apresentar o trabalho da atelier e permitir a encomenda de
            aquarelas personalizadas. Ao usar o site ou fazer um pedido em{" "}
            <code>/pedido</code>, você concorda com estes termos.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">O serviço</h2>
          <p className="mt-3">
            Cada peça é uma aquarela pintada à mão, feita individualmente a partir da foto de
            referência e das instruções enviadas no formulário de encomenda. Os tamanhos,
            preços e prazos de urgência disponíveis são os exibidos no site no momento do
            pedido e podem mudar sem aviso prévio para novas encomendas.
          </p>
          <p className="mt-3">
            Para o tamanho &quot;Personalizado&quot;, o valor é combinado antes de qualquer
            cobrança, conforme o tamanho e a complexidade do desenho.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Foto de referência</h2>
          <p className="mt-3">
            Ao enviar uma foto no formulário, você declara que tem o direito de usá-la e de
            autorizar sua reprodução em forma de pintura (por exemplo, por ser sua, de sua
            autoria, ou por ter permissão de quem aparece nela). O Ateliê Canto e Cor não se
            responsabiliza pelo uso indevido de imagens de terceiros enviadas por clientes.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Pagamento</h2>
          <p className="mt-3">
            O pagamento é feito via Pix, usando o QR Code gerado no site. Como o Pix não é
            confirmado automaticamente, a produção da peça só começa depois que o pagamento
            é conferido manualmente pelo ateliê. Guarde o comprovante até receber a
            confirmação.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Prazo e produção</h2>
          <p className="mt-3">
            O prazo de entrega varia conforme a opção de urgência escolhida e a fila de
            pedidos em andamento. Prazos são estimativas de produção artesanal e podem sofrer
            pequenas variações; em caso de atraso relevante, o ateliê avisa o cliente pelo
            contato informado no pedido.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Cancelamento e reembolso</h2>
          <p className="mt-3">
            Pedidos podem ser cancelados sem custo antes da confirmação do pagamento. Depois
            que a pintura é iniciada, por se tratar de um item personalizado e feito sob
            encomenda, o cancelamento só é possível mediante acordo entre as partes,
            considerando o trabalho já realizado. Peças com defeito de produção são refeitas
            ou reembolsadas às custas do ateliê.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Envio</h2>
          <p className="mt-3">
            A peça é enviada para o endereço informado no pedido. O prazo e o valor de frete
            são exibidos no formulário antes da confirmação; extravios ou danos durante o
            transporte são tratados junto à transportadora responsável, com o suporte do
            ateliê.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Direitos sobre a obra</h2>
          <p className="mt-3">
            A peça física pintada pertence ao cliente após a entrega. O Ateliê Canto e Cor
            mantém o direito autoral sobre a técnica e a execução artística e pode fotografar
            a peça para fins de portfólio antes do envio; a foto de referência do cliente só
            é usada publicamente com autorização prévia, como descrito na{" "}
            <a href="/privacidade" className="text-accent hover:text-accent-dark">
              Política de Privacidade
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Alterações destes termos</h2>
          <p className="mt-3">
            Estes termos podem ser atualizados de tempos em tempos. A data no topo desta
            página sempre indica a versão mais recente. Dúvidas podem ser enviadas pela
            página de <a href="/contato" className="text-accent hover:text-accent-dark">Contato</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
