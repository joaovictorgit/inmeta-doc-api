import { Test, TestingModule } from "@nestjs/testing";
import { DocumentService } from "src/modules/document/document.service";
import { CollaboratorsService } from "src/modules/collaborators/collaborators.service";
import { CollaboratorHelper } from "src/common/collaboratorHelper";
import { PrismaService } from "src/common/prisma.service";
import { DocumentStatus } from "src/utils/enums/document-status.enum";

describe("DocumentService (integração)", () => {
  let service: DocumentService;
  let collaboratorService: CollaboratorsService;
  let prisma: PrismaService;

  let collaboratorId: string;
  let documentTypeId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentService, CollaboratorsService, CollaboratorHelper, PrismaService],
    }).compile();

    service = module.get(DocumentService);
    collaboratorService = module.get(CollaboratorsService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.document.deleteMany({});
    await prisma.collaboratorDocumentRequirement.deleteMany({});
    await prisma.collaborator.deleteMany({});
    await prisma.documentType.deleteMany({});

    const collaborator = await collaboratorService.create({
      name: "Larissa Prado",
      email: "larissa@email.com",
      cpf: "88899900011",
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

  it("primeiro envio cria versão 1 marcada como isLatest", async () => {
    const result = await service.submitDocument({
      collaboratorId,
      documentTypeId,
      fileUrl: "http://file.com/v1.pdf",
    });

    expect(result.isError()).toBe(false);
    expect(result.value.version).toBe(1);
    expect(result.value.isLatest).toBe(true);
  });

  it("reenvio incrementa a versão e mantém apenas uma isLatest true, preservando histórico", async () => {
    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" });
    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v2.pdf" });
    const third = await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v3.pdf" });

    expect(third.value.version).toBe(3);

    const all = await prisma.document.findMany({
      where: { collaboratorId, documentTypeId },
      orderBy: { version: "asc" },
    });

    expect(all).toHaveLength(3);
    expect(all.filter((d) => d.isLatest)).toHaveLength(1);
    expect(all.find((d) => d.isLatest)?.version).toBe(3);
  });

  it("findHistory retorna todas as versões em ordem decrescente", async () => {
    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" });
    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v2.pdf" });

    const history = await service.findHistory(collaboratorId, documentTypeId);

    expect(history.value.map((d: any) => d.version)).toEqual([2, 1]);
  });

  it("delete da versão vigente promove a versão anterior a isLatest", async () => {
    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" });
    const v2 = await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v2.pdf" });

    await service.delete(v2.value.id);

    const v1 = await prisma.document.findFirst({ where: { collaboratorId, documentTypeId, version: 1 } });
    expect(v1?.isLatest).toBe(true);

    const deletedV2 = await prisma.document.findUnique({ where: { id: v2.value.id } });
    expect(deletedV2?.deletedAt).not.toBeNull();
    expect(deletedV2?.isLatest).toBe(false);
  });

  it("getCollaboratorDocumentStatus reflete PENDING para requisito sem envio e SUBMITTED após envio", async () => {
    await prisma.collaboratorDocumentRequirement.create({
      data: { collaboratorId, documentTypeId, createdAt: new Date(), deletedAt: null },
    });

    const beforeSubmit = await service.getCollaboratorDocumentStatus(collaboratorId);
    expect(beforeSubmit.value[0].status).toBe(DocumentStatus.PENDING);

    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" });

    const afterSubmit = await service.getCollaboratorDocumentStatus(collaboratorId);
    expect(afterSubmit.value[0].status).toBe(DocumentStatus.SUBMITTED);
    expect(afterSubmit.value[0].version).toBe(1);
  });

  it("dois reenvios simultâneos do mesmo documento não devem gerar duas versões isLatest true", async () => {
    await service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" });

    const [resultA, resultB] = await Promise.all([
      service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "concurrent-a.pdf" }),
      service.submitDocument({ collaboratorId, documentTypeId, fileUrl: "concurrent-b.pdf" }),
    ]);

    expect(resultA.isError()).toBe(false);
    expect(resultB.isError()).toBe(false);

    const latestOnes = await prisma.document.findMany({
      where: { collaboratorId, documentTypeId, isLatest: true },
    });

    expect(latestOnes).toHaveLength(1);

    const versions = await prisma.document.findMany({
      where: { collaboratorId, documentTypeId },
      select: { version: true },
    });
    const uniqueVersions = new Set(versions.map((v) => v.version));
    expect(uniqueVersions.size).toBe(versions.length); // nenhuma versão duplicada
  });
});