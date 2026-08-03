import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/common/prisma.service";
import { DocumentStatus } from "src/utils/enums/document-status.enum";

describe("Document (e2e)", () => {
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
    await prisma.document.deleteMany({});
    await prisma.collaboratorDocumentRequirement.deleteMany({});
    await prisma.collaborator.deleteMany({});
    await prisma.documentType.deleteMany({});

    const collaborator = await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Mateus Rocha", email: "mateus@email.com", cpf: "99900011122" });
    collaboratorId = collaborator.body.id;

    const documentType = await prisma.documentType.create({
      data: { name: "ASO", createdAt: new Date(), deletedAt: null },
    });
    documentTypeId = documentType.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /document -> cria a primeira versão do documento", async () => {
    const response = await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "http://file.com/v1.pdf" })
      .expect(201);

    expect(response.body).toMatchObject({ version: 1, isLatest: true });
  });

  it("POST /document -> reenvio cria versão 2 e mantém histórico", async () => {
    await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" })
      .expect(201);

    const second = await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v2.pdf" })
      .expect(201);

    expect(second.body.version).toBe(2);

    const history = await request(app.getHttpServer())
      .get(`/document/collaborator/${collaboratorId}/type/${documentTypeId}/history`)
      .expect(200);

    expect(history.body).toHaveLength(2);
  });

  it("GET /document/collaborator/:id/latest -> retorna só a versão vigente", async () => {
    await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v2.pdf" })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get(`/document/collaborator/${collaboratorId}/latest`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].version).toBe(2);
  });

  it("PUT /document/:id/status -> atualiza status para APROVADO", async () => {
    const created = await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" })
      .expect(201);

    const response = await request(app.getHttpServer())
      .put(`/document/${created.body.id}/status`)
      .send({ status: DocumentStatus.APPROVED })
      .expect(200);

    expect(response.body.status).toBe(DocumentStatus.APPROVED);
  });

  it("PUT /document/:id/status -> 400 para documento inexistente", async () => {
    await request(app.getHttpServer())
      .put("/document/00000000-0000-0000-0000-000000000000/status")
      .send({ status: DocumentStatus.APPROVED })
      .expect(400);
  });

  it("GET /document/collaborator/:id/status-report -> mostra PENDING e depois SUBMITTED", async () => {
    await request(app.getHttpServer())
      .post("/collaborator-requirements")
      .send({ collaboratorId, documentTypeId })
      .expect(201);

    const before = await request(app.getHttpServer())
      .get(`/document/collaborator/${collaboratorId}/status-report`)
      .expect(200);
    expect(before.body[0].status).toBe(DocumentStatus.PENDING);

    await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" })
      .expect(201);

    const after = await request(app.getHttpServer())
      .get(`/document/collaborator/${collaboratorId}/status-report`)
      .expect(200);
    expect(after.body[0].status).toBe(DocumentStatus.SUBMITTED);
  });

  it("DELETE /document/:id -> soft delete promove versão anterior a vigente", async () => {
    await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v1.pdf" })
      .expect(201);

    const v2 = await request(app.getHttpServer())
      .post("/document")
      .send({ collaboratorId, documentTypeId, fileUrl: "v2.pdf" })
      .expect(201);

    await request(app.getHttpServer()).delete(`/document/${v2.body.id}`).expect(200);

    const latest = await request(app.getHttpServer())
      .get(`/document/collaborator/${collaboratorId}/latest`)
      .expect(200);

    expect(latest.body).toHaveLength(1);
    expect(latest.body[0].version).toBe(1);
  });

  it("DELETE /document/:id -> 400 para documento inexistente", async () => {
    await request(app.getHttpServer())
      .delete("/document/00000000-0000-0000-0000-000000000000")
      .expect(400);
  });
});