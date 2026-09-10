import { Body, Controller, Post } from '@nestjs/common';
import {
  decodeVinRequestSchema,
  type DecodeVinRequest,
  type VinDecodeResult,
} from '@mims/contracts';
import { zodPipe } from '../../common/pipes/zod-validation.pipe';
import { VinService } from './vin.service';

@Controller('vin')
export class VinController {
  constructor(private readonly vinService: VinService) {}

  /**
   * POST rather than GET: a VIN identifies a specific vehicle and should not sit
   * in URLs, proxy logs or browser history.
   */
  @Post('decode')
  decode(@Body(zodPipe(decodeVinRequestSchema)) body: DecodeVinRequest): Promise<VinDecodeResult> {
    return this.vinService.decode(body.vin);
  }
}
