import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { Result } from "src/utils";
import { CollaboratorsService } from "../collaborators/collaborators.service";
import { DocumentTypeService } from "../documentType/documentType.service";
import { CreateRequirementDto } from "./dto/create-requirement.dto";
import { CreateBatchRequirementsDto } from "./dto/create-batchRequirements.dto";
import { DeleteRequirementDto } from "./dto/delete-requirement.dto";

@Injectable()
export class CollaboratorRequirementsService {
  constructor (
    private prisma: PrismaService,
    private collaboratorService: CollaboratorsService,
    private documentTypeService: DocumentTypeService,
  ) {}

  async assign(data: CreateRequirementDto): Promise<Result<string, Error>> {
    const [collaborator, documentType] = await Promise.all([
      this.collaboratorService.findById(data.collaboratorId),
      this.documentTypeService.findById(data.documentTypeId),
    ]);

    if (!collaborator.value) {
      return new Result(null as any, new Error("Colaborador não encontrado!"));
    }

    if (!documentType.value) {
      return new Result(null as any, new Error("Tipo de documento não encontrado!"));
    }

    const existingRequirement = await this.prisma.collaboratorDocumentRequirement.findFirst({
      where: {
        collaboratorId: data.collaboratorId,
        documentTypeId: data.documentTypeId,
      },
    });

    if (existingRequirement) {
      if (!existingRequirement.deletedAt) {
        return new Result(null as any, new Error("Este tipo de documento já está vinculado ao colaborador!"));
      }

      const result = await this.prisma.collaboratorDocumentRequirement.update({
        where: { id: existingRequirement.id },
        data: { deletedAt: null },
        select: {
          id: true,
        }
      });

      return new Result(result.id, null as any);
    }

    const result = await this.prisma.collaboratorDocumentRequirement.create({
      data: {
        collaboratorId: collaborator.value.id,
        documentTypeId: documentType.value.id,
        createdAt: new Date(),
        deletedAt: null,
      },
      select: {
        id: true,
      }
    });

    return new Result(result.id, null as any);
  }

  async assignBatch(data: CreateBatchRequirementsDto): Promise<Result<boolean, Error>> {
    const collaboratorId = data.collaboratorId;
    for (const documentTypeId of data.documentTypeIds) {
      await this.assign({ collaboratorId, documentTypeId });
    }

    return new Result(true, null as any);
  }

  async findByCollaborator(collaboratorId: string) {
    const collaborator = await this.collaboratorService.findById(collaboratorId);

    if (!collaborator.value) {
      return new Result(null as any, new Error("Colaborador não encontrado!"));
    }

    const requirements = await this.prisma.collaboratorDocumentRequirement.findMany({
      where: {
        collaboratorId,
        deletedAt: null,
        documentType: {
          deletedAt: null,
        },
      },
      include: {
        documentType: true,
      },
    });

    return new Result(requirements, null as any);
  }

  async remove(data: DeleteRequirementDto): Promise<Result<boolean, Error>> {
    const requirement = await this.prisma.collaboratorDocumentRequirement.findFirst({
      where: {
        collaboratorId: data.collaboratorId,
        documentTypeId: data.documentTypeId,
        deletedAt: null,
      },
    });

    if (!requirement) {
      return new Result(null as any, new Error("Vínculo de documento não encontrado!"));
    }

    await this.prisma.collaboratorDocumentRequirement.update({
      where: { id: requirement.id },
      data: { deletedAt: new Date() },
    });

    return new Result(true, null as any);
  }
}