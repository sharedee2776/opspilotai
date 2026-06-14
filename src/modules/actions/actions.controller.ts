import { Controller, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ActionsService } from './actions.service';

@Controller()
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get('incidents/:incidentId/actions')
  listForIncident(
    @CurrentUser() user: AuthenticatedUser,
    @Param('incidentId') incidentId: string,
  ) {
    return this.actionsService.findForIncident(incidentId, user.organizationId);
  }

  @Get('actions/:id')
  async getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    const action = await this.actionsService.findById(id, user.organizationId);
    if (!action) {
      throw new NotFoundException('Action not found');
    }
    return action;
  }

  @Patch('actions/:id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.approve(id, user.organizationId);
  }

  @Patch('actions/:id/reject')
  reject(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.reject(id, user.organizationId);
  }

  @Post('actions/:id/execute')
  execute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.actionsService.execute(id, user.organizationId);
  }
}
