import { Module } from '@nestjs/common';
import { NARRATOR } from './narration.types';
import { TemplateNarrator } from './template.narrator';

/**
 * Swapping in an LLM narrator later means changing `useClass` here and nothing
 * else. The `Narrator` interface is the seam, and `NarrationFacts` is the only
 * thing that crosses it.
 */
@Module({
  providers: [{ provide: NARRATOR, useClass: TemplateNarrator }],
  exports: [NARRATOR],
})
export class NarrationModule {}
