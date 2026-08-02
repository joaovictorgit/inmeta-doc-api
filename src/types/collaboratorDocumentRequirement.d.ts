import { Collaborator } from "./collaborator";
import { DocumentType } from "./documentType";

export type CollaboratorDocumentRequirement = {
  id: string;
  collaboratorId: string;
  documentTypeId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  collaborator?: Collaborator;
  documentType?: DocumentType;
}