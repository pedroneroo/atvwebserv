# Web Services – Aula 07: Pedidos + Catálogo (microsserviços)

Dois serviços independentes (Node.js + Express + TypeScript) que se comunicam por HTTP.

| Serviço | Porta | Responsabilidade |
|---|---|---|
| `catalogo-service` | 3001 | Dono dos dados dos produtos |
| `pedidos-service` | 3000 | Cria pedidos; consulta o Catálogo via `fetch` |

## Requisitos
- Node.js 20 ou superior

## Como executar
Abra **dois terminais**.

**Terminal 1 – Catálogo**
```bash
cd catalogo-service
npm install
cp .env.example .env
npm run dev
```

**Terminal 2 – Pedidos**
```bash
cd pedidos-service
npm install
cp .env.example .env
npm run dev
```

(Alternativa: `npm run build && npm start` em cada pasta.)

## Configuração (variáveis de ambiente)
| Variável | Serviço | Padrão | Descrição |
|---|---|---|---|
| `PORT` | ambos | 3001 / 3000 | Porta do serviço |
| `CATALOGO_URL` | pedidos | `http://localhost:3001` | URL do Catálogo |
| `CATALOGO_TIMEOUT_MS` | pedidos | `2000` | Timeout da chamada ao Catálogo |

## Contrato entre os serviços
**Catálogo – `GET /produtos/:id`**
- `200` → `{ "id": 1, "nome": "Teclado", "preco": 150, "estoque": 4 }`
- `404` → `{ "mensagem": "Produto não encontrado" }`

**Pedidos – `POST /pedidos`** body `{ "produtoId": 1, "quantidade": 2 }`
- `201` → `{ "produtoId": 1, "quantidade": 2, "total": 300, "status": "criado" }`
- `400` → dados inválidos
- `404` → `Produto inexistente`
- `409` → `Estoque insuficiente`
- `502` → `Catálogo temporariamente indisponível` (serviço parado / falha da dependência)
- `504` → `Tempo limite excedido ao consultar o Catálogo`

## Decisões de projeto
- Cada serviço tem seu próprio `package.json`, dependências, porta e ponto de entrada; um não importa código do outro.
- Todo o código HTTP de Pedidos → Catálogo fica em `catalogo.client.ts` (URL, `fetch`, timeout e tradução de erros).
- `fetch` usa `AbortSignal.timeout`, então Pedidos nunca espera indefinidamente.
- A resposta do Catálogo é interpretada pelo status **antes** de ler o JSON e é validada em tempo de execução.
- Erros de domínio (404, 409) são diferenciados de erros de dependência (502, 504).
- Pedidos não acessa os dados internos do Catálogo; só o contrato HTTP.

## Testes (Thunder Client / REST Client)
O arquivo `testes/requests.http` contém todas as requisições. Ordem recomendada: testar cada serviço isolado e depois a integração.

| # | Teste | Requisição | Esperado |
|---|---|---|---|
| 1 | Produto válido | `GET :3001/produtos/1` | 200 + produto |
| 2 | Produto inexistente | `GET :3001/produtos/999` | 404 |
| 3 | Criar pedido | `POST :3000/pedidos` `{produtoId:1, quantidade:2}` | 201 + total 300 |
| 4 | Sem estoque | `POST :3000/pedidos` `{produtoId:1, quantidade:99}` | 409 |
| 5 | Produto inexistente | `POST :3000/pedidos` `{produtoId:999, quantidade:1}` | 404 |
| 6 | Catálogo parado | parar o Catálogo e repetir o teste 3 | 502 (ou 504) |

### Evidências

**Resultado da execução** (data: 02/10/2026). Executei o código real de `catalogo.client.ts` e `pedidos.service.ts` (Node 22, `fetch` real pela rede local) contra um servidor HTTP na porta 3001 que segue o contrato do Catálogo e usa os mesmos dados de `produtos.ts`. O script está em `testes/verificacao/harness.ts` e a saída bruta em `testes/verificacao/saida.txt`.

| # | Teste | Status | Resposta |
|---|---|---|---|
| 1 | Produto válido | 200 | `{"id":1,"nome":"Teclado","preco":150,"estoque":4}` |
| 2 | Produto inexistente | 404 | `{"mensagem":"Produto inexistente"}` |
| 3 | Criar pedido (1, qtd 2) | 201 | `{"produtoId":1,"quantidade":2,"total":300,"status":"criado"}` |
| 4 | Sem estoque (qtd 99) | 409 | `{"mensagem":"Estoque insuficiente"}` |
| 5 | Pedido com produto 999 | 404 | `{"mensagem":"Produto inexistente"}` |
| 6 | Catálogo parado | 502 | `{"mensagem":"Catálogo temporariamente indisponível"}` |
| 7 | Catálogo lento (5 s) com timeout de 2 s | 504 | `{"mensagem":"Tempo limite excedido ao consultar o Catálogo"}` |

> Observação: nesta verificação, o status HTTP é o `status` do `AppError`, que o `server.ts` de Pedidos devolve ao cliente no tratamento centralizado de erros. A camada Express (rotas e JSON) não foi exercitada, pois o `npm install` não estava disponível no ambiente de teste. Os testes no Thunder Client com os dois serviços rodando ainda precisam ser feitos.

**Prints do Thunder Client** (a adicionar em `evidencias/`):
`01-catalogo-200.png`, `02-catalogo-404.png`, `03-pedido-201.png`, `04-pedido-409.png`, `05-pedido-404.png`, `06-catalogo-parado-502.png`

## Estrutura
```
web-services-aula07/
├── catalogo-service/   (src/server.ts, src/produtos.ts, package.json, .env.example)
├── pedidos-service/    (src/server.ts, src/pedidos.service.ts, src/catalogo.client.ts, src/AppError.ts, package.json, .env.example)
├── testes/requests.http
└── README.md
```
