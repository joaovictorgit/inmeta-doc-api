import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ParamsCollaborator {
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
}