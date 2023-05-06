
import {returnNotEmptyValue} from '..';
            
describe('testing returnNotEmptyValue()', () => {
    test('should omit empty values from the object', () => {
        const objWithEmptyValues = { a: '', b: 0, c: false }
        const expected = { b: 0, c: false }

        expect(returnNotEmptyValue(objWithEmptyValues)).toEqual(expected)
    })

    test('should omit empty values from the object containing nested objects', () => {
        const objWithEmptyValues = { a: '', b: 0, c: false, d: { e: null, f: true } }
        const expected = { b: 0, c: false, d: { f: true } }

        expect(returnNotEmptyValue(objWithEmptyValues)).toEqual(expected)
    })

    test('should gracefully handle empty objects', () => {
        const objWithEmptyValues = {}

        expect(returnNotEmptyValue(objWithEmptyValues)).toEqual({})
    })
})
            