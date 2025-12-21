
import { AddressAdapter } from './src/core/adapters/AddressAdapter';
import { GoogleContact } from './src/types/Contact';
import { NamingStrategy } from './src/types/Settings';

// Mock context that mimics Formatter.ts behavior
class VcfNamingStrategy { }

const context = {
    namingStrategy: VcfNamingStrategy.name // 'VcfNamingStrategy'
};

const adapter = new AddressAdapter();
const contact: GoogleContact = {
    resourceName: 'test',
    addresses: [{
        streetAddress: 'Salaspils iela 18',
        city: 'Riga',
        formattedValue: 'Salaspils iela 18\nRiga'
    }]
};

console.log('Testing with context:', context);
const result = adapter.extract(contact, context);
console.log('Result:', JSON.stringify(result, null, 2));

// Check if it matches expectation
const isCorrect = result.some(r => r.suffix === 'STREET');
console.log('Is Correct (Split fields):', isCorrect);

if (!isCorrect && result.length > 0 && result[0].value.includes('\n')) {
    console.log('BUG CONFIRMED: Returned single formatted string instead of split fields.');
}
