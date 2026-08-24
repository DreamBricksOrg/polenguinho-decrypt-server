# Polenguinho Decrypt Server

Painel de descriptografia de dados: autentica um admin e baixa um CSV com as
retiradas registradas no LogCenter, descriptografando o email no navegador.

## Organização

- `main.py`: entrypoint (`create_app()` + `app.run()`).
- `app/config.py`: variáveis de ambiente lidas pela aplicação.
- `app/decrypt/decrypt_controller.py`: rotas HTTP (`/decrypt`, `/decrypt/data`, `/decrypt/logout`).
- `app/decrypt/log_repository.py`: roda a aggregation sobre a coleção `logs` do Mongo do LogCenter.
- `app/db/mongo.py`: conexão com o MongoDB.
- `app/docs/`: spec OpenAPI e Swagger UI.
- `app/static/js/crypt/`: RSA/AES em JS (geração de chaves e descriptografia no navegador).

## Configuração (`.env`)

Copie `.env.example` para `.env` e preencha:

| Variável               | Descrição                                                                                   |
|-------------------------|-----------------------------------------------------------------------------------------------|
| `MONGO_URI`             | Connection string do Mongo (ex.: SRV do Atlas, com usuário/senha já embutidos na URI).       |
| `MONGO_USER` / `MONGO_PASSWORD` | Deixe **vazio** se as credenciais já estão em `MONGO_URI` (caso do Atlas). Só preencha se a URI não tiver `usuario:senha@`. |
| `MONGO_DB_NAME`         | Banco onde fica a coleção `logs` (ex.: `logcenter_prod`).                                    |
| `DUSER` / `DPASSWORD`   | Login do painel `/decrypt`.                                                                   |
| `SECRET_KEY`            | Chave de sessão do Flask (cookie de login do painel).                                        |
| `LOG_PROJECT_MONGO_ID`  | `_id` (ObjectId) do projeto no LogCenter — filtro `project_id` da aggregation.                |

## Rodando com Docker Compose

1. Copie `.env.example` para `.env` e ajuste os valores (ver tabela acima).
2. Suba: `docker compose up --build`
3. A API fica disponível em `http://localhost:5002`.

O `docker-compose.yml` também sobe um serviço `mongo` local, mas ele só é
usado se `MONGO_URI` continuar apontando para `mongo:27017`. Com uma URI de
Atlas (ou outro Mongo externo) em `MONGO_URI`, esse serviço fica ocioso.

## Rodando localmente (sem Docker)

1. Copie `.env.example` para `.env` e ajuste os valores (ver tabela acima).
   Se `MONGO_URI` for `mongodb://mongo:27017` (padrão do Compose), troque
   para um Mongo acessível localmente (ex.: `mongodb://localhost:27017` com
   `docker run -d -p 27017:27017 mongo`) ou aponte direto para o Atlas.
2. Instale as dependências: `pip install -r requirements.txt`
3. Rode a aplicação: `python main.py`
4. A API fica disponível em `http://localhost:5000`.

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
navegador (`app/static/js/decrypt_page.js`). Registros que não estiverem
criptografados são exibidos como vieram (a descriptografia falha e o valor
original é mantido).

## Documentação da API (Swagger)

Com a aplicação rodando, a documentação interativa (Swagger UI) fica em
`/docs` (`http://localhost:5002/docs` via Docker Compose, ou
`http://localhost:5000/docs` rodando local). O spec OpenAPI cru fica em
`/openapi.json` (`app/docs/openapi_spec.py`).

## Próximos passos

- Adicionar testes automatizados (unitários para domínio/use cases,
  integração para rotas).
- Paginação na listagem de retiradas.
