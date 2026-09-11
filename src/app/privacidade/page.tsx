import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade | Canto e Cor",
  description: "Como o Ateliê Canto e Cor coleta, usa e protege seus dados pessoais.",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="mb-3 text-xs tracking-[0.2em] text-accent uppercase">Legal</p>
      <h1 className="font-serif-display text-4xl text-foreground">Política de Privacidade</h1>
      <p className="mt-4 text-sm text-foreground/60">Última atualização: setembro de 2026.</p>

      <div className="mt-10 space-y-8 text-foreground/80">
        <section>
          <p>
            Esta política explica como o <strong>Ateliê Canto e Cor</strong>, conduzido por
            Lívia Davila Lopes, coleta, usa e protege os dados pessoais de quem visita este
            site ou faz uma encomenda, em conformidade com a Lei Geral de Proteção de Dados
            (Lei nº 13.709/2018 — LGPD).
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Quais dados coletamos</h2>
          <p className="mt-3">
            Ao preencher o formulário de encomenda em <code>/pedido</code>, coletamos:
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Nome completo, e-mail e telefone/WhatsApp;</li>
            <li>Endereço de entrega (CEP, rua, número, bairro, cidade e estado);</li>
            <li>A foto de referência enviada e a descrição do pedido;</li>
            <li>Comprovante de pagamento, quando enviado.</li>
          </ul>
          <p className="mt-3">
            Não coletamos dados de cartão de crédito ou qualquer informação bancária: o
            pagamento é feito por Pix, diretamente no aplicativo do seu banco, e o site nunca
            tem acesso a essas informações.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Para que usamos seus dados</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Produzir a aquarela encomendada, a partir da foto e das instruções enviadas;</li>
            <li>Combinar prazo, valores e forma de pagamento;</li>
            <li>Enviar a peça no endereço informado;</li>
            <li>Avisar sobre o andamento do pedido (confirmação, pagamento, envio);</li>
            <li>Responder dúvidas enviadas por e-mail, formulário ou Instagram.</li>
          </ul>
          <p className="mt-3">
            A foto de referência é usada exclusivamente para pintar a peça encomendada. Ela
            só é publicada no portfólio, Instagram ou neste site (galeria) mediante
            autorização prévia do cliente, pedida individualmente em cada caso.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Onde seus dados ficam guardados</h2>
          <p className="mt-3">
            Os pedidos e as fotos de referência são armazenados de forma privada no Vercel
            Blob, um serviço de armazenamento em nuvem. As fotos nunca ficam em um link
            público: só são acessadas por uma área administrativa protegida por senha,
            usada pela Lívia para acompanhar os pedidos.
          </p>
          <p className="mt-3">
            Usamos também o serviço Resend para enviar e-mails automáticos (confirmação de
            pedido, aviso de pagamento, notificação de envio) e a Vercel para hospedar o
            site. Esses serviços têm acesso apenas aos dados estritamente necessários para
            cumprir essas funções.
          </p>
          <p className="mt-3">
            Uma rotina automática diária remove fotos de referência de pedidos muito antigos
            que nunca foram confirmados/pagos, reduzindo o tempo em que dados desnecessários
            ficam armazenados.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Com quem compartilhamos</h2>
          <p className="mt-3">
            Não vendemos nem alugamos seus dados. Compartilhamos apenas o necessário com os
            fornecedores dos serviços que os processos acima exigem (armazenamento e
            hospedagem na Vercel, envio de e-mails via Resend) e, quando aplicável, com a
            transportadora responsável pela entrega da sua encomenda.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Seus direitos</h2>
          <p className="mt-3">Você pode, a qualquer momento, solicitar:</p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Confirmação de quais dados seus estão armazenados;</li>
            <li>Correção de dados incompletos ou desatualizados;</li>
            <li>Exclusão dos seus dados, respeitado o prazo mínimo exigido por lei para
              comprovantes fiscais ou de pagamento, quando existirem;</li>
            <li>Informação sobre com quem seus dados foram compartilhados.</li>
          </ul>
          <p className="mt-3">
            Para exercer qualquer um desses direitos, entre em contato pelo Instagram{" "}
            <a
              href="https://www.instagram.com/cantoecoratelie/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-dark"
            >
              @cantoecoratelie
            </a>{" "}
            ou pelo e-mail informado na página de{" "}
            <a href="/contato" className="text-accent hover:text-accent-dark">Contato</a>.
          </p>
        </section>

        <section>
          <h2 className="font-serif-display text-2xl text-foreground">Alterações desta política</h2>
          <p className="mt-3">
            Esta política pode ser atualizada de tempos em tempos para refletir mudanças no
            site ou na forma como tratamos os dados. A data no topo desta página sempre
            indica a versão mais recente.
          </p>
        </section>
      </div>
    </div>
  );
}
