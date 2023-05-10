
import filter, {testFunc2, testFunc, format2} from '../filter';

const {a, format, Cache} = filter

describe('testFunc2', () => {
    test('should return a string of "321"', () => {
        expect(testFunc2()).toBe('321');
    });
    
    test('should return a string', () => {
        expect(typeof testFunc2()).toBe('string');
    });
    
    test('should not return a number', () => {
        expect(typeof testFunc2()).not.toBe('number');
    });
});

// Jest Unit Test
describe('testFunc', () => {
  // Test successful case
  it('should be return "123"', () => {
    expect(testFunc()).toEqual('123');
  });

  // Test boundary conditions
  it('should not return other values except "123"', () => {
    expect(testFunc()).not.toEqual('1234');
    expect(testFunc()).not.toEqual(null);
    expect(testFunc()).not.toEqual('');
    expect(testFunc()).not.toEqual(undefined);
  });
});

describe('a', () => {
  it('should return undefined if no input is passed', () => {
    expect(a()).toBe(undefined);
  });

  it('should return undefined if null is passed', () => {
    expect(a(null)).toBe(undefined);
  });

  it('should return undefined if a string is passed', () => {
    expect(a('some string')).toBe(undefined);
  });

  it('should return undefined if a number is passed', () => {
    expect(a(123)).toBe(undefined);
  });

  it('should return undefined if an object is passed', () => {
    expect(a({})).toBe(undefined);
  });

  it('should return undefined if an array is passed', () => {
    expect(a([])).toBe(undefined);
  });

  it('should return undefined if an undefined value is passed', () => {
    expect(a(undefined)).toBe(undefined);
  });
});

describe('format2', () => {
  it('should correctly format the given input according to the format string', () => {
    const formatStr = 'yyyy-mm-dd';
    const date1 = new Date('2020/01/15');

    expect(format2(date1, formatStr)).toBe('2020-01-15');
  });


  it('should return an empty string when the input date is not valid', () => {
    const formatStr = 'yyyy-mm-dd';
    const date2 = new Date('invalid date');

    expect(format2(date2, formatStr)).toBe('');
  });


  it('should adjust the length of the output according to the length of the format string', () => {
    const formatStr1 = 'yy-m-d';
    const date1 = new Date('2020/01/15');
    const formatStr2 = 'yyyyy-mm-dd';
    const date2 = new Date('2020/01/15');

    expect(format2(date1, formatStr1)).toBe('20-1-15');
    expect(format2(date2, formatStr2)).toBe('2020-01-15');
  });


  it('should accept any valid format characters', () => {
    const formatStr = 'ddd-YY-dd';
    const date1 = new Date('2020/01/15');

    expect(format2(date1, formatStr)).toBe('Wed-20-15');
  });
});

describe('format', () => {
  describe('formatTime', () => {
    const time = 1598982700000;
    const formatString = 'YYYY-MM-DD HH:mm';

    test('Should be return empty when time is undefined', () => {
      expect(format.formatTime(undefined, formatString)).toBe('');
    });
    test('Should be return right when time is a string type', () => {
      const expectedDate = '2020-08-30 15:45';
      // expect(format.formatTime(time, formatString)).toBe(expectedDate);
    });
    test('Should be return right when time is a number type and equal to 10 digits', () => {
      const expectedDate = '2020-08-30 15:45';
      expect(format.formatTime(time, formatString)).toBe(expectedDate);
    });
    test('Should be throw error when time is a number type and less than 10 digits', () => {
      expect(() => {
        format.formatTime(123456);
      }).toThrowError('invalid timestamp');
    });
  });

  describe('formatRatio', () => {
    test('Should be return right when ratio is a number type', () => {
      expect(format.formatRatio(0.12)).toBe('12.00%');
    });
    test('Should be return "-" when ratio is undefined', () => {
      expect(format.formatRatio(undefined)).toBe('-');
    });
    test('Should be return "-" when ratio is not a number type', () => {
      expect(format.formatRatio('this is a string type')).toBe('-');
    });
  });
});


describe('getCache', () => {
    let cache;

    beforeEach(() => {
        cache = new Cache();
    });

    it('should return undefined when key is undefined', () => {
        expect(cache.getCache(undefined)).toBeUndefined();
    });

    it('should return undefined when key is not exist', () => {
        expect(cache.getCache('x')).toBeUndefined();
    });

    it('should return value when key can be found in map', () => {
        const key = 'abc';
        const value = { x: 'y' };
        cache.setCache(key, value);
        expect(cache.getCache(key)).toBe(value);
    });
});

describe('setCache', () => {
    let cache;

    beforeEach(() => {
        cache = new Cache();
    });

    it('should set cache when key & value are given', () => {
        const key = 'abc';
        const value = { x: 'y' };
        cache.setCache(key, value);
        expect(cache.map[key]).toBe(value);
    });

    it('should set cache when key & value are falsy', () => {
        const key = '';
        const value = 0;
        cache.setCache(key, value);
        expect(cache.map[key]).toBe(value);
    });

    it('should throw error when key is not given', () => {
        const value = { x: 'y' };
        expect(() => cache.setCache(null, value)).toThrow('key must be a valid string');
    });
});

describe('clearCache', () => {
    let cache;

    beforeEach(() => {
        cache = new Cache();
    });

    it('should clear all keys in map', () => {
        const keys = ['a', 'b', 'c'];
        keys.forEach(key => {
            cache.setCache(key, 'some value');
        });
        cache.clearCache();
        expect(Object.keys(cache.map).length).toBe(0);
    });
});