import { IsUUID } from "class-validator";

export class DeleteRequirementDto {
  @IsUUID()
  collaboratorId!: string;
  
  @IsUUID()
  documentTypeId!: string;
}