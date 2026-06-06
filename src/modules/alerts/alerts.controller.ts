import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AlertsService } from './alerts.service';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  async create(@Body() payload: any) {
    return this.alertsService.create(payload);
  }

  @Get()
  async findAll() {
    return this.alertsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.alertsService.findById(id);
  }
}
