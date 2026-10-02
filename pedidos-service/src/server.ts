import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import { AppError } from "./AppError.js";
import { criarPedido } from "./pedidos.service.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

// POST /pedidos  body: { "produtoId": number, "quantidade": number }
app.post("/pedidos", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { produtoId, quantidade } = req.body ?? {};

    if (!Number.isInteger(produtoId) || produtoId <= 0 || !Number.isInteger(quantidade) || quantidade <= 0) {
      throw new AppError("produtoId e quantidade devem ser inteiros positivos", 400);
    }

    const pedido = await criarPedido(produtoId, quantidade);
    return res.status(201).json(pedido);
  } catch (error) {
    return next(error);
  }
});

// Tratamento centralizado de erros
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ mensagem: error.mensagem });
  }
  if (error instanceof SyntaxError) {
    return res.status(400).json({ mensagem: "JSON inválido" });
  }
  console.error(error);
  return res.status(500).json({ mensagem: "Erro interno do servidor" });
});

app.listen(PORT, () => {
  console.log(`Pedidos rodando em http://localhost:${PORT}`);
});
