import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Post, Put, Query, Res } from "@nestjs/common";
import { DocumentTypeService } from "./documentType.service";
import { ApiOperation } from "@nestjs/swagger";
import { CreateDocumentTypeDto } from "./dto/create-documentType.dto";
import type { Response } from "express";
import { ParamsDocumentType } from "./dto/params-documentType.dto";
import { UpdateDocumentTypeDto } from "./dto/update-documentType.dto";

@Controller("document-type")
export class DocumentTypeController {
  private readonly logger = new Logger(DocumentTypeController.name);

  constructor (
    private documentTypeService: DocumentTypeService
  ) {}

  @Post()
  @ApiOperation({ description: "Criando novo tipo de documento" })
  async createDocumentType(@Body() data: CreateDocumentTypeDto, @Res() res: Response) {
    this.logger.log("Criando novo tipo de documento", data);

    const result = await this.documentTypeService.create(data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Tipo de documento criado com sucesso!");

    return res.status(HttpStatus.CREATED).json(result.value);
  }

  @Get()
  @ApiOperation({ description : "Retornando lista de tipos de documento" })
  async findAllDocumentTypes(@Query() params: ParamsDocumentType, @Res() res: Response) {
    this.logger.log("Buscando tipos de documento");

    const result = await this.documentTypeService.findAll(params);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Retornando lista");

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Get(":id")
  @ApiOperation({ description: "Buscando tipo de documento pelo id" })
  async findDocumentTypeById(@Param() params: { id: string }, @Res() res: Response) {
    this.logger.log("Buscando tipo de documento pelo id: ", params.id);
  
    const result = await this.documentTypeService.findById(params.id);
  
    if (result.isError()) {
      this.logger.error(result.error.message);
  
      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }
  
    return res.status(HttpStatus.OK).json(result.value);
  }

  @Put(":id")
  @ApiOperation({ description: "Atualizando tipo de documento pelo id" })
  async updateDocumentTypeById(
    @Param() params: { id: string },
    @Body() data: UpdateDocumentTypeDto,
    @Res() res: Response
  ) {
    this.logger.log(`Atualizando tipo de documento ${params.id}: ${data}`);

    const result = await this.documentTypeService.updateById(params.id, data);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Dados do tipo de documento atualizados!");

    return res.status(HttpStatus.OK).json(result.value);
  }

  @Delete(":id")
  @ApiOperation({ description: "Deletando tipo de documento pelo id" })
  async deleteDocumentTypeById(@Param() params: { id: string }, @Res() res: Response) {
    this.logger.log("Deletar tipo de documento pelo id: ", params.id);

    const result = await this.documentTypeService.deleteById(params.id);

    if (result.isError()) {
      this.logger.error(result.error.message);

      return res.status(HttpStatus.BAD_REQUEST).json(result.error.message);
    }

    this.logger.log("Tipo de documento deletado!");

    return res.status(HttpStatus.OK).json(result.value);
  }
}