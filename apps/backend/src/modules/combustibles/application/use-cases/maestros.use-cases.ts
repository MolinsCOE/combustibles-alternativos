/**
 * Use cases for maestros (materiales, proveedores, asignaciones).
 * Grouped in a single file because they are trivially thin.
 */

import type { Asignacion, Destino, Material, Proveedor } from "../../domain/entities/combustibles.js";
import type {
  CombustiblesAsignacionesRepository,
  CombustiblesDestinosRepository,
  CombustiblesMaterialesRepository,
  CombustiblesProveedoresRepository,
  CreateAsignacionInput,
  CreateDestinoInput,
  CreateMaterialInput,
  CreateProveedorInput,
  UpdateProveedorInput,
} from "../../domain/ports/combustibles-repo.port.js";
import { NotFoundError } from "../../../../shared/errors/domain-error.js";

export class AddDestinoUseCase {
  constructor(private readonly destinos: CombustiblesDestinosRepository) {}
  async execute(input: CreateDestinoInput): Promise<Destino> {
    return this.destinos.create(input);
  }
}

export class ToggleDestinoUseCase {
  constructor(private readonly destinos: CombustiblesDestinosRepository) {}
  async execute(id: number): Promise<Destino> {
    const result = await this.destinos.toggle(id);
    if (!result) throw new NotFoundError(`Destino ${id} no encontrado`);
    return result;
  }
}

export class AddMaterialUseCase {
  constructor(private readonly materiales: CombustiblesMaterialesRepository) {}
  async execute(input: CreateMaterialInput): Promise<Material> {
    return this.materiales.create(input);
  }
}

export class ToggleMaterialUseCase {
  constructor(private readonly materiales: CombustiblesMaterialesRepository) {}
  async execute(id: number): Promise<Material> {
    const result = await this.materiales.toggle(id);
    if (!result) throw new NotFoundError(`No existe el material con id ${id}`);
    return result;
  }
}

export class AddProveedorUseCase {
  constructor(private readonly proveedores: CombustiblesProveedoresRepository) {}
  async execute(input: CreateProveedorInput): Promise<Proveedor> {
    return this.proveedores.create(input);
  }
}

export class UpdateProveedorUseCase {
  constructor(private readonly proveedores: CombustiblesProveedoresRepository) {}
  async execute(id: number, input: UpdateProveedorInput): Promise<Proveedor> {
    const result = await this.proveedores.update(id, input);
    if (!result) throw new NotFoundError(`No existe el proveedor con id ${id}`);
    return result;
  }
}

export class ToggleProveedorUseCase {
  constructor(private readonly proveedores: CombustiblesProveedoresRepository) {}
  async execute(id: number): Promise<Proveedor> {
    const result = await this.proveedores.toggle(id);
    if (!result) throw new NotFoundError(`No existe el proveedor con id ${id}`);
    return result;
  }
}

export class AddAsignacionUseCase {
  constructor(private readonly asignaciones: CombustiblesAsignacionesRepository) {}
  async execute(input: CreateAsignacionInput): Promise<Asignacion> {
    return this.asignaciones.create(input);
  }
}

export class DeleteAsignacionUseCase {
  constructor(private readonly asignaciones: CombustiblesAsignacionesRepository) {}
  async execute(id: number): Promise<void> {
    return this.asignaciones.delete(id);
  }
}
