import { Controller, Get } from '@nestjs/common';
import type { DamageZone } from '@mims/contracts';
import { ZonesService } from './zones.service';

@Controller('zones')
export class ZonesController {
  constructor(private readonly zones: ZonesService) {}

  @Get()
  list(): Promise<DamageZone[]> {
    return this.zones.list();
  }
}
