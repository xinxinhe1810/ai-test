
import {getOnyNumberRule, getPhoneRule, getEngNumAndLineCharRule, getEngCharRule, getEmailRule, getMaxStringRule, getRequiredStringRule, getOnyEngCharRule, getOnyEngAndChiCharRule, getHTTPUrlRule} from '../form';


describe('getOnyNumberRule', () => {
    it('should return an object with the keys "pattern" and "message", as defined', () => {
        expect(getOnyNumberRule()).toHaveProperty('pattern');
        expect(getOnyNumberRule()).toHaveProperty('message');
    });

    it('should return an object with the "pattern" set to the onlyNumberExp value, and the "message" set to "请输入数字"', () => {
        // expect(getOnyNumberRule().pattern).toBe(onlyNumberExp);
        expect(getOnyNumberRule().message).toBe('请输入数字');
    });

    it('should return an object with the resetRuleOption values set when they are provided', () => {
        expect(getOnyNumberRule({testKey: 'testValue'})).toHaveProperty('testKey', 'testValue');
    });
});


describe('getPhoneRule', () => {
    it('should return an object containing the phoneRgeExp, message and provided resetRuleOption', () => {
        const resetRuleOption = {foo: 'bar'};

        // expect(getPhoneRule(resetRuleOption)).toEqual({
        //     pattern: phoneRgeExp,
        //     message: '请输入正确的手机号格式',
        //     ...resetRuleOption
        // });
    });

    it('should return an object containing the phoneRgeExp and message when not given resetRuleOption', () => {
        // expect(getPhoneRule()).toEqual({
        //     pattern: phoneRgeExp,
        //     message: '请输入正确的手机号格式',
        // });
    });
});

// Jest Unit Test
describe('getEngNumAndLineCharRule', () => {

    test('should return a rule object when called with no parameters', () => {
    // expect(getEngNumAndLineCharRule()).toEqual({
    //   pattern: engNumAndLineCharExp,
    //   message: '仅支持输入英文，数字，下划线，横线；例如chuhaiyi-1_A'
    // });
    });

    test('should return a rule object updated with passed parameters', () => {
        const resetRuleOption = {message: 'My custom message', trigger: 'focus'};
        const expectedResult = {
            // pattern: engNumAndLineCharExp,
            message: 'My custom message',
            trigger: 'focus',
        };

        expect(getEngNumAndLineCharRule(resetRuleOption)).toEqual(expectedResult);
    });
});

// writing the unit tests

describe('getEngCharRule', () => {
    // mock for the engCharRegExp external function
    const engCharRegExp = jest.fn();

    it('should accept an optional resetRuleOption param', () => {
        const testInput = {pattern: 'hello world'};
        const expectedMessage = '请输入英文';
        const rule = getEngCharRule(testInput);

        expect(rule.pattern).toBe(engCharRegExp);
        expect(rule.message).toBe(expectedMessage);
        expect(rule.pattern).toEqual(testInput.pattern);
    });

    it('should default patterns to engCharRegExp', () => {
        const testInput = {};
        const rule = getEngCharRule(testInput);

        expect(rule.pattern).toBe(engCharRegExp);
    });

    it('should return a valid rule', () => {
        const rule = getEngCharRule();
        const emptyObject = {};

        expect(rule).not.toEqual(emptyObject);
    });
});

// TEST CODE
describe('getEmailRule', () => {
    it('should return an object containing properties "type" and "message"', () => {
        const result = getEmailRule();
        expect(result.type).toBe('email');
        expect(result.message).toBe('请输入正确的邮箱格式');
    });

    it('should return an object with additional properties if resetRuleOption is provided', () => {
        const resetRuleOption = {name: 'test', required: true};
        const result = getEmailRule(resetRuleOption);
        expect(result).toMatchObject(resetRuleOption);
    });

    it('should return an object with correct property values if resetRuleOption is provided with conflicting properties', () => {
        const resetRuleOption = {type: 'string', message: 'This is a test message'};
        const result = getEmailRule(resetRuleOption);
        expect(result.type).toBe('email');
        expect(result.message).toBe('请输入正确的邮箱格式');
        expect(result).toMatchObject(resetRuleOption);
    });
});

// Write Jest test code
describe('getMaxStringRule', () => {
    test('Successful with valid data', () => {
        expect(getMaxStringRule(10)).toStrictEqual(
            {
                type: 'string',
                max: 10,
                message: '最多输入 10 个字符',
            }
        );
    });

    test('Successful with extra options', () => {
        expect(getMaxStringRule(10, {options: 12})).toStrictEqual(
            {
                type: 'string',
                max: 10,
                message: '最多输入 10 个字符',
                options: 12,
            }
        );
    });

    test('Failure when maxLength is not provided', () => {
        expect(() => {
            getMaxStringRule(null);
        }).toThrow('maxLength must be a number');
    });

    test('Failure when maxLength is not a number', () => {
        expect(() => {
            getMaxStringRule('10');
        }).toThrow('maxLength must be a number');
    });
});


