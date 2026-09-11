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
  descrição, dados de contato) → cria a encomenda e mostra o Pix (QR Code próprio)
- `/contato` — Instagram do ateliê
- `src/lib/pricing.ts` — tamanhos e preços (A5 R$180 / A4 R$210), taxas de prazo
  expresso e frete. Mude aqui se os valores da tabela mudarem.
- `src/components/ui/sidebar.tsx` — barra de navegação do topo (ícone + nome revelado
  ao passar o mouse na barra; menu mobile em tela cheia)
- `public/brand/` — logo, selo, "Made with love.", assinatura e listrados em SVG
- `public/gallery/` — fotos das peças (WebP otimizado)

## Pagamento (Pix)

Único meio de pagamento do site. Código estático gerado na hora (via `pix-utils`),
sem depender de nenhuma conta/API externa — não é possível confirmar pagamento
automaticamente, a confirmação é sempre manual pelo admin.

A chave Pix vem da variável de ambiente `PIX_KEY` (veja `.env.example`); se não
estiver configurada, `src/lib/pix.ts` usa a chave da Lívia como padrão. Nome e cidade
do titular ficam fixos em `PIX_MERCHANT_NAME`/`PIX_MERCHANT_CITY`, no mesmo arquivo.

## Onde ficam os pedidos

Pedidos (JSON) e fotos de referência são salvos no **Vercel Blob**, com acesso
`private` (ver `src/lib/orders.ts`). As fotos nunca são expostas por URL direta: o
admin sempre acessa por uma rota autenticada (`/api/admin/files/[...path]`) que só
serve caminhos dentro de `uploads/`. Um e-mail (via Resend, `src/lib/email.ts`) avisa
a Lívia a cada pedido novo — se essa variável (`RESEND_API_KEY`) não estiver
configurada, os e-mails simplesmente não saem (sem erro visível), então confira o
`.env.example` ao configurar um ambiente novo.

## Env vars necessárias

Veja `.env.example`: `ADMIN_PASSWORD`, `ADMIN_NOTIFICATION_EMAIL`, `RESEND_API_KEY`,
`BLOB_READ_WRITE_TOKEN` (gerada automaticamente ao conectar um Blob Store na Vercel) e,
opcionalmente, `PIX_KEY`.

## Próximos passos sugeridos

- Se quiser trocar "The Seasons"/Cormorant Garamond por outra fonte licenciada no
  futuro, é só trocar o import em `src/app/layout.tsx`
