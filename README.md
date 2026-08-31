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
- `src/lib/pricing.ts` — tamanhos e preços (A5 R$150 / A4 R$180). Mude aqui se os
  valores da tabela mudarem.
- `src/components/ui/sidebar.tsx` — barra de navegação do topo (ícone + nome revelado
  ao passar o mouse na barra; menu mobile em tela cheia)
- `public/brand/` — logo, selo, "Made with love.", assinatura e listrados em SVG
- `public/gallery/` — fotos das peças (WebP otimizado)

## Pagamento (Pix)

Único meio de pagamento do site. Código estático gerado na hora (via `pix-utils`),
com a chave Pix do ateliê configurada em `src/lib/pix.ts` (hoje: chave celular da
Lívia) — não depende de nenhuma conta/API externa.

Pra trocar a chave Pix no futuro, edite `PIX_KEY`, `PIX_MERCHANT_NAME` e
`PIX_MERCHANT_CITY` em `src/lib/pix.ts`.

## Onde ficam os pedidos

Por enquanto, pedidos e fotos de referência são salvos localmente em `data/orders/` e
`data/uploads/` (fora do Git). **Isso funciona rodando em um servidor próprio ou VPS,
mas não em hospedagens serverless como Vercel**, onde o disco é temporário — antes de
publicar em produção, trocar esse armazenamento por um serviço externo (ex: Vercel
Blob para as fotos + um banco de dados) e configurar notificação por e-mail para você
saber quando chega um pedido novo.

## Próximos passos sugeridos

- Se quiser trocar "The Seasons"/Cormorant Garamond por outra fonte licenciada no
  futuro, é só trocar o import em `src/app/layout.tsx`
