import { Module } from "@nestjs/common";
import { CollaboratorsController } from "./collaborators.controller";
import { PrismaService } from "src/common/prisma.service";
import { CollaboratorsService } from "./collaborators.service";
import { CollaboratorHelper } from "src/common/collaboratorHelper";

@Module({
  providers: [PrismaService, CollaboratorsService, CollaboratorHelper],
  controllers: [CollaboratorsController],
  exports: [CollaboratorsModule]
})

export class CollaboratorsModule {}