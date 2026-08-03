import { PrismaService } from "src/common/prisma.service";
import { CollaboratorsService } from "./collaborators.service";
import { CollaboratorHelper } from "src/common/collaboratorHelper";
import { Test, TestingModule } from "@nestjs/testing";

describe("CollaboratorsService", () => {
  let service: CollaboratorsService;
  let prisma: jest.Mocked<PrismaService>;
  let helper: jest.Mocked<CollaboratorHelper>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaboratorsService,
        {
          provide: PrismaService,
          useValue: {
            collaborator: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: CollaboratorHelper,
          useValue: {
            findCollaboratorByEmail: jest.fn(),
            findCollaboratorByCpf: jest.fn(),
          },
        },
      ],
    }).compile();
 
    service = module.get(CollaboratorsService);
    prisma = module.get(PrismaService);
    helper = module.get(CollaboratorHelper);
  });

  afterEach(() => jest.clearAllMocks());

  describe("create", () => {
    const dto = { name: "Ana Silva", email: "ana@email.com", cpf: "11122233344" };
 
    it("deve criar um colaborador quando email e cpf são únicos", async () => {
      helper.findCollaboratorByEmail.mockResolvedValue(null);
      helper.findCollaboratorByCpf.mockResolvedValue(null);
      (prisma.collaborator.create as jest.Mock).mockResolvedValue({ id: "1", ...dto });
 
      const result = await service.create(dto as any);
 
      expect(result.isError()).toBe(false);
      expect(result.value).toMatchObject(dto);
      expect(prisma.collaborator.create).toHaveBeenCalledTimes(1);
    });
 
    it("deve retornar erro se já existe colaborador com o mesmo email", async () => {
      helper.findCollaboratorByEmail.mockResolvedValue({ id: "existing" } as any);
      helper.findCollaboratorByCpf.mockResolvedValue(null);
 
      const result = await service.create(dto as any);
 
      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/e-mail/i);
      expect(prisma.collaborator.create).not.toHaveBeenCalled();
    });
 
    it("deve retornar erro se já existe colaborador com o mesmo cpf", async () => {
      helper.findCollaboratorByEmail.mockResolvedValue(null);
      helper.findCollaboratorByCpf.mockResolvedValue({ id: "existing" } as any);
 
      const result = await service.create(dto as any);
 
      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/cpf/i);
      expect(prisma.collaborator.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("deve retornar lista paginada com valores default de page e limit", async () => {
      (prisma.collaborator.findMany as jest.Mock).mockResolvedValue([{ id: "1" }]);
      (prisma.collaborator.count as jest.Mock).mockResolvedValue(1);
 
      const result = await service.findAll({} as any);
 
      expect(result.isError()).toBe(false);
      expect(result.value.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
      expect(prisma.collaborator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null }, skip: 0, take: 10 }),
      );
    });
 
    it("deve retornar erro quando page é inválida", async () => {
      const result = await service.findAll({ page: "0", limit: "10" } as any);
 
      expect(result.isError()).toBe(true);
      expect(prisma.collaborator.findMany).not.toHaveBeenCalled();
    });
 
    it("deve filtrar apenas colaboradores não deletados (soft delete)", async () => {
      (prisma.collaborator.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.collaborator.count as jest.Mock).mockResolvedValue(0);
 
      await service.findAll({ page: "1", limit: "10" } as any);
 
      expect(prisma.collaborator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { deletedAt: null } }),
      );
    });
  });
 
  describe("findById", () => {
    it("deve retornar erro se id não for informado", async () => {
      const result = await service.findById("");
 
      expect(result.isError()).toBe(true);
      expect(prisma.collaborator.findFirst).not.toHaveBeenCalled();
    });
 
    it("deve retornar null quando colaborador não existe", async () => {
      (prisma.collaborator.findFirst as jest.Mock).mockResolvedValue(null);
 
      const result = await service.findById("inexistente");
 
      expect(result.isError()).toBe(false);
      expect(result.value).toBeNull();
    });
  });
 
  describe("updateById", () => {
    it("deve retornar erro se colaborador não existir", async () => {
      (prisma.collaborator.findFirst as jest.Mock).mockResolvedValue(null);
 
      const result = await service.updateById("1", { email: "novo@email.com" } as any);
 
      expect(result.isError()).toBe(true);
      expect(result.error.message).toMatch(/não encontrado/i);
    });
 
    it("deve atualizar quando email pertence ao próprio colaborador", async () => {
      const current = { id: "1", email: "a@a.com", cpf: "123" };
      (prisma.collaborator.findFirst as jest.Mock).mockResolvedValue(current);
      helper.findCollaboratorByEmail.mockResolvedValue(current as any);
      helper.findCollaboratorByCpf.mockResolvedValue(null);
      (prisma.collaborator.update as jest.Mock).mockResolvedValue(current);
 
      const result = await service.updateById("1", { email: "a@a.com" } as any);
 
      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
    });
 
    it("deve retornar erro se novo email já pertence a outro colaborador", async () => {
      const current = { id: "1", email: "a@a.com", cpf: "123" };
      (prisma.collaborator.findFirst as jest.Mock).mockResolvedValue(current);
      helper.findCollaboratorByEmail.mockResolvedValue({ id: "2" } as any);
      helper.findCollaboratorByCpf.mockResolvedValue(null);
 
      const result = await service.updateById("1", { email: "conflito@a.com" } as any);
 
      expect(result.isError()).toBe(true);
      expect(prisma.collaborator.update).not.toHaveBeenCalled();
    });
  });
 
  describe("deleteById", () => {
    it("deve fazer soft delete (setar deletedAt) e não deletar fisicamente", async () => {
      const current = { id: "1" };
      (prisma.collaborator.findFirst as jest.Mock).mockResolvedValue(current);
      (prisma.collaborator.update as jest.Mock).mockResolvedValue({ ...current, deletedAt: new Date() });
 
      const result = await service.deleteById("1");
 
      expect(result.isError()).toBe(false);
      expect(result.value).toBe(true);
      expect(prisma.collaborator.update).toHaveBeenCalledWith({
        where: { id: "1" },
        data: { deletedAt: expect.any(Date) },
      });
    });
 
    it("deve retornar erro se colaborador não existir", async () => {
      (prisma.collaborator.findFirst as jest.Mock).mockResolvedValue(null);
 
      const result = await service.deleteById("inexistente");
 
      expect(result.isError()).toBe(true);
      expect(prisma.collaborator.update).not.toHaveBeenCalled();
    });
  });
});