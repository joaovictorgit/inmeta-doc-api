import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/common/prisma.service";

describe("Tipos de documento (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.document.deleteMany();
    await prisma.collaboratorDocumentRequirement.deleteMany();
    await prisma.documentType.deleteMany();
    await prisma.collaborator.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /document-type -> cria um tipo de documento e retorna 201", async () => {
    const response = await request(app.getHttpServer())
      .post("/document-type")
      .send({ name: "CPF" })
      .expect(201);

    expect(response.body).toMatchObject({
      name: "CPF",
    });
    expect(response.body.id).toBeDefined();
  });

  it("POST /document-type -> retorna 400 ao repetir nome", async () => {
    await request(app.getHttpServer())
      .post("/document-type")
      .send({ name: "Certidão" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/document-type")
      .send({ name: "Certidão" })
      .expect(400);
  });

  it("fluxo completo: criar -> buscar -> atualizar -> deletar -> some da listagem", async () => {
    const created = await request(app.getHttpServer())
      .post("/document-type")
      .send({ name: "ASO" })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .get(`/document-type/${id}`)
      .expect(200)
      .expect((res) => expect(res.body.name).toBe("ASO"));

    await request(app.getHttpServer())
      .put(`/document-type/${id}`)
      .send({ name: "ASO Atualizado" })
      .expect(200);

    await request(app.getHttpServer()).delete(`/document-type/${id}`).expect(200);

    const list = await request(app.getHttpServer()).get("/collaborator").expect(200);
    expect(list.body.data.find((c: any) => c.id === id)).toBeUndefined();
  });

  it("GET /document-type -> retorna lista paginada", async () => {
    await request(app.getHttpServer())
      .post("/document-type")
      .send({ name: "ASO 2" })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get("/document-type")
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.meta).toEqual(
      expect.objectContaining({ page: 1, limit: 10, total: 1 }),
    );
    expect(response.body.data).toHaveLength(1);
  });

  it("GET /document-type/:id -> retorna 400 para id de tipo de documento deletado", async () => {
    const created = await request(app.getHttpServer())
      .post("/document-type")
      .send({ name: "ASO 3" })
      .expect(201);

    await request(app.getHttpServer()).delete(`/document-type/${created.body.id}`).expect(200);
    await request(app.getHttpServer()).get(`/document-type/${created.body.id}`).expect(200);
  });
});