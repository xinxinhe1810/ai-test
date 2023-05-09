
import {filterObject} from '..';

describe('filterObject', () => {
    it('should create a new object based on the original object', () => {
        const initialObj = {name: 'John', age: 32};
        const filterHandle = (key, value) => typeof value !== 'string';
        const expectedObj = {age: 32};
        const newObj = filterObject(initialObj, filterHandle);
        expect(newObj).toEqual(expectedObj);
    });

    it('should throw an error when the passed parameter is not an object', () => {
        expect(() => {
            filterObject('string', (key, value) => true);
        }).toThrowError('filterObject 传入的数据类型需要为 Object');
    });
});
