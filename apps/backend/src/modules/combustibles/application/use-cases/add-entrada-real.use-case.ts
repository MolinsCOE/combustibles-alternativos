import type { EntradaReal } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesEntradasRepository,
  CreateEntradaRealInput,
} from "../../domain/ports/combustibles-repo.port.js";

export class AddEntradaRealUseCase {
  constructor(private readonly entradas: CombustiblesEntradasRepository) {}

  async execute(input: CreateEntradaRealInput): Promise<EntradaReal> {
    return this.entradas.create(input);
  }
}
