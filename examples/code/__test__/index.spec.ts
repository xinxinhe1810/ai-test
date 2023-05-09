
import {trimmedObjectValue, filterObject, getRedirectTarget, returnNotEmptyValue} from '..';

describe('trimmedObjectValue', () => {
    describe('When given an object', () => {
        test('it should trim values on the object and return the trimmed object', () => {
            const obj = {
                a: ' 123 ',
                b: 'foobar ',
            };
            const expectedResult = {
                a: '123',
                b: 'foobar',
            };

            expect(trimmedObjectValue(obj)).toEqual(expectedResult);
        });

        test('it should trim only specified keys if the optionalKeys param is provided', () => {
            const obj = {
                a: ' 123 ',
                b: 'foobar ',
            };
            const optionalKeys = ['a'];
            const expectedResult = {
                a: '123',
                b: 'foobar ',
            };

            expect(trimmedObjectValue(obj, optionalKeys)).toEqual(expectedResult);
        });
    });

    describe('When given an invalid input', () => {
        test('it should return the unmodified object', () => {
            const input = 1;
            const expectedResult = 1;

            expect(trimmedObjectValue(input)).toEqual(expectedResult);
        });
    });
});

// Write your Jest unit test for filterObject here
describe('filterObject', () => {
    // Test a successful case
    test('success - returns a partial object of the results that fulfilled the filterHandle conditions', () => {
        const obj = {
            a: 'a',
            b: 'b',
            c: 'c',
        };
        const filterHandle = (key, value) => value === 'b';
        const expectedResult = {
            b: 'b',
        };
        expect(filterObject(obj, filterHandle)).toEqual(expectedResult);
    });

    // Test a failing case
    test('failed - throws an error when a non-object is passed as argument', () => {
        const obj = 'string';
        const filterHandle = (key, value) => true;
        expect(() => filterObject(obj, filterHandle)).toThrowError(
            'filterObject 传入的数据类型需要为 Object'
        );
    });

    // Test boundary conditions
    test('boundary - returns an empty object if all the key-values do not match the filterHandle conditions', () => {
        const obj = {
            a: 1,
            b: 2,
            c: 3,
        };
        const filterHandle = (key, value) => false;
        const expectedResult = {};
        expect(filterObject(obj, filterHandle)).toEqual(expectedResult);
    });
});




// Jest test code
describe('getRedirectTarget()', () => {
    let mockLocation: Location;

    beforeEach(() => {
        // Mocking location
        mockLocation = {
            pathname: '/',
            search: '',
            host: 'example.com',
        };

        // Replace window.location with the mock
        delete window.location;
        (window as any).location = mockLocation;
    });

    afterEach(() => {
        // Reset window.location to its original value
        (window as any).location = window.location;
    });

    it('should return the redirect param value when presennt', () => {
        // Set up url with redirect param
        mockLocation.search = '?redirect=/redirect-url';

        expect(getRedirectTarget()).toBe('/redirect-url');
        expect(getRedirectTarget(true)).toBe('example.com/redirect-url');
    });

    it('should return "/" if on login page', () => {
        // Set up url to login page
        mockLocation.pathname = '/login';

        expect(getRedirectTarget()).toBe('/');
        expect(getRedirectTarget(true)).toBe('example.com/');
    });


    it('should return the same location when no redirect param present and not on login page', () => {
        // Set up url to non-login page and no redirect param
        mockLocation.pathname = '/user';
        mockLocation.search = '';

        expect(getRedirectTarget()).toBe('/user');
        expect(getRedirectTarget(true)).toBe('example.com/user');
    });
});



describe('returnNotEmptyValue()', () => {
    it('should maintain object with only string values that do not match the empty values array', () => {
    // arrange
        const params = {one: '1', two: '2', three: '', four: '   '};
        const emptyValues = ['2', '', '   '];

        // act
        const result = returnNotEmptyValue(params, emptyValues);

        // assert
        expect(result).toEqual({one: '1'});
    });

    it('should maintain object with only non-string values that do not match the empty values array', () => {
    // arrange
        const params = {one: '1', two: 2, three: null, four: 0};
        const emptyValues = ['1', 2, null, ''];

        // act
        const result = returnNotEmptyValue(params, emptyValues);

        // assert
        expect(result).toEqual({four: 0});
    });

    it('should maintain object with mixture of string and non-string values that do not match the empty values array', () => {
    // arrange
        const params = {one: '1', two: 2, three: '', four: 4};
        const emptyValues = ['2', '', 0];

        // act
        const result = returnNotEmptyValue(params, emptyValues);

        // assert
        expect(result).toEqual({one: '1', four: 4, two: 2});
    });

    it('should filter out values that match empty values passed in', () => {
    // arrange
        const params = {one: '1', two: '2', three: '', four: ''};
        const emptyValues = ['2', '', '4'];

        // act
        const result = returnNotEmptyValue(params, emptyValues);

        // assert
        expect(result).toEqual({one: '1'});
    });

    it('should filter out values that match empty values passed in', () => {
    // arrange
        const params = {one: '1', two: '2', three: '', four: 4};
        const emptyValues = ['2', '', 4];

        // act
        const result = returnNotEmptyValue(params, emptyValues);

        // assert
        expect(result).toEqual({one: '1'});
    });
});