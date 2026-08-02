import { Injectable } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { DocumentType } from "src/types/documentType";

@Injectable()
export class DocumentTypeHelper {
  constructor (
    private prisma: PrismaService
  ) {}

  async findDocumentTypeByName (name: string): Promise<DocumentType | null> {
    const documentType = await this.prisma.documentType.findFirst({
      where: { 
        name,
        deletedAt: null,
      }
    }) as DocumentType;

    return documentType || null;
  }
}