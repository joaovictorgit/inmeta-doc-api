import { Collaborator } from "./collaborator";
import { DocumentType } from "./documentType";

export enum DocumentStatus {
  PENDING = "PENDING",
  SUBMITTED = "SUBMITTED",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

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