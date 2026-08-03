import { Test, TestingModule } from "@nestjs/testing";
import { DocumentService } from "./document.service";
import { PrismaService } from "src/common/prisma.service";
import { DocumentStatus } from "src/utils/enums/document-status.enum";

describe("DocumentService", () => {
  let service: DocumentService;
  let prisma: jest.Mocked<PrismaService>;

  const txMock = {
    document: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: PrismaService,
          useValue: {
            document: {
              findFirst: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
            collaboratorDocumentRequirement: {
              findMany: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback(txMock)),
          },
        },
      ],
    }).compile();

    service = module.get(DocumentService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => jest.clearAllMocks());

  const collaboratorId = "collab-1";
  const documentTypeId = "doctype-1";

  describe("submitDocument", () => {
    it("deve criar a primeira versão (version: 1, isLatest: true) quando não há documento anterior", async () => {
      txMock.document.findFirst.mockResolvedValue(null);
      txMock.document.create.mockResolvedValue({ id: "doc-1", version: 1, isLatest: true });

      const result = await service.submitDocument({
        collaboratorId,
        documentTypeId,
        fileUrl: "http://file.com/a.pdf",
      });

      expect(result.isError()).toBe(false);
      expect(txMock.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 1, isLatest: true }),
        }),
      );
      expect(txMock.document.update).not.toHaveBeenCalled();
    });

    it("deve incrementar a versão e desativar isLatest do documento anterior ao reenviar", async () => {
      txMock.document.findFirst.mockResolvedValue({ id: "doc-old", version: 2, isLatest: true });
      txMock.document.create.mockResolvedValue({ id: "doc-new", version: 3, isLatest: true });

      const result = await service.submitDocument({
        collaboratorId,
        documentTypeId,
        fileUrl: "http://file.com/b.pdf",
      });

      expect(result.isError()).toBe(false);
      expect(txMock.document.update).toHaveBeenCalledWith({
        where: { id: "doc-old" },
        data: { isLatest: false },
      });
      expect(txMock.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ version: 3, isLatest: true }),
        }),
      );
    });

    it("deve retornar erro encapsulado se a transação falhar", async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValue(new Error("conexão perdida"));

      const result = await service.submitDocument({
        collaboratorId,
        documentTypeId,
        fileUrl: "http://file.com/c.pdf",
      });

      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/Erro ao enviar documento/);
    });
  });

  describe("updateStatus", () => {
    it("deve retornar erro se documento não existir ou estiver deletado", async () => {
      (prisma.document.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.updateStatus("doc-1", { status: DocumentStatus.APPROVED } as any);

      expect(result.isError()).toBe(true);
      expect(prisma.document.update).not.toHaveBeenCalled();
    });

    it("deve atualizar o status do documento existente", async () => {
      (prisma.document.findFirst as jest.Mock).mockResolvedValue({ id: "doc-1" });
      (prisma.document.update as jest.Mock).mockResolvedValue({ id: "doc-1", status: DocumentStatus.APPROVED });

      const result = await service.updateStatus("doc-1", { status: DocumentStatus.APPROVED } as any);

      expect(result.isError()).toBe(false);
      expect(result.value.status).toBe(DocumentStatus.APPROVED);
    });
  });

  describe("findLatestByCollaborator", () => {
    it("deve buscar apenas documentos com isLatest true e não deletados", async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      await service.findLatestByCollaborator(collaboratorId);

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { collaboratorId, isLatest: true, deletedAt: null },
        }),
      );
    });
  });

  describe("findHistory", () => {
    it("deve ordenar o histórico por versão decrescente", async () => {
      (prisma.document.findMany as jest.Mock).mockResolvedValue([
        { version: 2 },
        { version: 1 },
      ]);

      await service.findHistory(collaboratorId, documentTypeId);

      expect(prisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { version: "desc" } }),
      );
    });
  });

  describe("getCollaboratorDocumentStatus", () => {
    it("deve marcar como PENDING os requisitos sem documento enviado", async () => {
      (prisma.collaboratorDocumentRequirement.findMany as jest.Mock).mockResolvedValue([
        { documentTypeId, documentType: { name: "CPF" } },
      ]);
      (prisma.document.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getCollaboratorDocumentStatus(collaboratorId);

      expect(result.value[0]).toMatchObject({
        documentTypeId,
        status: DocumentStatus.PENDING,
        documentId: null,
        version: 0,
      });
    });

    it("deve retornar o status do documento vigente quando ele existe", async () => {
      (prisma.collaboratorDocumentRequirement.findMany as jest.Mock).mockResolvedValue([
        { documentTypeId, documentType: { name: "CPF" } },
      ]);
      (prisma.document.findMany as jest.Mock).mockResolvedValue([
        { id: "doc-1", documentTypeId, status: DocumentStatus.SUBMITTED, version: 1, fileUrl: "x", createdAt: new Date() },
      ]);

      const result = await service.getCollaboratorDocumentStatus(collaboratorId);

      expect(result.value[0]).toMatchObject({
        documentId: "doc-1",
        status: DocumentStatus.SUBMITTED,
        version: 1,
      });
    });
  });

  describe("delete", () => {
    it("deve retornar erro se documento não existir", async () => {
      (prisma.document.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.delete("doc-1");

      expect(result.isError()).toBe(true);
    });

    it("ao deletar a versão vigente (isLatest), deve promover a versão anterior a isLatest", async () => {
      (prisma.document.findFirst as jest.Mock).mockResolvedValue({
        id: "doc-2",
        collaboratorId,
        documentTypeId,
        version: 2,
        isLatest: true,
      });
      txMock.document.findFirst.mockResolvedValue({ id: "doc-1", version: 1 });

      const result = await service.delete("doc-2");

      expect(result.isError()).toBe(false);
      expect(txMock.document.update).toHaveBeenCalledWith({
        where: { id: "doc-2" },
        data: { deletedAt: expect.any(Date), isLatest: false },
      });
      expect(txMock.document.update).toHaveBeenCalledWith({
        where: { id: "doc-1" },
        data: { isLatest: true },
      });
    });

    it("ao deletar a versão 1 (não há anterior), não deve tentar promover nenhuma outra versão", async () => {
      (prisma.document.findFirst as jest.Mock).mockResolvedValue({
        id: "doc-1",
        collaboratorId,
        documentTypeId,
        version: 1,
        isLatest: true,
      });

      const result = await service.delete("doc-1");

      expect(result.isError()).toBe(false);
      expect(txMock.document.findFirst).not.toHaveBeenCalled();
    });
  });
});