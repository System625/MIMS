import { Body, Controller, Post } from '@nestjs/common';
import {
  joinWaitlistRequestSchema,
  type JoinWaitlistRequest,
  type WaitlistEntry,
} from '@mims/contracts';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { WaitlistService } from './waitlist.service';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Post()
  join(
    @Body(zodPipe(joinWaitlistRequestSchema)) body: JoinWaitlistRequest,
  ): Promise<WaitlistEntry> {
    return this.waitlist.join(body);
  }
}
