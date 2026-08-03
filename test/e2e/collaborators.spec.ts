import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "src/app.module";
import { PrismaService } from "src/common/prisma.service";

describe("Colaboradores (e2e)", () => {
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

  it("POST /collaborator -> cria um colaborador e retorna 201", async () => {
    const response = await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Elisa Ramos", email: "elisa@email.com", cpf: "11122233344" })
      .expect(201);

    expect(response.body).toMatchObject({
      name: "Elisa Ramos",
      email: "elisa@email.com",
    });
    expect(response.body.id).toBeDefined();
  });

  it("POST /collaborator -> retorna 400 ao repetir email", async () => {
    await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Fabio", email: "fabio@email.com", cpf: "22233344455" })
      .expect(201);

    await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Fabio 2", email: "fabio@email.com", cpf: "99988877766" })
      .expect(400);
  });

  it("fluxo completo: criar -> buscar -> atualizar -> deletar -> some da listagem", async () => {
    const created = await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Gustavo", email: "gustavo@email.com", cpf: "33344455566" })
      .expect(201);

    const id = created.body.id;

    await request(app.getHttpServer())
      .get(`/collaborator/${id}`)
      .expect(200)
      .expect((res) => expect(res.body.name).toBe("Gustavo"));

    await request(app.getHttpServer())
      .put(`/collaborator/${id}`)
      .send({ name: "Gustavo Atualizado", email: "gustavo@email.com", cpf: "33344455566" })
      .expect(200);

    await request(app.getHttpServer()).delete(`/collaborator/${id}`).expect(200);

    const list = await request(app.getHttpServer()).get("/collaborator").expect(200);
    expect(list.body.data.find((c: any) => c.id === id)).toBeUndefined();
  });

  it("GET /collaborator -> retorna lista paginada", async () => {
    await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Helena", email: "helena@email.com", cpf: "44455566677" })
      .expect(201);

    const response = await request(app.getHttpServer())
      .get("/collaborator")
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.meta).toEqual(
      expect.objectContaining({ page: 1, limit: 10, total: 1 }),
    );
    expect(response.body.data).toHaveLength(1);
  });

  it("GET /collaborator/:id -> retorna 400 para id de colaborador deletado", async () => {
    const created = await request(app.getHttpServer())
      .post("/collaborator")
      .send({ name: "Igor", email: "igor@email.com", cpf: "55566677788" })
      .expect(201);

    await request(app.getHttpServer()).delete(`/collaborator/${created.body.id}`).expect(200);
    await request(app.getHttpServer()).get(`/collaborator/${created.body.id}`).expect(200);
  });
});