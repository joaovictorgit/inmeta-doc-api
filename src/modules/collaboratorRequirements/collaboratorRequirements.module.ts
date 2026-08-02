import { Module } from "@nestjs/common";
import { PrismaService } from "src/common/prisma.service";
import { CollaboratorRequirementsController } from "./collaboratorRequirements.controller";
import { CollaboratorRequirementsService } from "./collaboratorRequirements.service";
import { CollaboratorsModule } from "../collaborators/collaborators.module";
import { DocumentTypeModule } from "../documentType/documentType.module";

@Module({
  imports: [CollaboratorsModule, DocumentTypeModule],
  controllers: [CollaboratorRequirementsController],
  providers: [PrismaService, CollaboratorRequirementsService],
  exports: [CollaboratorRequirementsModule]
})

export class CollaboratorRequirementsModule {}