import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, Query, Res } from "@nestjs/common";
import { CollaboratorsService } from "./collaborators.service";
import { ApiOperation, ApiProperty } from "@nestjs/swagger";
import { CreateCollaboratorDto } from "./dto/create-collaborator.dto";
import type { Response } from "express";
import { UpdateCollaboratorDto } from "./dto/update-collaborator.dto";
import { ParamsCollaborator } from "./dto/params-collaborator.dto";

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

  @Get()
  @ApiOperation({ description: "Retornando lista de colaboradores" })
  async findAllCollaborators(@Query() params: ParamsCollaborator, @Res() res: Response) {
    this.logger.log("Buscando os colaboradores");

    const result = await this.collaboratorsService.findAll(params);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Retornando lista");

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Get(":id")
  @ApiOperation({ description: "Buscando colaborador pelo id" })
  async findCollaboratorById(@Param() params: { id: string }, @Res() res: Response) {
    this.logger.log("Buscando colaborado pelo id: ", params.id);

    const result = await this.collaboratorsService.findById(params.id);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Put(":id")
  @ApiOperation({ description: "Atualizando colaborador pelo id" })
  async updateCollaboratorById(
    @Param() params: { id: string },
    @Body() data: UpdateCollaboratorDto,
    @Res() res: Response
  ) {
    this.logger.log(`Atualizando colaborador ${params.id}: ${data}`);

    const result = await this.collaboratorsService.updateById(params.id, data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Dados do colaborador atualizados!");

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Delete(":id")
  @ApiOperation({ description: "Deletando colaborador pelo id" })
  async deleteCollaboratorById(@Param() params: { id: string }, @Res() res: Response) {
    this.logger.log("Deletar colaborador pelo id: ", params.id);

    const result = await this.collaboratorsService.deleteById(params.id);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Colaborador deletado!");

    return res.status(HttpStatus.OK).json(result.value);
  }
}