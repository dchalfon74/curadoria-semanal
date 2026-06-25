# Curadoria Semanal

App de curadoria de conteúdo semanal para VC, Tech e Healthtech. Coleta itens ao longo da semana e compila um digest formatado para WhatsApp.

## Deploy no Vercel

### 1. Suba o projeto para o GitHub

```bash
git init
git add .
git commit -m "initial commit"
gh repo create curadoria-semanal --public --push
```

### 2. Importe no Vercel

1. Acesse [vercel.com](https://vercel.com) → "Add New Project"
2. Selecione o repositório `curadoria-semanal`
3. Clique em **Deploy** (Vite é detectado automaticamente)

### 3. Configure a variável de ambiente

1. No dashboard do projeto: **Settings → Environment Variables**
2. Adicione:
   - **Name:** `VITE_ANTHROPIC_API_KEY`
   - **Value:** sua chave da Anthropic (console.anthropic.com)
   - **Environment:** Production, Preview, Development
3. Clique em **Save**
4. Vá em **Deployments → Redeploy** para aplicar

### Desenvolvimento local

```bash
cp .env.example .env.local
# Edite .env.local com sua chave

npm install
npm run dev
```

## Funcionalidades

- **Coleta persistente** — itens salvos no localStorage do navegador
- **4 tipos de fonte** — Web, Podcast, Newsletter, Post
- **3 tons de digest** — Executivo, Conversacional, Técnico
- **Geração com IA** — Claude Sonnet via Anthropic API
- **Formato WhatsApp** — pronto para copiar e distribuir
- **Mobile-first** — otimizado para uso no celular
