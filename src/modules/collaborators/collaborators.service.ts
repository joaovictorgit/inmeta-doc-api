import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateCollaboratorDto } from "./dto/create-collaborator.dto";
import { Result } from "src/utils";
import { Collaborator } from "src/types/collaborator";
import { CollaboratorHelper } from "src/common/collaboratorHelper";


@Injectable()
export class CollaboratorsService {
  constructor(
    private prisma: PrismaService,
    private collaboratorHelper: CollaboratorHelper
  ) {}

  async create(data: CreateCollaboratorDto): Promise<Result<Collaborator, Error>> {
    const collaboratorByEmail = await this.collaboratorHelper.findCollaboratorByEmail(data.email);
    const collaboratorByCpf = await this.collaboratorHelper.findCollaboratorByCpf(data.cpf);

    if (collaboratorByEmail) {
      return new Result(null as any, new Error("Já existe um colaborador com esse e-mail!"));
    }

    if (collaboratorByCpf) {
      return new Result(null as any, new Error("Já existe um colaborador com esse cpf!"));
    }

    const newCollaborator = await this.prisma.collaborator.create({
      data: {
        name: data.name,
        email: data.email,
        cpf: data.cpf,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        cpf: true,
        createdAt: true,
        updatedAt: true,
      }
    }) as Collaborator;

    return new Result(newCollaborator, null as any);
  }
}