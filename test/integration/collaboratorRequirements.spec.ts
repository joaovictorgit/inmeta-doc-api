import { Test, TestingModule } from "@nestjs/testing";
import { CollaboratorRequirementsService } from "src/modules/collaboratorRequirements/collaboratorRequirements.service";
import { CollaboratorsService } from "src/modules/collaborators/collaborators.service";
import { DocumentTypeService } from "src/modules/documentType/documentType.service";
import { CollaboratorHelper } from "src/common/collaboratorHelper";
import { DocumentTypeHelper } from "src/common/documentTypeHelper";
import { PrismaService } from "src/common/prisma.service";

describe("CollaboratorRequirementsService (integração)", () => {
  let service: CollaboratorRequirementsService;
  let collaboratorService: CollaboratorsService;
  let prisma: PrismaService;

  let collaboratorId: string;
  let documentTypeId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaboratorRequirementsService,
        CollaboratorsService,
        DocumentTypeService,
        CollaboratorHelper,
        DocumentTypeHelper,
        PrismaService,
      ],
    }).compile();

    service = module.get(CollaboratorRequirementsService);
    collaboratorService = module.get(CollaboratorsService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.collaboratorDocumentRequirement.deleteMany({});
    await prisma.collaborator.deleteMany({});
    await prisma.documentType.deleteMany({});

    const collaborator = await collaboratorService.create({
      name: "Julia Nunes",
      email: "julia@email.com",
      cpf: "66677788899",
    } as any);
    collaboratorId = collaborator.value.id;

    const documentType = await prisma.documentType.create({
      data: { name: "CPF", createdAt: new Date(), deletedAt: null },
    });
    documentTypeId = documentType.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deve criar o vínculo e refletir em findByCollaborator", async () => {
    const assignResult = await service.assign({ collaboratorId, documentTypeId });
    expect(assignResult.isError()).toBe(false);

    const listResult = await service.findByCollaborator(collaboratorId);
    expect(listResult.value).toHaveLength(1);
    expect(listResult.value[0].documentTypeId).toBe(documentTypeId);
  });

  it("não deve permitir vincular o mesmo tipo de documento duas vezes ao mesmo colaborador", async () => {
    await service.assign({ collaboratorId, documentTypeId });

    const secondAssign = await service.assign({ collaboratorId, documentTypeId });
    expect(secondAssign.isError()).toBe(true);

    const total = await prisma.collaboratorDocumentRequirement.count();
    expect(total).toBe(1);
  });

  it("remove (soft delete) e depois assign deve reativar o mesmo registro em vez de duplicar", async () => {
    const created = await service.assign({ collaboratorId, documentTypeId });

    await service.remove({ collaboratorId, documentTypeId });

    const afterRemove = await service.findByCollaborator(collaboratorId);
    expect(afterRemove.value).toHaveLength(0);

    const reassigned = await service.assign({ collaboratorId, documentTypeId });
    expect(reassigned.isError()).toBe(false);
    expect(reassigned.value).toBe(created.value);

    const total = await prisma.collaboratorDocumentRequirement.count();
    expect(total).toBe(1);
  });

  it("findByCollaborator não deve retornar vínculo cujo tipo de documento foi deletado", async () => {
    await service.assign({ collaboratorId, documentTypeId });

    await prisma.documentType.update({
      where: { id: documentTypeId },
      data: { deletedAt: new Date() },
    });

    const result = await service.findByCollaborator(collaboratorId);
    expect(result.value).toHaveLength(0);
  });

  it("assignBatch deve criar vínculos para múltiplos tipos de documento", async () => {
    const secondType = await prisma.documentType.create({
      data: { name: "ASO", createdAt: new Date(), deletedAt: null },
    });

    const result = await service.assignBatch({
      collaboratorId,
      documentTypeIds: [documentTypeId, secondType.id],
    });

    expect(result.isError()).toBe(false);

    const total = await prisma.collaboratorDocumentRequirement.count();
    expect(total).toBe(2);
  });
});