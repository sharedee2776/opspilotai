import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  overview() {
    return this.adminService.getOverview();
  }

  @Get('organizations')
  organizations() {
    return this.adminService.listOrganizations();
  }

  @Get('organizations/:id')
  organizationDetail(@Param('id') id: string) {
    return this.adminService.getOrganizationDetail(id);
  }

  @Get('users')
  users() {
    return this.adminService.listUsers();
  }
}
