# Sistema Alvéa Odontologia

Sistema interno da clínica Alvéa Odontologia: agenda, pacientes, orçamentos e financeiro,
com histórico de todas as alterações (quem fez, quando, o que mudou).

Feito em Next.js + Prisma + PostgreSQL (Neon). Visual igual ao site da clínica.

## Rodar no computador

1. `npm install`
2. Crie o `.env` com `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET` (32+ caracteres),
   `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD`.
3. `npx prisma migrate deploy` (cria as tabelas)
4. `npx prisma db seed` (cria o usuário do dentista)
5. `npm run dev` e abra http://localhost:3000

## Perfis

Dentista e Recepção têm acesso total. Toda gravação deixa uma linha no Histórico.
