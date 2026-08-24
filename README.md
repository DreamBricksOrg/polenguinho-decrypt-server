# Polenguinho Decrypt Server

Painel de descriptografia de dados: autentica um admin e baixa um CSV com as
retiradas registradas no LogCenter, descriptografando o email no navegador.

## Organização

- `app/decrypt/decrypt_controller.py`: rotas HTTP (`/decrypt`, `/decrypt/data`, `/decrypt/logout`).
- `app/decrypt/log_repository.py`: roda a aggregation sobre a coleção `logs` do Mongo do LogCenter.
- `app/db/mongo.py`: conexão com o MongoDB.

## Rodando com Docker Compose

1. Copie `.env.example` para `.env` (o valor padrão já aponta para o serviço
   `mongo` do `docker-compose.yml`).
2. Suba tudo: `docker compose up --build`
3. A API fica disponível em `http://localhost:5000`.

## Rodando localmente (sem Docker)

1. Suba um MongoDB local (ex: `docker run -d -p 27017:27017 mongo`).
2. Copie `.env.example` para `.env` e ajuste `MONGO_URI` para
   `mongodb://localhost:27017` (o padrão do arquivo aponta para o serviço
   `mongo` do Docker Compose, que não existe fora dele).
3. Instale as dependências: `pip install -r requirements.txt`
4. Rode a aplicação: `python main.py`

## Painel de descriptografia (`/decrypt`)

Tela autenticada (usuário/senha em `DUSER`/`DPASSWORD`) que permite gerar um
par de chaves RSA e baixar um CSV com as retiradas descriptografadas usando a
chave privada.

`GET /decrypt/data` (requer estar logado em `/decrypt`) roda a aggregation
abaixo sobre a coleção `logs` do banco `MONGO_DB_NAME`, filtrando pelo
`project_id` configurado em `LOG_PROJECT_MONGO_ID`:

```js
[
  { $match: { project_id: ObjectId(LOG_PROJECT_MONGO_ID), message: "retirada_registrada_no_cadastro" } },
  { $project: {
      _id: 0,
      horario: "$timestamp",
      email: "$data.email",
      userId: "$data.id",
      session: "$data.session_id",
      recall: { $ifNull: ["$data.recalled", false] },
  } },
  { $sort: { horario: 1 } },
]
```

Só o campo `email` fica criptografado; a descriptografia acontece no
navegador (`app/static/js/decrypt_page.js`).

## Documentação da API (Swagger)

Com a aplicação rodando, a documentação interativa (Swagger UI) fica em
`http://localhost:5000/docs` (ou `:5002` se estiver usando a porta do
`docker-compose.yml`). O spec OpenAPI cru fica em `/openapi.json`
(`app/docs/openapi_spec.py`).

## Próximos passos

- Adicionar testes automatizados (unitários para domínio/use cases,
  integração para rotas).
- Paginação na listagem de retiradas.
