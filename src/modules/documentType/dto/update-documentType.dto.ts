import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateDocumentTypeDto {
  @ApiProperty({
    description: "Nome do tipo de documento"
  })
  @IsString()
  @IsNotEmpty({ message: "O nome do tipo de documento é um campo obrigatório" })
  name!: string;

  @ApiProperty({
    description: "Descrição do tipo de documento"
  })
  @IsString()
  @IsOptional()
  description?: string;
}