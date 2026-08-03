<p align="center">
  <a href="#" target="blank"><img src="https://img.notionusercontent.com/ext/https%3A%2F%2Fs3-us-west-2.amazonaws.com%2Fpublic.notion-static.com%2Fc2b9fca9-57b8-4da9-8bf4-7cf73adca0a3%2FIcone_isolado_-_verde_1.png/size/w=160?exp=1785195734&sig=cesui1QYFxaFz4fjhKAvbg803NyyZBerId8h-dq1VOE&imgBuildSrc=presignImageUrl&id=294926b5-830d-80dd-804e-007a69909982&table=custom_emoji&mtd=so" width="120" alt="Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <h3 align="center"><strong>API de Gerenciamento de documentação de colaboradores</strong></h3>

## Descrição

Desenvolver uma API RESTful para o gerenciamento do fluxo de documentação de colaboradores. Cada colaborador é vinculado a tipos de documentos específicos que são obrigatórios para envio, e o sistema deve acompanhar quais documentos estão pendentes, enviados e em qual versão se encontram.

## Preparando ambiente

<h3 style="font-size: 18px;">🧬 Clonando repositório</h3>

```bash
git clone https://github.com/joaovictorgit/inmeta-doc-api.git
```

<h3 style="font-size: 18px;">📂 Instalar dependências</h3>

```bash
cd inmeta-doc-api
npm install
```

<h3 style="font-size: 18px">⚙ Crie um arquivo .env e .env.test na raiz da pasta</h3>

```bash
# .env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:PORT/DB_NAME?schema=public"

# .env.local
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:PORT/DB_NAME_TEST?schema=public"
```

<h3 style="font-size: 18px">💻 Criando banco de dados e migração</h3>
<strong>OBS: Tenho o Postgres instalado na sua máquina e pelo terminal rode esse comando para criar o banco de dados para rodar localmente e o banco de dados para testes. Lembre-se que o nome vai ser adicionando no DATABASE_URL</strong>

```bash
# banco de dados em desenvolvimento
PGPASSWORD=sua_senha_postgres createdb -h localhost -U postgres nome_db

# banco de dados de testes
PGPASSWORD=sua_senha_postgres createdb -h localhost -U postgres nome_db_test
```

<h3 style="font-size: 18px">>_ Rodando aplicação</h3>

```bash
npm run start:dev
```

## Rodar os testes

```bash
# testes unitários
npm run test
# testes de integração
npm run test:integration
# testes e2e
npm run test:e2e
```

## Tecnologias
- Node.js
- Npm
- Nestjs
- PostgreSQL
- NoSQL
- Typescript
- Jest
- Swagger

## Author

- GitHub: [joaovictorgit](https://github.com/joaovictorgit)
- LinkedIn: [joaovictordev](https://www.linkedin.com/in/joaovictordev/)