import { AppError } from "./AppError.js";

// Contrato esperado do Catálogo (TypeScript descreve, não valida em tempo de execução)
export type ProdutoRemoto = {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
};

const CATALOGO_URL = process.env.CATALOGO_URL ?? "http://localhost:3001";
const TIMEOUT_MS = Number(process.env.CATALOGO_TIMEOUT_MS ?? 2000);

function ehProdutoValido(dado: unknown): dado is ProdutoRemoto {
  const p = dado as Partial<ProdutoRemoto> | null;
  return (
    !!p &&
    typeof p.id === "number" &&
    typeof p.nome === "string" &&
    typeof p.preco === "number" &&
    typeof p.estoque === "number"
  );
}

// Único lugar do Pedidos que conhece a URL do Catálogo e faz HTTP.
export async function buscarProduto(id: number): Promise<ProdutoRemoto> {
  const url = `${CATALOGO_URL}/produtos/${id}`;

  let resposta: Response;
  try {
    resposta = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    // Timeout -> 504; qualquer outra falha de rede (serviço parado etc.) -> 502
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new AppError("Tempo limite excedido ao consultar o Catálogo", 504);
    }
    throw new AppError("Catálogo temporariamente indisponível", 502);
  }

  // 1) Erro de domínio conhecido
  if (resposta.status === 404) {
    throw new AppError("Produto inexistente", 404);
  }

  // 2) Qualquer outra falha da dependência
  if (!resposta.ok) {
    throw new AppError("Falha ao consultar o Catálogo", 502);
  }

  // 3) Só então lemos o JSON (e validamos o formato)
  let corpo: unknown;
  try {
    corpo = await resposta.json();
  } catch {
    throw new AppError("Resposta inválida do Catálogo", 502);
  }

  if (!ehProdutoValido(corpo)) {
    throw new AppError("Resposta inválida do Catálogo", 502);
  }

  return corpo;
}
