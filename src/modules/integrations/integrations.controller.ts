import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { IntegrationsService } from './integrations.service';

@Controller('organizations/:organizationId/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  list(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.integrationsService.listForOrganization(organizationId, user);
  }

  @Post()
  create(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.integrationsService.create(organizationId, user, dto);
  }
}
