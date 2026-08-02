import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { DocumentType } from "src/types/documentType";
import { Result } from "src/utils";
import { CreateDocumentTypeDto } from "./dto/create-documentType.dto";
import { DocumentTypeHelper } from "src/common/documentTypeHelper";
import { ParamsDocumentType } from "./dto/params-documentType.dto";
import { PaginatedResult } from "src/types/pagineted-result";
import { UpdateDocumentTypeDto } from "./dto/update-documentType.dto";

@Injectable()
export class DocumentTypeService {
  constructor(
    private prisma: PrismaService,
    private documentTypeHelper: DocumentTypeHelper
  ) {}

  async create(data: CreateDocumentTypeDto): Promise<Result<DocumentType, Error>> {
    const currentDocumentType = await this.documentTypeHelper.findDocumentTypeByName(data.name);

    if (currentDocumentType) {
      return new Result(null as any, new Error("Já existe um tipo de documento com esse nome!"));
    }

    const newDocumentType = await this.prisma.documentType.create({
      data: {
        name: data.name,
        description: data?.description || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      }
    }) as DocumentType;

    return new Result(newDocumentType, null as any);
  }

  async findAll(params: ParamsDocumentType): Promise<Result<PaginatedResult<DocumentType>, Error>> {
    const currentPage = parseInt(params.page) || 1;
    const currentLimit = parseInt(params.limit) || 10;

    if (
      Number.isNaN(currentPage) ||
      Number.isNaN(currentLimit) ||
      currentPage < 1 ||
      currentLimit < 1
    ) {
      return new Result(null as any, new Error("Página ou limite inválidos."));
    }

    const where = { 
      deletedAt: null,
      ...(params.name && {
        name: {
          contains: params.name,
          mode: "insensitive" as const,
        }
      })
    };

    const [documentTypes, total] = await Promise.all([
      this.prisma.documentType.findMany({
        where,
        skip: (currentPage - 1) * currentLimit,
        take: currentLimit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.documentType.count({ where }),
    ]);

    return new Result({
      data: documentTypes,
      meta: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
      }
    }, null as any);
  }

  async findById(id: string): Promise<Result<DocumentType | null, Error>> {
    if (!id?.trim()) {
      return new Result(null as any, new Error("Id não informado!"));
    }

    const currentDocumentType = await this.prisma.documentType.findUnique({
      where: {
        id,
        deletedAt: null,
      }
    }) as DocumentType | null;

    return new Result(currentDocumentType, null as any);
  }

  async updateById(id: string, data: UpdateDocumentTypeDto): Promise<Result<boolean, Error>> {
    if (!id?.trim()) {
      return new Result(null as any, new Error("Id não informado!"));
    }

    const currentDocumentType = await this.findById(id);

    if (!currentDocumentType.value) {
      return new Result(null as any, new Error("Tipo de documentão não encontrado!"));
    }

    const currentDocumentTypeByName = await this.documentTypeHelper.findDocumentTypeByName(data.name);

    if (currentDocumentTypeByName && currentDocumentTypeByName.name !== currentDocumentType.value.name) {
      return new Result(null as any, new Error("Já existe um tipo de documento com esse nome"));
    }

    await this.prisma.documentType.update({
      where: { id: currentDocumentType.value.id },
      data: {
        ...data,
        updatedAt: new Date(),
      }
    });

    return new Result(true, null as any);
  }

  async deleteById(id: string): Promise<Result<boolean, Error>> {
    if (!id?.trim()) {
      return new Result(null as any, new Error("Id não informado!"));
    }

    const currentDocumentType = await this.findById(id);

    if (!currentDocumentType.value) {
      return new Result(null as any, new Error("Tipo de documentão não encontrado!"));
    }

    await this.prisma.documentType.update({
      where: { id: currentDocumentType.value.id },
      data: {
        deletedAt: new Date(),
      }
    });

    return new Result(true, null as any);
  }
}