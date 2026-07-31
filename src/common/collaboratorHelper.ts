import { Collaborator } from "src/types/collaborator";
import { PrismaService } from "./prisma.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class CollaboratorHelper {
  constructor (
    private prisma: PrismaService
  ) {}

  async findCollaboratorByEmail (email: string): Promise<Collaborator | null> {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        email,
      }
    }) as Collaborator;

    return collaborator || null;
  }

  async findCollaboratorByCpf (cpf: string): Promise<Collaborator | null> {
    const collaborator = await this.prisma.collaborator.findUnique({
      where: {
        cpf,
      }
    }) as Collaborator;

    return collaborator || null;
  }
}