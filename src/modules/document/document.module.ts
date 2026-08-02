import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { DocumentService } from "./document.service";
import { DocumentController } from "./document.controller";

@Module({
  providers: [PrismaService, DocumentService],
  controllers: [DocumentController],
  exports: [DocumentModule]
})

export class DocumentModule {}