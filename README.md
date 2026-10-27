# Estoque Web: login e perfis

Acrescenta login (e-mail e senha), perfis Administrador/Operador e cadastro de usuários.

## 1. Instalar as duas bibliotecas novas

```bash
npm install bcryptjs jose
```

## 2. Copiar os arquivos

Copie para dentro da pasta `estoque`, aceitando substituir:

- `proxy.ts`  (novo, na raiz, ao lado do `package.json`)
- `app/`, `components/`, `lib/`
- `prisma/seed.ts`

## 3. Acrescentar ao `.env`

```
SESSION_SECRET="cole-aqui-uma-chave-longa"
ADMIN_EMAIL="seu@email.com"
ADMIN_PASSWORD="uma-senha-forte-com-8-ou-mais-caracteres"
ADMIN_NAME="Seu Nome"
```

Gere a `SESSION_SECRET` no terminal:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 4. Criar a senha do admin e rodar

```bash
npx prisma db seed
npm run dev
```

Entre em http://localhost:3000 com o e-mail e a senha do `.env`.

## Perfis

- **Administrador:** tudo, inclusive cadastrar produtos e usuários (menu "Usuários").
- **Operador:** vê o painel e os produtos e lança movimentações.

## Observações

- Esqueceu a senha do admin? Mude `ADMIN_PASSWORD` no `.env` e rode `npx prisma db seed` de novo.
- Depois de rodar o seed, pode apagar `ADMIN_PASSWORD` do `.env`: só o seed usa.
- Na Vercel, adicione `SESSION_SECRET` (a mesma ou outra chave) junto com o `DATABASE_URL`.
  `ADMIN_*` não são necessárias lá.
- A sessão dura 7 dias. Trocar a `SESSION_SECRET` desconecta todo mundo.