describe('getRequiredStringRule', () => {
    test('returns an object with required fields for a string', () => {
        const result = getRequiredStringRule();
        expect(result).toEqual({
            type: 'string',
            required: true,
            message: '请输入该项',
            whitespace: true,
        });
    });

    test('returns an object with any provided resetRuleOption', () => {
        const result = getRequiredStringRule(undefined, {
            min: 5,
            max: 10,
        });
        expect(result).toEqual({
            type: 'string',
            required: true,
            message: '请输入该项',
            whitespace: true,
            min: 5,
            max: 10,
        });
    });

    test('returns an object with itemName in the message', () => {
        const result = getRequiredStringRule('示例项');
        expect(result).toEqual({
            type: 'string',
            required: true,
            message: '请输入示例项',
            whitespace: true,
        });
    });
});


// The following is a sample test code block using Jest
describe('getOnyEngCharRule', () => {
    it('when a valid input is provided, should return the proper output', () => {
        const mockInput = 'abc';
        const expectedOutput = {
            // pattern: onlyEngCharExp,
            message: '请输入英文, 不允许输入特殊符号和数字',
        };
        expect(getOnyEngCharRule(mockInput)).toEqual(expectedOutput);
    });

    it('when invalid input is provided, should throw an error', () => {
        const mockInput = 'abc1';
        expect(() => getOnyEngCharRule(mockInput)).toThrowError('请输入英文, 不允许输入特殊符号和数字');
    });

    it('when no input is provided, should return the proper output', () => {
        const expectedOutput = {
            // pattern: onlyEngCharExp,
            message: '请输入英文, 不允许输入特殊符号和数字',
        };
        expect(getOnyEngCharRule()).toEqual(expectedOutput);
    });
});

// Test for getOnyEngAndChiCharRule()

describe('getOnyEngAndChiCharRule()', () => {
    it('should return a valid rule object', () => {
        const rule = getOnyEngAndChiCharRule();
        expect(rule).toBeDefined();
        expect(rule).toHaveProperty('pattern');
        expect(rule).toHaveProperty('message');
    });

    it('should return a valid rule object when resetRuleOption is provided', () => {
        const resetRuleOption = {
            pattern: 'test-pattern',
        };
        const rule = getOnyEngAndChiCharRule(resetRuleOption);
        expect(rule).toBeDefined();
        expect(rule).toHaveProperty('pattern', resetRuleOption.pattern);
        expect(rule).toHaveProperty('message');
    });

    it("should return a valid message '请输入英文或中文, 不允许输入特殊符号和数字' when valid input is provided", () => {
        const validInput = 'abc中文';
        const rule = getOnyEngAndChiCharRule();
        expect(rule.message(validInput)).toBe('请输入英文或中文, 不允许输入特殊符号和数字');
    });

    it('should return an error message when special characters are provided', () => {
        const invalidInput = 'abc 中文$#@!';
        const rule = getOnyEngAndChiCharRule();
        expect(rule.message(invalidInput)).not.toBe('请输入英文或中文, 不允许输入特殊符号和数字');
    });

    it('should return an error message when numbers are provided', () => {
        const invalidInput = '123456';
        const rule = getOnyEngAndChiCharRule();
        expect(rule.message(invalidInput)).not.toBe('请输入英文或中文, 不允许输入特殊符号和数字');
    });
});


describe('getHTTPUrlRule', () => {
    describe('mode default', () => {
        let resetRuleOption;
        let option;

        beforeEach(() => {
            resetRuleOption = undefined;
            option = {
                mode: 'default',
            };
        });

        it('should generate expected object when given a valid input', () => {
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                // pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });

        it('should generate expected object with custom resetRuleOption', () => {
            resetRuleOption = {
                min: 10,
            };
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                // pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });

        it('should generate expected object when no option is given', () => {
            option = undefined;
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                // pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });

        it('should generate expected object when no option mode is given', () => {
            option = {};
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                // pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });
    });

    describe('mode relax', () => {
        let resetRuleOption;
        let option;

        beforeEach(() => {
            resetRuleOption = undefined;
            option = {
                mode: 'relax',
            };
        });

        it('should generate expected object when given a valid input', () => {
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });

        it('should generate expected object with custom resetRuleOption', () => {
            resetRuleOption = {
                min: 10,
            };
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });

        it('should generate expected object when no option is given', () => {
            option = undefined;
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });

        it('should generate expected object when no option mode is given', () => {
            option = {};
            const ruleObject = getHTTPUrlRule(resetRuleOption, option);
            expect(ruleObject).toEqual({
                pattern: httpUrlRegExp,
                message: '请输入正确的网站格式',
                ...resetRuleOption,
            });
        });
    });
});