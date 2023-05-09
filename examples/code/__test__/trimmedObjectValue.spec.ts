
import {trimmedObjectValue} from '..';


// Jest unit test:
describe('trimmedObjectValue()', () => {
    test('trims a single string field of an object when optionalKeys is defined', () => {
        const testObject = {
            firstName: 'John ',
            lastName: 'Doe',
        };
        const expectedObject = {
            firstName: 'John',
            lastName: 'Doe',
        };

        const keyArray = ['firstName'];
        expect(trimmedObjectValue(testObject, keyArray)).toEqual(expectedObject);
    });

    test('trims all string fields of an object when optionalKeys is not defined', () => {
        const testObject = {
            firstName: 'John ',
            lastName: ' Doe  ',
        };
        const expectedObject = {
            firstName: 'John',
            lastName: 'Doe',
        };

        expect(trimmedObjectValue(testObject)).toEqual(expectedObject);
    });

    test('returns an unchanged object when all non-string fields', () => {
        const testObject = {
            firstName: 42,
            lastName: true,
        };
        const expectedObject = {
            firstName: 42,
            lastName: true,
        };

        expect(trimmedObjectValue(testObject)).toEqual(expectedObject);
    });

    test('returns an empty object when not passed an object', () => {
        const testObject = 'John Doe';

        expect(trimmedObjectValue(testObject)).toEqual({});
    });

});
