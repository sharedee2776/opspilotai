import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AddMemberDto } from './dto/add-member.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationsService.listForUser(user.userId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.createOrganization(user, dto);
  }

  @Patch(':organizationId/settings')
  updateSettings(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.organizationsService.updateSettings(organizationId, user, dto);
  }

  @Get(':organizationId/members')
  listMembers(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.listMembers(organizationId, user);
  }

  @Post(':organizationId/members')
  addMember(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizationsService.addMember(organizationId, user, dto);
  }

  @Delete(':organizationId/members/:userId')
  removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.removeMember(organizationId, userId, user);
  }

  @Get(':organizationId/teams')
  listTeams(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.organizationsService.listTeams(organizationId, user);
  }

  @Post(':organizationId/teams')
  createTeam(
    @Param('organizationId') organizationId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTeamDto,
  ) {
    return this.organizationsService.createTeam(organizationId, user, dto);
  }

  @Post(':organizationId/teams/:teamId/members')
  addTeamMember(
    @Param('organizationId') organizationId: string,
    @Param('teamId') teamId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddTeamMemberDto,
  ) {
    return this.organizationsService.addTeamMember(organizationId, teamId, user, dto);
  }
}
