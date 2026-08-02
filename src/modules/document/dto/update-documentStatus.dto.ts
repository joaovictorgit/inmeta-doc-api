import { IsEnum, IsNotEmpty } from "class-validator";
import { DocumentStatus } from "src/utils/enums/document-status.enum";

export class UpdateDocumentStatusDto {
  @IsEnum(DocumentStatus)
  @IsNotEmpty()
  status!: DocumentStatus;
}