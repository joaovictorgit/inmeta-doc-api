import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { DocumentTypeService } from "./documentType.service";
import { DocumentTypeHelper } from "src/common/documentTypeHelper";
import { DocumentTypeController } from "./documentType.controller";

@Module({
  providers: [PrismaService, DocumentTypeService, DocumentTypeHelper],
  controllers: [DocumentTypeController],
  exports: [DocumentTypeModule, DocumentTypeService]
})

export class DocumentTypeModule {}