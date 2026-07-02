import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class AdminGuard implements CanActivate {
  private readonly adminEmail: string;

  constructor(config: ConfigService) {
    this.adminEmail = (config.get<string>('PLATFORM_ADMIN_EMAIL') ?? '').toLowerCase();
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const email = req.user?.email?.toLowerCase();

    if (!this.adminEmail || !email || email !== this.adminEmail) {
      throw new ForbiddenException('Platform admin access only');
    }

    return true;
  }
}
