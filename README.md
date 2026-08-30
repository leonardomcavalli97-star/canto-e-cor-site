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
  descrição, dados de contato) → cria a encomenda e redireciona para o Pix (QR Code
  próprio) ou o checkout da InfinitePay, dependendo do que o cliente escolher
- `/contato` — Instagram do ateliê
- `src/lib/pricing.ts` — tamanhos e preços (A5 R$150 / A4 R$180). Mude aqui se os
  valores da tabela mudarem.
- `src/components/ui/sidebar.tsx` — barra de navegação do topo (ícone + nome revelado
  ao passar o mouse na barra; menu mobile em tela cheia)
- `public/brand/` — logo, selo, "Made with love.", assinatura e listrados em SVG
- `public/gallery/` — fotos das peças (WebP otimizado)

## Pagamento

**Pix**: código estático gerado na hora (via `pix-utils`, com a chave Pix do ateliê
configurada em `src/lib/pix.ts`) — não depende de nenhuma conta/API externa.

**Cartão**: usa o **Checkout Integrado da InfinitePay** (redirecionamento hospedado
pela InfinitePay) — o site nunca lida diretamente com dados de cartão.

1. Crie uma conta em [infinitepay.io](https://www.infinitepay.io/) (isso você precisa
   fazer você mesma/o — eu não posso criar contas em seu nome) e pegue seu handle (@tag).
2. Copie `.env.example` para `.env.local` e preencha:
   ```
   INFINITEPAY_HANDLE=seu-handle
   INFINITEPAY_API_KEY=
   ```
3. A confirmação de pagamento chega por dois caminhos, por segurança: o webhook
   (`/api/webhook/infinitepay`, informado automaticamente a cada cobrança criada) e uma
   verificação ativa quando o cliente retorna pra página de confirmação.

Sem o handle configurado, o formulário de `/pedido` continua salvando a encomenda e as
fotos normalmente, só não consegue gerar o link de pagamento por cartão (mostra um
aviso amigável). O Pix funciona independente disso.

## Onde ficam os pedidos

Por enquanto, pedidos e fotos de referência são salvos localmente em `data/orders/` e
`data/uploads/` (fora do Git). **Isso funciona rodando em um servidor próprio ou VPS,
mas não em hospedagens serverless como Vercel**, onde o disco é temporário — antes de
publicar em produção, trocar esse armazenamento por um serviço externo (ex: Vercel
Blob para as fotos + um banco de dados) e configurar notificação por e-mail para você
saber quando chega um pedido novo.

## Próximos passos sugeridos

- Configurar a InfinitePay em produção (handle real, sem chaves de teste)
- Se quiser trocar "The Seasons"/Cormorant Garamond por outra fonte licenciada no
  futuro, é só trocar o import em `src/app/layout.tsx`
