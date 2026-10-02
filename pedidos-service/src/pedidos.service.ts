import { AppError } from "./AppError.js";
import { buscarProduto } from "./catalogo.client.js";

export type Pedido = {
  produtoId: number;
  quantidade: number;
  total: number;
  status: "criado";
};

// Mapeia o contrato remoto para o que a regra de Pedidos realmente usa
function resumoProduto(produto: Awaited<ReturnType<typeof buscarProduto>>) {
  return {
    produtoId: produto.id,
    nomeProduto: produto.nome,
    precoUnitario: produto.preco,
    estoqueDisponivel: produto.estoque,
  };
}

export async function criarPedido(produtoId: number, quantidade: number): Promise<Pedido> {
  const produto = resumoProduto(await buscarProduto(produtoId));

  if (produto.estoqueDisponivel < quantidade) {
    throw new AppError("Estoque insuficiente", 409);
  }

  return {
    produtoId: produto.produtoId,
    quantidade,
    total: produto.precoUnitario * quantidade,
    status: "criado",
  };
}
