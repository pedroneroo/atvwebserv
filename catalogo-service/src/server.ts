import "dotenv/config";
import express from "express";
import { produtos } from "./produtos.js";

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(express.json());

// Contrato: GET /produtos/:id -> 200 { id, nome, preco, estoque } | 404 { mensagem }
app.get("/produtos/:id", (req, res) => {
  const id = Number(req.params.id);
  const produto = produtos.find((p) => p.id === id);

  if (!produto) {
    return res.status(404).json({ mensagem: "Produto não encontrado" });
  }

  return res.status(200).json(produto);
});

app.listen(PORT, () => {
  console.log(`Catálogo rodando em http://localhost:${PORT}`);
});
