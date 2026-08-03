import { PrismaService } from "src/common/prisma.service";
import { DocumentTypeService } from "./documentType.service"
import { DocumentTypeHelper } from "src/common/documentTypeHelper";
import { Test, TestingModule } from "@nestjs/testing";

describe("DocumentTypeService", () => {
  let service: DocumentTypeService;
  let prisma: jest.Mocked<PrismaService>;
  let helper: jest.Mocked<DocumentTypeHelper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentTypeService,
        {
          provide: PrismaService,
          useValue: {
            documentType: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: DocumentTypeHelper,
          useValue: {
            findDocumentTypeByName: jest.fn(),
          },
        },
      ],
    }).compile();
   
    service = module.get(DocumentTypeService);
    prisma = module.get(PrismaService);
    helper = module.get(DocumentTypeHelper);
  });

  afterEach(() => jest.clearAllMocks());

  describe("create", () => {
    const dto = { name: "CPF", description: "Tipo de documento: CPF" };

    it("deve criar um tipo de documento quando o nome é único", async () => {
      helper.findDocumentTypeByName.mockResolvedValue(null);
      (prisma.documentType.create as jest.Mock).mockResolvedValue({ id: "1", ...dto });

      const result = await service.create(dto as any);

      expect(result.isError()).toBe(false);
      expect(result.value).toMatchObject(dto);
      expect(prisma.documentType.create).toHaveBeenCalledTimes(1);
    });

    it("deve retornar erro se já existe tipo de documento com o mesmo nome", async () => {
      helper.findDocumentTypeByName.mockResolvedValue({ id: "existing"} as any);

      const result = await service.create(dto as any);

      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/nome/i);
      expect(prisma.documentType.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("deve retornar lista paginada com valores default de page e limit", async () => {
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue([{ id: "1" }]);
      (prisma.documentType.count as jest.Mock).mockResolvedValue(1);
 
      const result = await service.findAll({} as any);
 
      expect(result.isError()).toBe(false);
      expect(result.value.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(prisma.documentType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null }, skip: 0, take: 10 }),
      );
    });
 
    it("deve retornar erro quando page é inválida", async () => {
      const result = await service.findAll({ page: "0", limit: "10" } as any);
 
      expect(result.isError()).toBe(true);
      expect(prisma.documentType.findMany).not.toHaveBeenCalled();
    });
 
    it("deve filtrar apenas os tipos de documentos não deletados (soft delete)", async () => {
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.documentType.count as jest.Mock).mockResolvedValue(0);
 
      await service.findAll({ page: "1", limit: "10" } as any);
 
      expect(prisma.documentType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });

    it("deve filtrar por nome quando o parâmetro name for informado", async () => {
      (prisma.documentType.findMany as jest.Mock).mockResolvedValue([{ id: "1", name: "CPF" }]);
      (prisma.documentType.count as jest.Mock).mockResolvedValue(1);

      await service.findAll({ page: "1", limit: "10", name: "CPF", } as any);

      expect(prisma.documentType.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            name: {
              contains: "CPF",
              mode: "insensitive",
            },
          },
          skip: 0,
          take: 10,
        }),
      );
      expect(prisma.documentType.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          name: {
            contains: "CPF",
            mode: "insensitive",
          },
        },
      });
    });
  });

  describe("findById", () => {
    it("deve retornar erro se id não for informado", async () => {
      const result = await service.findById("");
 
      expect(result.isError()).toBe(true);
      expect(prisma.documentType.findFirst).not.toHaveBeenCalled();
    });
 
    it("deve retornar null quando o tipo de documento não existe", async () => {
      (prisma.documentType.findFirst as jest.Mock).mockResolvedValue(null);
 
      const result = await service.findById("inexistente");
 
      expect(result.isError()).toBe(false);
      expect(result.value).toBeNull();
    });
  });

  describe("updateById", () => {
    it("deve retornar erro se o tipo de documento não existir", async () => {
      (prisma.documentType.findFirst as jest.Mock).mockResolvedValue(null);
 
      const result = await service.updateById("1", { name: "Certidão" } as any);
 
      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/não encontrado/i);
    });
 
    it("deve atualizar quando nome pertence ao próprio tipo de documento", async () => {
      const current = { id: "1", name: "Certidão", description: "Certidão" };
      (prisma.documentType.findFirst as jest.Mock).mockResolvedValue(current);
      helper.findDocumentTypeByName.mockResolvedValue(current as any);
      (prisma.documentType.update as jest.Mock).mockResolvedValue(current);
 
      const result = await service.updateById("1", { name: "Certidão atualizada" } as any);
 
      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
    });
 
    it("deve retornar erro se novo nome já pertence a outro tipo de documento", async () => {
      const current = { id: "1", name: "Certidão", description: "Certidão" };
      (prisma.documentType.findFirst as jest.Mock).mockResolvedValue(current);
      helper.findDocumentTypeByName.mockResolvedValue({ id: "2" } as any);
      
      const result = await service.updateById("1", { name: "conflito" } as any);
 
      expect(result.isError()).toBe(true);
      expect(prisma.documentType.update).not.toHaveBeenCalled();
    });
  });

  describe("deleteById", () => {
    it("deve fazer soft delete (setar deletedAt) e não deletar fisicamente", async () => {
      const current = { id: "1" };
      (prisma.documentType.findFirst as jest.Mock).mockResolvedValue(current);
      (prisma.documentType.update as jest.Mock).mockResolvedValue({ ...current, deletedAt: new Date() });
 
      const result = await service.deleteById("1");
 
      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
      expect(prisma.documentType.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
 
    it("deve retornar erro se o tipo de documento não existir", async () => {
      (prisma.documentType.findFirst as jest.Mock).mockResolvedValue(null);
 
      const result = await service.deleteById("inexistente");
 
      expect(result.isError()).toBe(true);
      expect(prisma.documentType.update).not.toHaveBeenCalled();
    });
  });
})