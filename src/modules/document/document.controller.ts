import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Put, Post, Res } from "@nestjs/common";
import { DocumentService } from "./document.service";
import { ApiOperation } from "@nestjs/swagger";
import { SubmitDocumentDto } from "./dto/submit-document.dto";
import type { Response } from "express";
import { UpdateDocumentStatusDto } from "./dto/update-documentStatus.dto";

@Controller("document")
export class DocumentController {
  private readonly logger = new Logger(DocumentController.name);

  constructor(
    private documentService: DocumentService
  ) {}

  @Post()
  @ApiOperation({ description: "Enviando nova versão de um documento" })
  async submitDocument(@Body() data: SubmitDocumentDto, @Res() res: Response) {
    this.logger.log("Enviando novo documento", data);

    const result = await this.documentService.submitDocument(data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Documento enviado com sucesso!");

    return res.status(HttpStatus.CREATED).json(result.value);
  }

  @Put(":id/status")
  @ApiOperation({ description: "Atualizando status do documento (Aprovação / Rejeição)" })
  async updateStatus(
    @Param() params: { id: string },
    @Body() data: UpdateDocumentStatusDto,
    @Res() res: Response
  ) {
    this.logger.log(`Atualizando status do documento ${params.id}`, data);

    const result = await this.documentService.updateStatus(params.id, data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Status do documento atualizado com sucesso!");

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Get("collaborator/:collaboratorId/latest")
  @ApiOperation({ description: "Buscando documentos mais recentes (vigentes) do colaborador" })
  async findLatestByCollaborator(
    @Param() params: { collaboratorId: string },
    @Res() res: Response
  ) {
    this.logger.log("Buscando documentos vigentes do colaborador: ", params.collaboratorId);

    const result = await this.documentService.findLatestByCollaborator(params.collaboratorId);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Get("collaborator/:collaboratorId/type/:documentTypeId/history")
  @ApiOperation({ description: "Buscando histórico de versões de um documento do colaborador" })
  async findHistory(
    @Param() params: { collaboratorId: string; documentTypeId: string },
    @Res() res: Response
  ) {
    this.logger.log(
      `Buscando histórico do documento ${params.documentTypeId} do colaborador ${params.collaboratorId}`
    );

    const result = await this.documentService.findHistory(
      params.collaboratorId,
      params.documentTypeId
    );

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Get("collaborator/:collaboratorId/status-report")
  @ApiOperation({ description: "Retornando relatório consolidado de documentos do colaborador (Exigidos vs Enviados)" })
  async getCollaboratorDocumentStatus(
    @Param() params: { collaboratorId: string },
    @Res() res: Response
  ) {
    this.logger.log("Gerando relatório de status dos documentos do colaborador: ", params.collaboratorId);

    const result = await this.documentService.getCollaboratorDocumentStatus(params.collaboratorId);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Delete(":id")
  @ApiOperation({ description: "Deletando documento pelo id (soft delete)" })
  async deleteDocument(@Param() params: { id: string }, @Res() res: Response) {
    this.logger.log("Deletando documento pelo id: ", params.id);

    const result = await this.documentService.delete(params.id);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Documento deletado com sucesso!");

    return res.status(HttpStatus.OK).json(result.value);
  }
}