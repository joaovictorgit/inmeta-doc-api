import { Body, Controller, HttpStatus, Logger, Post, Res } from "@nestjs/common";
import { CollaboratorsService } from "./collaborators.service";
import { ApiOperation } from "@nestjs/swagger";
import { CreateCollaboratorDto } from "./dto/create-collaborator.dto";
import type { Response } from "express";

@Controller("collaborator")
export class CollaboratorsController {
  private readonly logger = new Logger(CollaboratorsController.name);

  constructor (
    private collaboratorsService: CollaboratorsService
  ) {}

  @Post()
  @ApiOperation({ description: "Criando novo colaborador" })
  async createCollaborator(@Body() data: CreateCollaboratorDto, @Res() res: Response) {
    this.logger.log("Criando novo colaborador", data);

    const result = await this.collaboratorsService.create(data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Colaborador criado com sucesso!");

    return res.status(HttpStatus.CREATED).json(result.value);
  }
}