import { IsUUID } from "class-validator";

export class CreateRequirementDto {
  @IsUUID()
  collaboratorId!: string;

  @IsUUID()
  documentTypeId!: string;
}