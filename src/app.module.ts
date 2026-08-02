import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';
import { DocumentTypeModule } from './modules/documentType/documentType.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CollaboratorsModule,
    DocumentTypeModule,
  ],
})
export class AppModule {}
