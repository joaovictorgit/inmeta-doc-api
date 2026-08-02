import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { DocumentTypeModule } from './modules/documentType/documentType.module';
import { CollaboratorRequirementsModule } from './modules/collaboratorRequirements/collaboratorRequirements.module';
import { DocumentModule } from './modules/document/document.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CollaboratorsModule,
    DocumentTypeModule,
    CollaboratorRequirementsModule,
    DocumentModule
  ],
})
export class AppModule {}
