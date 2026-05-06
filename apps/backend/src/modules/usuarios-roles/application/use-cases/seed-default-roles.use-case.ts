import type { RoleRepository } from "../../domain/ports/role-repository.port.js";

/**
 * Idempotent seed of the two default roles: "Admin" and "Usuario básico".
 * Runs on application startup. Safe to re-execute on every boot because
 * existence is checked before creation.
 */
export class SeedDefaultRolesUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async execute(): Promise<void> {
    const defaults: Array<{ nombre: string; descripcion: string }> = [
      {
        nombre: "Admin",
        descripcion: "Acceso total al sistema. Gestiona usuarios y roles."
      },
      {
        nombre: "Usuario básico",
        descripcion: "Perfil por defecto para usuarios del sistema."
      }
    ];

    for (const role of defaults) {
      const existing = await this.roles.findByNombre(role.nombre);
      if (!existing) {
        await this.roles.create(role);
      }
    }
  }
}
