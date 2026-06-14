import { exec } from 'child_process';
import { promisify } from 'util';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActionEntity, ActionStatus } from '../../common/entities/action.entity';
import { SuggestedFix } from '../ai/ai.service';

const execAsync = promisify(exec);
const EXECUTION_TIMEOUT_MS = 30_000;

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(
    @InjectRepository(ActionEntity)
    private readonly actionRepository: Repository<ActionEntity>,
  ) {}

  async createFromSuggestions(
    incidentId: string,
    organizationId: string,
    fixes: SuggestedFix[],
  ): Promise<ActionEntity[]> {
    if (!fixes.length) {
      return [];
    }

    const entities = fixes.map((fix) =>
      this.actionRepository.create({
        incidentId,
        organizationId,
        name: fix.name,
        type: fix.type,
        command: fix.command,
        riskLevel: fix.riskLevel,
        status: ActionStatus.SUGGESTED,
      }),
    );

    return this.actionRepository.save(entities);
  }

  async findForIncident(incidentId: string, organizationId: string): Promise<ActionEntity[]> {
    return this.actionRepository.find({
      where: { incidentId, organizationId },
      order: { createdAt: 'ASC' },
    });
  }

  async findById(id: string, organizationId: string): Promise<ActionEntity | null> {
    return this.actionRepository.findOne({ where: { id, organizationId } });
  }

  async approve(id: string, organizationId: string): Promise<ActionEntity> {
    const action = await this.requireById(id, organizationId);
    if (action.status !== ActionStatus.SUGGESTED) {
      throw new BadRequestException(`Action must be in 'suggested' state to approve (current: ${action.status})`);
    }

    action.status = ActionStatus.APPROVED;
    return this.actionRepository.save(action);
  }

  async reject(id: string, organizationId: string): Promise<ActionEntity> {
    const action = await this.requireById(id, organizationId);
    if (![ActionStatus.SUGGESTED, ActionStatus.APPROVED].includes(action.status)) {
      throw new BadRequestException(`Action cannot be rejected from state: ${action.status}`);
    }

    action.status = ActionStatus.FAILED;
    return this.actionRepository.save(action);
  }

  async execute(id: string, organizationId: string): Promise<ActionEntity> {
    const action = await this.requireById(id, organizationId);

    if (action.status !== ActionStatus.APPROVED) {
      throw new BadRequestException(`Action must be approved before execution (current: ${action.status})`);
    }

    if (!action.command?.trim()) {
      throw new BadRequestException('Action has no command to execute');
    }

    action.status = ActionStatus.EXECUTING;
    await this.actionRepository.save(action);

    try {
      this.logger.log(`Executing action ${action.id} (${action.name}): ${action.command}`);
      await execAsync(action.command, { timeout: EXECUTION_TIMEOUT_MS });
      action.status = ActionStatus.SUCCESS;
      this.logger.log(`Action ${action.id} completed successfully`);
    } catch (error) {
      action.status = ActionStatus.FAILED;
      this.logger.error(`Action ${action.id} failed: ${error instanceof Error ? error.message : error}`);
    }

    return this.actionRepository.save(action);
  }

  private async requireById(id: string, organizationId: string): Promise<ActionEntity> {
    const action = await this.findById(id, organizationId);
    if (!action) {
      throw new NotFoundException('Action not found');
    }
    return action;
  }
}
