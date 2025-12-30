import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from 'src/types/Settings';

export class RelationsAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const relationsAsLink = context?.relationsAsLink as boolean;
    const isVcfStrategy = context?.namingStrategy === NamingStrategy.VCF;
    return (contact.relations ?? [])
      .filter((relation) => !!relation.person)
      .map((relation) => ({
        // For VCF strategy, don't use wiki links even if organizationsAsLink is true
        value:
          relationsAsLink && !isVcfStrategy
            ? `[[${relation.person}|${relation.person} (${relation.type})]]`
            : `${relation.person} (${relation.type})`,
      }));
  }
}
