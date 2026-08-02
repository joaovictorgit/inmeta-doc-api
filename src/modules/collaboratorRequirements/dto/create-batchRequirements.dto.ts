import { IsArray, IsUUID } from "class-validator";

export class CreateBatchRequirementsDto {
  @IsUUID()
  collaboratorId!: string;

  @IsArray()
  @IsUUID("4", { each: true })
  documentTypeIds!: string[];
}