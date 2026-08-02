import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Res } from "@nestjs/common";
import { CollaboratorRequirementsService } from "./collaboratorRequirements.service";
import { ApiOperation } from "@nestjs/swagger";
import { CreateRequirementDto } from "./dto/create-requirement.dto";
import type { Response } from "express";
import { CreateBatchRequirementsDto } from "./dto/create-batchRequirements.dto";
import { DeleteRequirementDto } from "./dto/delete-requirement.dto";

@Controller("collaborator-requirements")
export class CollaboratorRequirementsController {
  private readonly logger = new Logger(CollaboratorRequirementsController.name);

  constructor (
    private collaboratorRequirementsService: CollaboratorRequirementsService
  ) {}

  @Post()
  @ApiOperation({ description: "Criando requerimento entre colaborador e tipo de documento" })
  async createAssign(@Body() data: CreateRequirementDto, @Res() res: Response) {
    this.logger.log("Criando requiremento: ", data);

    const result = await this.collaboratorRequirementsService.assign(data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Requiremento criado!");

    return res.status(HttpStatus.CREATED).json(result.value);
  }

  @Post("/batch")
  @ApiOperation({ description: "Criando múltiplos requirementos" })
  async createAssignBatch(@Body() data: CreateBatchRequirementsDto, @Res() res: Response) {
    this.logger.log("Criando requirementos: ", data);

    const result = await this.collaboratorRequirementsService.assignBatch(data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Requirementos criados!");

    return res.status(HttpStatus.CREATED).json(result.value);
  }

  @Get(":id")
  @ApiOperation({ description: "Retornando requerimentos pelo colaborador" })
  async findRequirements(@Param() param: { id: string }, @Res() res: Response) {
    this.logger.log("Buscando requerimentos pelo id do colaborador: ", param.id);

    const result = await this.collaboratorRequirementsService.findByCollaborator(param.id);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Requerimentos retornados!");

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Delete(":id")
  @ApiOperation({ description: "Removendo requerimento" })
  async deleteRequirement(@Param() params: DeleteRequirementDto, @Res() res: Response) {
    this.logger.log("Removendo requerimento: ", params);

    const result = await this.collaboratorRequirementsService.remove(params);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Requerimento deletado!");

    return res.status(HttpStatus.OK).json(result.value);
  }
}