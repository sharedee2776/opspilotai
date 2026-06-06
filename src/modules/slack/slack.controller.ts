import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';

@Controller('slack')
export class SlackController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', module: 'slack' };
  }
}
