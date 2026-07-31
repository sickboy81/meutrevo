# SEO do Meu Trevo

## Estrutura indexável

- páginas de modalidade para as 11 loterias suportadas
- páginas de concursos no formato `/megasena/concurso-3038`
- sitemap dinâmico em `/sitemap.xml`, com datas reais dos sorteios
- páginas privadas (`/app`, `/login` e recuperação de senha) com `noindex`
- imagens Open Graph em `/og/{modalidade}` no formato 1200 x 630

## Google Search Console

O projeto aceita a variável abaixo para gerar a meta tag de verificação:

```text
GOOGLE_SITE_VERIFICATION=token_fornecido_pelo_google
```

Cadastre a variável nos ambientes Production, Preview e Development da Vercel
e faça um novo deploy. Depois, valide a propriedade de domínio ou prefixo de URL
no Search Console e envie `https://www.meutrevo.com/sitemap.xml`.

## Verificação local

```bash
npm run build
npm run test:e2e
```

Após o deploy, confira:

- status 200 das páginas de modalidade e concurso
- apenas um `h1` por página pública
- canonical absoluto e descrição exclusiva
- imagem Open Graph com 1200 x 630
- ausência de páginas privadas no sitemap
