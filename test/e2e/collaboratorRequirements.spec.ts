import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/common/prisma.service";

describe("CollaboratorRequirements (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let collaboratorId: string;
  let documentTypeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.collaboratorDocumentRequirement.deleteMany({});
    await prisma.collaborator.deleteMany({});
    await prisma.documentType.deleteMany({});

    const collaborator = await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Karina Melo", email: "karina@email.com", cpf: "77788899900" });
    collaboratorId = collaborator.body.id;

    const documentType = await prisma.documentType.create({
      data: { name: "Certidão", createdAt: new Date(), deletedAt: null },
    });
    documentTypeId = documentType.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /collaborator-requirements -> cria o vínculo e retorna 201", async () => {
    const response = await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId, documentTypeId })
      .expect(201);

    expect(typeof response.body).toBe("string");
  });

  it("POST /collaborator-requirements -> 400 ao repetir vínculo ativo", async () => {
    await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId, documentTypeId })
      .expect(201);

    await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId, documentTypeId })
      .expect(400);
  });

  it("POST /collaborator-requirements -> 400 com collaboratorId inválido (não-UUID)", async () => {
    await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId: "id-invalido", documentTypeId })
      .expect(400);
  });

  it("POST /collaborator-requirements/batch -> cria vínculos em lote", async () => {
    const secondType = await prisma.documentType.create({
      data: { name: "ASO", createdAt: new Date(), deletedAt: null },
    });

    await request(app.getHttpServer())
      .post("/collaborator-requirements/batch")
      .send({ collaboratorId, documentTypeIds: [documentTypeId, secondType.id] })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get(`/collaborator-requirements/${collaboratorId}`)
      .expect(200);

    expect(list.body).toHaveLength(2);
  });

  it("GET /collaborator-requirements/:id -> lista vínculos ativos do colaborador", async () => {
    await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId, documentTypeId })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/collaborator-requirements/${collaboratorId}`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].documentTypeId).toBe(documentTypeId);
  });

  it.skip("DELETE /collaborator-requirements/:id -> remove o vínculo (rota pendente de ajuste)", async () => {
    await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId, documentTypeId })
      .expect(201);

    await request(app.getHttpServer())
      .delete(`/collaborator-requirements/${collaboratorId}/${documentTypeId}`)
      .expect(200);

    const list = await request(app.getHttpServer())
      .get(`/collaborator-requirements/${collaboratorId}`)
      .expect(200);

    expect(list.body).toHaveLength(0);
  });
});