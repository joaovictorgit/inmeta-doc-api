import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaboratorsModule } from './modules/collaborators/collaborators.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CollaboratorsModule,
  ],
})
export class AppModule {}
