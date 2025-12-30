import { createDefaultFormatter, Formatter } from '../../core/Formatter';
import { GoogleContact } from '../../types/Contact';
import { NamingStrategy } from '../../types/Settings';
import { FieldAdapter, KeyNamingStrategy } from '../../core/interfaces';

describe('Formatter', () => {
  describe('createDefaultFormatter', () => {
    it('should create a formatter with default strategy', () => {
      const formatter = createDefaultFormatter();
      expect(formatter).toBeInstanceOf(Formatter);
    });

    it('should create a formatter with VCF strategy', () => {
      const formatter = createDefaultFormatter(NamingStrategy.VCF);
      expect(formatter).toBeInstanceOf(Formatter);
    });
  });

  describe('generateFrontmatter', () => {
    let mockAdapter: FieldAdapter;
    let mockStrategy: KeyNamingStrategy;
    let formatter: Formatter;

    beforeEach(() => {
      mockAdapter = {
        extract: jest.fn().mockReturnValue([{ value: 'mockValue' }]),
      };
      mockStrategy = {
        generateKey: jest.fn().mockReturnValue('mockKey'),
      };
      formatter = new Formatter({ mockField: mockAdapter }, mockStrategy);
    });

    it('should generate frontmatter using adapters and strategy', () => {
      const contact = { resourceName: 'people/123' } as GoogleContact;
      const context = { some: 'context' };

      const result = formatter.generateFrontmatter(contact, 'prefix-', context);

      expect(mockAdapter.extract).toHaveBeenCalledWith(
        contact,
        expect.objectContaining(context)
      );
      expect(mockStrategy.generateKey).toHaveBeenCalledWith(
        'mockField',
        0,
        'prefix-',
        undefined
      );
      expect(result).toEqual({ mockKey: 'mockValue' });
    });

    it('should handle multiple results from adapter', () => {
      mockAdapter.extract = jest.fn().mockReturnValue([
        { value: 'val1', index: 0 },
        { value: 'val2', index: 1 },
      ]);
      mockStrategy.generateKey = jest
        .fn()
        .mockReturnValueOnce('key1')
        .mockReturnValueOnce('key2');

      const contact = {} as GoogleContact;
      const result = formatter.generateFrontmatter(contact, 'p-');

      expect(result).toEqual({ key1: 'val1', key2: 'val2' });
    });
  });
});
