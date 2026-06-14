import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActionEntity } from '../../common/entities/action.entity';
import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';

@Module({
  imports: [TypeOrmModule.forFeature([ActionEntity])],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
