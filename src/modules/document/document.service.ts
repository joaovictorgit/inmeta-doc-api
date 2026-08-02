import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { Result } from "src/utils";
import { SubmitDocumentDto } from "./dto/submit-document.dto";
import { UpdateDocumentStatusDto } from "./dto/update-documentStatus.dto";
import { DocumentStatus } from "src/utils/enums/document-status.enum";

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async submitDocument(data: SubmitDocumentDto): Promise<Result<any, Error>> {
    const { collaboratorId, documentTypeId, fileUrl } = data;

    try {
      const newDocument = await this.prisma.$transaction(async (tx) => {
        const currentLatest = await tx.document.findFirst({
          where: {
            collaboratorId,
            documentTypeId,
            isLatest: true,
            deletedAt: null,
          },
        });

        let nextVersion = 1;

        if (currentLatest) {
          await tx.document.update({
            where: { id: currentLatest.id },
            data: { isLatest: false },
          });

          nextVersion = currentLatest.version + 1;
        }

        return await tx.document.create({
          data: {
            collaboratorId,
            documentTypeId,
            fileUrl,
            version: nextVersion,
            isLatest: true,
            status: DocumentStatus.SUBMITTED,
          },
          include: {
            documentType: true,
          },
        });
      });

      return new Result(newDocument, null as any);
    } catch (error: any) {
      return new Result(null as any, new Error(`Erro ao enviar documento: ${error.message}`));
    }
  }

  async updateStatus(id: string, data: UpdateDocumentStatusDto): Promise<Result<any, Error>> {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });

    if (!document) {
      return new Result(null as any, new Error("Documento não encontrado!"));
    }

    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: { status: data.status },
    });

    return new Result(updatedDocument, null as any);
  }

  async findLatestByCollaborator(collaboratorId: string): Promise<Result<any, Error>> {
    const documents = await this.prisma.document.findMany({
      where: {
        collaboratorId,
        isLatest: true,
        deletedAt: null,
      },
      include: {
        documentType: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return new Result(documents, null as any);
  }

  async findHistory(collaboratorId: string, documentTypeId: string): Promise<Result<any, Error>> {
    const history = await this.prisma.document.findMany({
      where: {
        collaboratorId,
        documentTypeId,
        deletedAt: null,
      },
      include: {
        documentType: true,
      },
      orderBy: {
        version: "desc",
      },
    });

    return new Result(history, null as any);
  }

  async getCollaboratorDocumentStatus(collaboratorId: string): Promise<Result<any, Error>> {
    const requirements = await this.prisma.collaboratorDocumentRequirement.findMany({
      where: { collaboratorId, deletedAt: null },
      include: { documentType: true },
    });

    const latestDocuments = await this.prisma.document.findMany({
      where: { collaboratorId, isLatest: true, deletedAt: null },
    });

    const statusReport = requirements.map((req) => {
      const submittedDoc = latestDocuments.find((doc) => doc.documentTypeId === req.documentTypeId);

      return {
        documentTypeId: req.documentTypeId,
        documentTypeName: req.documentType.name,
        isRequired: true,
        status: submittedDoc ? submittedDoc.status : DocumentStatus.PENDING,
        documentId: submittedDoc ? submittedDoc.id : null,
        fileUrl: submittedDoc ? submittedDoc.fileUrl : null,
        version: submittedDoc ? submittedDoc.version : 0,
        updatedAt: submittedDoc ? submittedDoc.createdAt : null,
      };
    });

    return new Result(statusReport, null as any);
  }

  async delete(id: string): Promise<Result<boolean, Error>> {
    const document = await this.prisma.document.findFirst({
      where: { id, deletedAt: null },
    });

    if (!document) {
      return new Result(null as any, new Error("Documento não encontrado!"));
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.document.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            isLatest: false,
          },
        });

        if (document.isLatest && document.version > 1) {
          const previousVersion = await tx.document.findFirst({
            where: {
              collaboratorId: document.collaboratorId,
              documentTypeId: document.documentTypeId,
              version: document.version - 1,
              deletedAt: null,
            },
          });

          if (previousVersion) {
            await tx.document.update({
              where: { id: previousVersion.id },
              data: { isLatest: true },
            });
          }
        }
      });

      return new Result(true, null as any);
    } catch (error: any) {
      return new Result(null as any, new Error(`Erro ao deletar documento: ${error.message}`));
    }
  }
}