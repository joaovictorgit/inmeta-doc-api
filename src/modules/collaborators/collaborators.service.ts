import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { CreateCollaboratorDto } from "./dto/create-collaborator.dto";
import { Result } from "src/utils";
import { Collaborator } from "src/types/collaborator";
import { CollaboratorHelper } from "src/common/collaboratorHelper";
import { UpdateCollaboratorDto } from "./dto/update-collaborator.dto";
import { ParamsCollaborator } from "./dto/params-collaborator.dto";
import { PaginatedResult } from "src/types/pagineted-result";


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
        deletedAt: null,
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

  async findAll(params: ParamsCollaborator): Promise<Result<PaginatedResult<Collaborator>, Error>> {
    const currentPage = parseInt(params.page) || 1;
    const currentLimit = parseInt(params.limit) || 10;

    if (
      Number.isNaN(currentPage) ||
      Number.isNaN(currentLimit) ||
      currentPage < 1 ||
      currentLimit < 1
    ) {
      return new Result(null as any, new Error("Página ou limite inválidos."));
    }

    const where = { deletedAt: null };
    const [collaborators, total] = await Promise.all([
      this.prisma.collaborator.findMany({
        where,
        skip: (currentPage - 1) * currentLimit,
        take: currentLimit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.collaborator.count({ where }),
    ]);

    return new Result({
      data: collaborators,
      meta: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
      },
    }, null as any);
  }

  async findById(id: string): Promise<Result<Collaborator | null, Error>> {
    if (!id?.trim()) {
      return new Result(null as any, new Error("Id não informado!"));
    }

    const currentCollaborator = await this.prisma.collaborator.findFirst({
      where: {
        id,
        deletedAt: null,
      }
    }) as Collaborator | null;

    return new Result(currentCollaborator, null as any);
  }

  async updateById(id: string, data: UpdateCollaboratorDto): Promise<Result<boolean, Error>> {
    if (!id?.trim()) {
      return new Result(null as any, new Error("Id não informado!"));
    }

    const currentCollaborator = await this.findById(id);

    if (!currentCollaborator.value) {
      return new Result(null as any, new Error("Colaborador não encontrado"));
    }

    const collaboratorByEmail = await this.collaboratorHelper.findCollaboratorByEmail(data.email);
    const collaboratorByCpf = await this.collaboratorHelper.findCollaboratorByCpf(data.cpf);

    if (collaboratorByEmail && collaboratorByEmail.id !== currentCollaborator.value.id) {
      return new Result(null as any, new Error("Já existe um colaborador com esse e-mail!"));
    }

    if (collaboratorByCpf && collaboratorByCpf.id !== currentCollaborator.value.id) {
      return new Result(null as any, new Error("Já existe um colaborador com esse cpf!"));
    }

    await this.prisma.collaborator.update({
      where: { id: currentCollaborator.value.id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });

    return new Result(true, null as any);
  }

  async deleteById(id: string): Promise<Result<boolean, Error>> {
    if (!id?.trim()) {
      return new Result(null as any, new Error("Id não informado!"));
    }

    const currentCollaborator = await this.findById(id);

    if (!currentCollaborator.value) {
      return new Result(null as any, new Error("Colaborador não encontrado"));
    }

    await this.prisma.collaborator.update({
      where: { id: currentCollaborator.value.id },
      data: {
        deletedAt: new Date(),
      }
    });

    return new Result(true, null as any);
  }
}