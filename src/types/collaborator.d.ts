export type Collaborator = {
  id: string;
  name: string;
  email: string;
  cpf: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}