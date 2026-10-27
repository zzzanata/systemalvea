# Painel de obras, financeiro e notas fiscais

Novo painel (3 painéis), módulo de obras com checklist e equipe, faturamento x custos,
notas fiscais, menu responsivo. Não precisa instalar nenhuma biblioteca nova.

## 1. Copiar os arquivos

Copie para dentro da pasta `estoque`, aceitando substituir:

- `app/`, `components/`, `lib/`
- `prisma/schema.prisma` (substitui o atual; os modelos antigos continuam iguais)
- `prisma/seed-demo.ts` (novo)

## 2. Atualizar o banco (ANTES de publicar)

```bash
npx prisma migrate dev --name obras_financeiro
npx prisma generate
```

A migração só cria tabelas novas, não mexe nos dados atuais. Como o banco é o mesmo do site
no ar, rode isto antes do `git push`.

## 3. (Opcional) Dados de exemplo

```bash
npx tsx prisma/seed-demo.ts            # cria 4 obras, lançamentos e notas de exemplo
npx tsx prisma/seed-demo.ts --remove   # apaga só os dados de exemplo
```

## 4. Rodar

```bash
npm run dev
```

## Quem vê o quê

- Administrador: tudo (painel completo, obras, faturamento, notas fiscais, usuários, estoque).
- Operador: painel de obras, obras (atualiza o andamento das tarefas) e estoque.
  Faturamento e notas fiscais ficam ocultos.

## Telas novas

- `/` painel: evolução das obras, faturamento x custos, notas fiscais e resumo do estoque
- `/obras`, `/obras/new`, `/obras/[id]` lista, cadastro e checklist/equipe de cada obra
- `/financeiro` lançamentos de faturamento e custos
- `/notas-fiscais` notas a emitir e emitidas

## Publicar

```bash
git add .
git commit -m "Painel de obras, financeiro e notas fiscais"
git push
```
