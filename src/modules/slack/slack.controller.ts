import { Controller, Get } from '@nestjs/common';

@Controller('slack')
export class SlackController {
  @Get('health')
  health() {
    return { status: 'ok', module: 'slack' };
  }
}
