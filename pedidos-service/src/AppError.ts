export class AppError extends Error {
  constructor(
    public readonly mensagem: string,
    public readonly status: number,
  ) {
    super(mensagem);
    this.name = "AppError";
  }
}
