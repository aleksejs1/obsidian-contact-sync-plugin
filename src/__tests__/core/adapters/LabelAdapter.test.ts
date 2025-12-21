import { LabelAdapter } from '../../../core/adapters/LabelAdapter';
import { GoogleContact } from '../../../types/Contact';

describe('LabelAdapter', () => {
  const adapter = new LabelAdapter();
  const labelMap = { group1: 'Friends', group2: 'Family' };

  const contactWithLabels: GoogleContact = {
    resourceName: 'people/lbl',
    memberships: [
      { contactGroupMembership: { contactGroupId: 'group1' } },
      { contactGroupMembership: { contactGroupId: 'group2' } },
    ],
  };

  it('extracts labels as an array for default strategy', () => {
    const results = adapter.extract(contactWithLabels, { labelMap });
    expect(results).toHaveLength(1);
    expect(results[0]!.value).toEqual(['Friends', 'Family']);
  });

  it('extracts labels as a comma-separated string for VCF strategy', () => {
    const results = adapter.extract(contactWithLabels, {
      labelMap,
      namingStrategy: 'VCF',
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.value).toBe('Friends, Family');
  });

  it('returns empty array if no labels or labelMap', () => {
    expect(adapter.extract({ resourceName: 'p1' })).toEqual([]);
    expect(adapter.extract(contactWithLabels, { labelMap: {} })).toEqual([]);
  });
});
