import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from 'src/types/Settings';

export class AddressAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const addresses = contact.addresses ?? [];
    if (addresses.length === 0) {
      return [];
    }

    const isVcfStrategy = context?.namingStrategy === NamingStrategy.VCF;

    const typeCounts: Record<string, number> = {};
    const processType = (typeStr?: string) => {
      let normalizedType = (typeStr ?? 'other').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normalizedType) {
        normalizedType = 'other';
      }
      const currentCount = typeCounts[normalizedType] ?? 0;
      typeCounts[normalizedType] = currentCount + 1;
      return { type: normalizedType, index: currentCount };
    };

    if (isVcfStrategy) {
      // For VCF strategy, return subfields
      const results: ExtractionResult[] = [];
      addresses.forEach((addr, addrIndex) => {
        const typeInfo = context.useContactTypes
          ? processType(addr.type)
          : undefined;
        const derivedIndex = typeInfo ? typeInfo.index : addrIndex;
        const derivedType = typeInfo ? typeInfo.type : undefined;

        const addResult = (subfield: string, suffix: string) => {
          const result: ExtractionResult = {
            value: subfield,
            suffix,
            index: derivedIndex,
          };
          if (derivedType !== undefined) {
            result.type = derivedType;
          }
          results.push(result);
        };

        const fields = [
          { value: addr.streetAddress, suffix: 'STREET' },
          { value: addr.city, suffix: 'CITY' },
          { value: addr.region, suffix: 'REGION' },
          { value: addr.country, suffix: 'COUNTRY' },
          { value: addr.postalCode, suffix: 'POSTALCODE' },
          { value: addr.extendedAddress, suffix: 'EXTENDED' },
          { value: addr.formattedType, suffix: 'TYPE' },
        ];

        for (const field of fields) {
          if (field.value) {
            addResult(field.value, field.suffix);
          }
        }
      });

      return results;
    }

    const validAddresses = addresses.filter((item) => item.formattedValue);
    if (validAddresses.length === 0) {
      return [];
    }

    if (context?.namingStrategy === NamingStrategy.Array) {
      return this.extractForArrayStrategy(validAddresses);
    }

    if (context?.useContactTypes === true) {
      return this.extractWithSemanticTypes(validAddresses);
    }

    return validAddresses.map((item) => ({ value: item.formattedValue }));
  }

  private extractForArrayStrategy(
    validAddresses: { formattedValue: string; type?: string }[]
  ): ExtractionResult[] {
    const first = validAddresses[0]?.formattedValue;
    const allValues = validAddresses.map((item) => item.formattedValue);
    return [
      {
        value: allValues.length === 1 && first ? first : allValues,
      },
    ];
  }

  private extractWithSemanticTypes(
    validAddresses: { formattedValue: string; type?: string }[]
  ): ExtractionResult[] {
    const typeCounts: Record<string, number> = {};
    const results: ExtractionResult[] = [];

    for (const item of validAddresses) {
      let normalizedType = (item.type ?? 'other').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normalizedType) {
        normalizedType = 'other';
      }

      const currentCount = typeCounts[normalizedType] ?? 0;
      typeCounts[normalizedType] = currentCount + 1;

      results.push({
        value: item.formattedValue,
        type: normalizedType,
        index: currentCount,
      });
    }

    return results;
  }
}
