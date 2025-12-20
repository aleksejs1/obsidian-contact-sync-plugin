import { FieldAdapter, ExtractionResult } from '../interfaces';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from 'src/types/Settings';

export class AddressAdapter implements FieldAdapter {
  extract(
    contact: GoogleContact,
    context?: Record<string, unknown>
  ): ExtractionResult[] {
    const addresses = contact.addresses || [];
    if (addresses.length === 0) return [];

    // Check if we're using VCF strategy
    const isVcfStrategy =
      context?.namingStrategy === NamingStrategy.VCF ||
      context?.namingStrategy === 'VCF';

    if (isVcfStrategy) {
      // For VCF strategy, return subfields
      const results: ExtractionResult[] = [];
      addresses.forEach((addr, addrIndex) => {
        // Add each subfield as a separate result
        // All subfields of the same address get the same index
        if (addr.streetAddress) {
          results.push({
            value: addr.streetAddress,
            suffix: 'STREET',
            index: addrIndex,
          });
        }
        if (addr.city) {
          results.push({ value: addr.city, suffix: 'CITY', index: addrIndex });
        }
        if (addr.country) {
          results.push({
            value: addr.country,
            suffix: 'COUNTRY',
            index: addrIndex,
          });
        }
        if (addr.postalCode) {
          results.push({
            value: addr.postalCode,
            suffix: 'POSTALCODE',
            index: addrIndex,
          });
        }
        if (addr.extendedAddress) {
          results.push({
            value: addr.extendedAddress,
            suffix: 'EXTENDED',
            index: addrIndex,
          });
        }
        if (addr.formattedType) {
          results.push({
            value: addr.formattedType,
            suffix: 'TYPE',
            index: addrIndex,
          });
        }
      });

      return results;
    } else {
      // For Default strategy, return formattedValue as before
      return addresses
        .filter((item) => item.formattedValue)
        .map((item) => ({ value: item.formattedValue }));
    }
  }
}
