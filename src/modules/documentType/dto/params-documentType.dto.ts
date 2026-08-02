import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ParamsDocumentType {
  @ApiProperty({
    description: "Página atual"
  })
  @IsString()
  @IsNotEmpty({ message: "Campo página é obrigatório!" })
  page!: string;

  @ApiProperty({
    description: "Limite por página"
  })
  @IsString()
  @IsNotEmpty({ message: "Campo limite é obrigatório!" })
  limit!: string;

  @ApiProperty({
    description: "Filtro por nome"
  })
  @IsString()
  @IsOptional()
  name?: string;
}