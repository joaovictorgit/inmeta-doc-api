import { DocumentStatus } from "src/utils/enums/document-status.enum";
import { Collaborator } from "./collaborator";
import { DocumentType } from "./documentType";

export type Document = {
  id: string;
  collaboratorId: string;
  documentTypeId: string;
  version: number;
  isLatest: boolean;
  status: DocumentStatus;
  fileUrl: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  collaborator?: Collaborator;
  documentType?: DocumentType;
}