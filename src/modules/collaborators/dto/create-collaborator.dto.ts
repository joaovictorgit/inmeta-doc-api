import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateCollaboratorDto {
  @ApiProperty({
    description: "Nome do colaborador"
  })
  @IsString()
  @IsNotEmpty({ message: "O nome é um campo obrigatório" })
  name!: string;

  @ApiProperty({
    description: "E-mail do colaborador"
  })
  @IsString()
  @IsEmail()
  @IsNotEmpty({ message: "O e-mail é um campo obrigatório" })
  email!: string;

  @ApiProperty({
    description: "CPF do colaborador"
  })
  @IsString()
  @IsNotEmpty({ message: "O cpf é um campo obrigatório" })
  cpf!: string;
}