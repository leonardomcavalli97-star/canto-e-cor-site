# Canto e Cor — site do ateliê

Site institucional + encomenda de aquarelas personalizadas, feito em Next.js (App
Router) + Tailwind CSS. Identidade visual aplicada a partir do brand kit do Canto e
Cor: paleta oficial (bordô #6F1823, azul-marinho #002D6F, creme #E2E0D9/#EBE9CA, tinta
#262626), logo, selo, "Made with love." e assinatura em vetor real (`public/brand/`).

Fontes: **Poppins** (real, do brand kit) para o corpo do texto; **Cormorant
Garamond** nos títulos como substituta permanente de "The Seasons" — é uma fonte paga
e não foi possível obter o arquivo licenciado, então essa é a escolha definitiva.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Estrutura

- `/` — home, com peças reais da galeria, "Como funciona" e depoimentos de clientes
- `/galeria` — trabalhos do ateliê (fotos reais em `public/gallery/`)
- `/sobre` — sobre o ateliê + seção "Quem pinta" com a história da Lívia
- `/pedido` — **formulário de encomenda** (tamanho, tema, foto de referência,
  descrição, dados de contato) → cria a encomenda e redireciona para o Stripe Checkout
- `/contato` — Instagram do ateliê
- `src/lib/pricing.ts` — tamanhos e preços (A5 R$150 / A4 R$180). Mude aqui se os
  valores da tabela mudarem.
- `src/components/ui/sidebar.tsx` — barra de navegação do topo (ícone + nome revelado
  ao passar o mouse na barra; menu mobile em tela cheia)
- `public/brand/` — logo, selo, "Made with love.", assinatura e listrados em SVG
- `public/gallery/` — fotos das peças (WebP otimizado)

## Pagamento (Stripe)

O checkout usa o **Stripe Checkout** (redirecionamento hospedado pelo Stripe) — assim
o site nunca lida diretamente com dados de cartão.

1. Crie uma conta em [stripe.com](https://stripe.com) (isso você precisa fazer você
   mesma/o — eu não posso criar contas em seu nome).
2. Copie `.env.example` para `.env.local` e preencha com suas chaves de teste:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Para testar o webhook localmente, use a [Stripe CLI](https://stripe.com/docs/stripe-cli):
   `stripe listen --forward-to localhost:3000/api/webhook`
4. Quando estiver pronta para vender de verdade, troque pelas chaves de produção
   (`sk_live_...` / `whsec_...` do endpoint configurado no Dashboard).

Sem essas chaves, o formulário de `/pedido` continua salvando a encomenda e as fotos
normalmente, só não consegue gerar o link de pagamento (mostra um aviso amigável).

## Onde ficam os pedidos

Por enquanto, pedidos e fotos de referência são salvos localmente em `data/orders/` e
`data/uploads/` (fora do Git). **Isso funciona rodando em um servidor próprio ou VPS,
mas não em hospedagens serverless como Vercel**, onde o disco é temporário — antes de
publicar em produção, trocar esse armazenamento por um serviço externo (ex: Vercel
Blob para as fotos + um banco de dados) e configurar notificação por e-mail para você
saber quando chega um pedido novo.

## Próximos passos sugeridos

- Configurar Stripe em produção e armazenamento externo para fotos/pedidos
- Adicionar notificação (e-mail/WhatsApp) para avisar você a cada novo pedido pago
- Se quiser trocar "The Seasons"/Cormorant Garamond por outra fonte licenciada no
  futuro, é só trocar o import em `src/app/layout.tsx`
