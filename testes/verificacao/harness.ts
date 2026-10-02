import http from "node:http";
import { produtos } from "./produtos.ts";
import { criarPedido } from "./pedidos.service.ts";
import { buscarProduto } from "./catalogo.client.ts";

let lento = false;
const srv = http.createServer((req, res) => {
  const m = req.url?.match(/^\/produtos\/(\d+)$/);
  const responder = () => {
    const p = m && produtos.find((x) => x.id === Number(m[1]));
    res.setHeader("Content-Type", "application/json");
    if (!p) { res.statusCode = 404; return res.end(JSON.stringify({ mensagem: "Produto não encontrado" })); }
    res.end(JSON.stringify(p));
  };
  lento ? setTimeout(responder, 5000) : responder();
});
const ouvir = () => new Promise<void>((r) => srv.listen(3001, r));
const parar = () => new Promise<void>((r) => { srv.closeAllConnections(); srv.close(() => r()); });

async function rodar(nome: string, fn: () => Promise<unknown>) {
  try { console.log(`${nome}\n   -> sucesso`, JSON.stringify(await fn())); }
  catch (e: any) { console.log(`${nome}\n   -> HTTP ${e.status ?? "?"}`, JSON.stringify({ mensagem: e.mensagem ?? e.message })); }
}

await ouvir();
await rodar("1. buscarProduto(1)  [GET /produtos/1]", () => buscarProduto(1));
await rodar("2. buscarProduto(999)  [GET /produtos/999]", () => buscarProduto(999));
await rodar("3. criarPedido(1, 2)", () => criarPedido(1, 2));
await rodar("4. criarPedido(1, 99)", () => criarPedido(1, 99));
await rodar("5. criarPedido(999, 1)", () => criarPedido(999, 1));
lento = true;
await rodar("7. criarPedido(1, 1) com Catálogo lento (5s) e timeout 2s", () => criarPedido(1, 1));
lento = false;
await parar();
await rodar("6. criarPedido(1, 1) com Catálogo parado", () => criarPedido(1, 1));
