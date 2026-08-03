import { Test, TestingModule } from "@nestjs/testing";
import { DocumentTypeHelper } from "src/common/documentTypeHelper";
import { PrismaService } from "src/common/prisma.service";
import { DocumentTypeService } from "src/modules/documentType/documentType.service";


describe("DocumentTypeService (integração)", () => {
  let service: DocumentTypeService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocumentTypeService, DocumentTypeHelper, PrismaService],
    }).compile();
 
    service = module.get(DocumentTypeService);
    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.collaboratorDocumentRequirement.deleteMany({});
    await prisma.documentType.deleteMany({});
    await prisma.collaborator.deleteMany({});
  });
 
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("deve persistir um tipo de documento no banco", async () => {
    const result = await service.create({
      name: "Certidão",
      description: "Certidão de Nascimento"
    } as any);
 
    expect(result.isError()).toBe(false);
 
    const found = await prisma.documentType.findUnique({ where: { id: result.value.id } });
    expect(found).not.toBeNull();
    expect(found?.name).toBe("Certidão");
  });

  it("não deve permitir dois tipos de documento com o mesmo nome", async () => {
    await service.create({ name: "Certidão" } as any);
 
    const result = await service.create({
      name: "Certidão",
    } as any);
 
    expect(result.isError()).toBe(true);
 
    const total = await prisma.documentType.count();
    expect(total).toBe(1);
  });
 
  it("soft delete não remove fisicamente e some das listagens", async () => {
    const created = await service.create({
      name: "Certidão",
    } as any);
 
    await service.deleteById(created.value.id);
 
    const raw = await prisma.documentType.findUnique({ where: { id: created.value.id } });
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
        name: `Certidão ${i}`,
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