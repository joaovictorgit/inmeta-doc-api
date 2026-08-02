import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { DocumentTypeModule } from './modules/documentType/documentType.module';
import { CollaboratorRequirementsModule } from './modules/collaboratorRequirements/collaboratorRequirements.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CollaboratorsModule,
    DocumentTypeModule,
    CollaboratorRequirementsModule,
  ],
})
export class AppModule {}
