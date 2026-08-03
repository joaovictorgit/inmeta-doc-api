import { Test, TestingModule } from "@nestjs/testing";
import { CollaboratorHelper } from "src/common/collaboratorHelper";
import { PrismaService } from "src/common/prisma.service";
import { CollaboratorsService } from "src/modules/collaborators/collaborators.service";

describe("CollaboratorsService (integração)", () => {
  let service: CollaboratorsService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CollaboratorsService, CollaboratorHelper, PrismaService],
    }).compile();
 
    service = module.get(CollaboratorsService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.collaborator.deleteMany({});
  });
 
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deve persistir um colaborador no banco", async () => {
    const result = await service.create({
      name: "Bruno Costa",
      email: "bruno@email.com",
      cpf: "99988877766",
    } as any);
 
    expect(result.isError()).toBe(false);
 
    const found = await prisma.collaborator.findUnique({ where: { id: result.value.id } });
    expect(found).not.toBeNull();
    expect(found?.email).toBe("bruno@email.com");
  });

  it("não deve permitir dois colaboradores com o mesmo cpf", async () => {
    await service.create({ name: "Carla", email: "carla@email.com", cpf: "12345678900" } as any);
 
    const result = await service.create({
      name: "Carla Duplicada",
      email: "outro@email.com",
      cpf: "12345678900",
    } as any);
 
    expect(result.isError()).toBe(true);
 
    const total = await prisma.collaborator.count();
    expect(total).toBe(1);
  });
 
  it("soft delete não remove fisicamente e some das listagens", async () => {
    const created = await service.create({
      name: "Diego",
      email: "diego@email.com",
      cpf: "55566677788",
    } as any);
 
    await service.deleteById(created.value.id);
 
    const raw = await prisma.collaborator.findUnique({ where: { id: created.value.id } });
    expect(raw).not.toBeNull();
    expect(raw?.deletedAt).not.toBeNull();
 
    const listResult = await service.findAll({ page: "1", limit: "10" } as any);
    expect(listResult.value.data.find((c) => c.id === created.value.id)).toBeUndefined();
 
    const findResult = await service.findById(created.value.id);
    expect(findResult.value).toBeNull();
  });
 
  it("paginação retorna o total correto respeitando soft delete", async () => {
    for (let i = 0; i < 15; i++) {
      await service.create({
        name: `Colaborador ${i}`,
        email: `colab${i}@email.com`,
        cpf: `${i}`.padStart(11, "0"),
      } as any);
    }
 
    const page1 = await service.findAll({ page: "1", limit: "10" } as any);
    expect(page1.value.data).toHaveLength(10);
    expect(page1.value.meta.total).toBe(15);
    expect(page1.value.meta.totalPages).toBe(2);
 
    const page2 = await service.findAll({ page: "2", limit: "10" } as any);
    expect(page2.value.data).toHaveLength(5);
  });
});