import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from "class-validator";

export class SubmitDocumentDto {
  @IsUUID()
  @IsNotEmpty()
  collaboratorId!: string;

  @IsUUID()
  @IsNotEmpty()
  documentTypeId!: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;
}