export type Produto = {
  id: number;
  nome: string;
  preco: number;
  estoque: number;
};

// Dados pertencem ao Catálogo: nenhum outro serviço acessa este array diretamente.
export const produtos: Produto[] = [
  { id: 1, nome: "Teclado", preco: 150, estoque: 4 },
  { id: 2, nome: "Mouse", preco: 65, estoque: 10 },
  { id: 3, nome: "Monitor", preco: 900, estoque: 2 },
];
