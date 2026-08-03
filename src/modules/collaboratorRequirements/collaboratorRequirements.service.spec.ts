import { Test, TestingModule } from "@nestjs/testing";
import { CollaboratorRequirementsService } from "./collaboratorRequirements.service";
import { PrismaService } from "src/common/prisma.service";
import { CollaboratorsService } from "../collaborators/collaborators.service";
import { DocumentTypeService } from "../documentType/documentType.service";

describe("CollaboratorRequirementsService", () => {
  let service: CollaboratorRequirementsService;
  let prisma: jest.Mocked<PrismaService>;
  let collaboratorService: jest.Mocked<CollaboratorsService>;
  let documentTypeService: jest.Mocked<DocumentTypeService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaboratorRequirementsService,
        {
          provide: PrismaService,
          useValue: {
            collaboratorDocumentRequirement: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: CollaboratorsService,
          useValue: { findById: jest.fn() },
        },
        {
          provide: DocumentTypeService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CollaboratorRequirementsService);
    prisma = module.get(PrismaService);
    collaboratorService = module.get(CollaboratorsService);
    documentTypeService = module.get(DocumentTypeService);
  });

  afterEach(() => jest.clearAllMocks());

  const collaboratorId = "collab-1";
  const documentTypeId = "doctype-1";

  describe("assign", () => {
    it("deve retornar erro se colaborador não existir", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: null } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: { id: documentTypeId } } as any);

      const result = await service.assign({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/colaborador/i);
      expect(prisma.collaboratorDocumentRequirement.create).not.toHaveBeenCalled();
    });

    it("deve retornar erro se tipo de documento não existir", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: null } as any);

      const result = await service.assign({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/tipo de documento/i);
    });

    it("deve criar um novo vínculo quando não existe nenhum", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: { id: documentTypeId } } as any);
      (prisma.collaboratorDocumentRequirement.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.collaboratorDocumentRequirement.create as jest.Mock).mockResolvedValue({ id: "req-1" });

      const result = await service.assign({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(false);
      expect(result.value).toBe("req-1");
      expect(prisma.collaboratorDocumentRequirement.create).toHaveBeenCalledTimes(1);
    });

    it("deve retornar erro se o vínculo já existe e está ativo", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: { id: documentTypeId } } as any);
      (prisma.collaboratorDocumentRequirement.findFirst as jest.Mock).mockResolvedValue({
        id: "req-1",
        deletedAt: null,
      });

      const result = await service.assign({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/já está vinculado/i);
      expect(prisma.collaboratorDocumentRequirement.create).not.toHaveBeenCalled();
    });

    it("deve reativar o vínculo (deletedAt -> null) se ele existia mas estava removido", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: { id: documentTypeId } } as any);
      (prisma.collaboratorDocumentRequirement.findFirst as jest.Mock).mockResolvedValue({
        id: "req-1",
        deletedAt: new Date(),
      });
      (prisma.collaboratorDocumentRequirement.update as jest.Mock).mockResolvedValue({ id: "req-1" });

      const result = await service.assign({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(false);
      expect(result.value).toBe("req-1");
      expect(prisma.collaboratorDocumentRequirement.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { deletedAt: null },
        select: { id: true },
      });
      expect(prisma.collaboratorDocumentRequirement.create).not.toHaveBeenCalled();
    });
  });

  describe("assignBatch", () => {
    it("deve chamar assign para cada documentTypeId informado", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: { id: documentTypeId } } as any);
      (prisma.collaboratorDocumentRequirement.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.collaboratorDocumentRequirement.create as jest.Mock).mockResolvedValue({ id: "req-x" });

      const result = await service.assignBatch({
        collaboratorId,
        documentTypeIds: ["doctype-1", "doctype-2", "doctype-3"],
      });

      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
      expect(prisma.collaboratorDocumentRequirement.create).toHaveBeenCalledTimes(3);
    });

    it("não deve interromper o lote se um item falhar (comportamento atual)", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      documentTypeService.findById.mockResolvedValue({ isError: () => false, value: null } as any);

      const result = await service.assignBatch({
        collaboratorId,
        documentTypeIds: ["doctype-invalido"],
      });

      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
    });
  });

  describe("findByCollaborator", () => {
    it("deve retornar erro se colaborador não existir", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: null } as any);

      const result = await service.findByCollaborator(collaboratorId);

      expect(result.isError()).toBe(true);
      expect(prisma.collaboratorDocumentRequirement.findMany).not.toHaveBeenCalled();
    });

    it("deve listar apenas requisitos não deletados com tipo de documento não deletado", async () => {
      collaboratorService.findById.mockResolvedValue({ isError: () => false, value: { id: collaboratorId } } as any);
      (prisma.collaboratorDocumentRequirement.findMany as jest.Mock).mockResolvedValue([{ id: "req-1" }]);

      const result = await service.findByCollaborator(collaboratorId);

      expect(result.isError()).toBe(false);
      expect(prisma.collaboratorDocumentRequirement.findMany).toHaveBeenCalledWith({
        where: {
          collaboratorId,
          deletedAt: null,
          documentType: { deletedAt: null },
        },
        include: { documentType: true },
      });
    });
  });

  describe("remove", () => {
    it("deve retornar erro se o vínculo não existir ou já estiver removido", async () => {
      (prisma.collaboratorDocumentRequirement.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.remove({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(true);
      expect(prisma.collaboratorDocumentRequirement.update).not.toHaveBeenCalled();
    });

    it("deve fazer soft delete (setar deletedAt) do vínculo existente", async () => {
      (prisma.collaboratorDocumentRequirement.findFirst as jest.Mock).mockResolvedValue({ id: "req-1" });
      (prisma.collaboratorDocumentRequirement.update as jest.Mock).mockResolvedValue({ id: "req-1" });

      const result = await service.remove({ collaboratorId, documentTypeId });

      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
      expect(prisma.collaboratorDocumentRequirement.update).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});