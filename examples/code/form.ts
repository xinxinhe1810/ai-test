// http://emailregex.com/
export const emailRegExp
     // eslint-disable-next-line max-len
     = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+\.)+[a-zA-Z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]{2,}))$/;

export const httpUrlRegExp
    // eslint-disable-next-line max-len
    = /^(?:(http|https):\/\/)?((|[\w-]+\.)+[a-z0-9]+)(\.(|[\w-]+\.)+[a-z0-9]+)(\/)?(?:(\/[^/?#]+)*)?(\/)?(\?[^#]+)?(#.+)?$/;

export const phoneRgeExp = /^1\d{10}$/;

// 英文字符（数字、英文字母、英文符号）校验
export const engCharRegExp = /^[a-zA-Z0-9\s\`\~\!\@\#\$\%\^\&\*\(\)\_\+\-\=\[\]\{\}\\\|\;\'\'\:\"\"\,\.\/\<\>\?]*$/;

// 仅英文
export const onlyEngCharExp = /^[A-Za-z]+$/;

// 仅英文和中文
export const onlyEngAndChiCharExp = /^[\a-\z\A-\Z\u4E00-\u9FA5]+$/;

// 仅数字
export const onlyNumberExp = /^\d+$/;

// 仅英文数字-_
export const engNumAndLineCharExp = /^[\w-]+$/;

/**
 * 获取必填字符串校验规则
 * @param itemName 该表单项的名称
 * @param resetRuleOption 复写表单规则
 */
export function getRequiredStringRule(itemName: string = '该项', resetRuleOption?) {
    return {
        type: 'string',
        required: true,
        message: `请输入${itemName}`,
        whitespace: true,
        ...resetRuleOption,
    };
}

/**
 * 获取最大字符数的校验规则
 * @param maxLength 最大字符数
 * @param resetRuleOption 复写表单规则
 */
export function getMaxStringRule(maxLength: number, resetRuleOption?) {
    return {type: 'string', max: maxLength, message: `最多输入 ${maxLength} 个字符`, ...resetRuleOption};
}

/**
 * 获取手机号格式校验规则
 * @param resetRuleOption 复写表单规则
 * @prompt 手机号仅支持中国
 */
export function getPhoneRule(resetRuleOption?) {
    return {pattern: phoneRgeExp, message: '请输入正确的手机号格式', ...resetRuleOption};
}

/**
 * 获取邮箱校验规则
 * @param resetRuleOption 复写表单规则
 */
export function getEmailRule(resetRuleOption?) {
    return {type: 'email', message: '请输入正确的邮箱格式', ...resetRuleOption};
}

/**
 * 获取 http url 规则
 * @param resetRuleOption 复写表单规则
 */
export function getHTTPUrlRule(resetRuleOption?, option?: {mode: 'default' | 'relax'}) {
    const {mode = 'default'} = option || {};
    let pattern: RegExp = httpUrlRegExp;
    // TODO: 配置更多中 http 的校验规则
    switch (mode) {
        default:
            pattern = httpUrlRegExp;
            break;
    }
    return {
        pattern: pattern,
        message: '请输入正确的网站格式',
        ...resetRuleOption,
    };
}

/**
 * 获取英文字符（数字、英文字母、英文符号）校验
 * @param resetRuleOption 复写表单规则
 */
export function getEngCharRule(resetRuleOption?) {
    return {
        pattern: engCharRegExp,
        message: '请输入英文',
        ...resetRuleOption,
    };
}

/**
 * 获取英文字符（数字、英文字母、英文符号）校验
 * @param resetRuleOption 复写表单规则
 */
export function getOnyEngCharRule(resetRuleOption?) {
    return {
        pattern: onlyEngCharExp,
        message: '请输入英文, 不允许输入特殊符号和数字',
        ...resetRuleOption,
    };
}

/**
 * 获取英文或中文字符（英文字母、汉字）校验
 * @param resetRuleOption 复写表单规则
 */
export function getOnyEngAndChiCharRule(resetRuleOption?) {
    return {
        pattern: onlyEngAndChiCharExp,
        message: '请输入英文或中文, 不允许输入特殊符号和数字',
        ...resetRuleOption,
    };
}

/**
 * 获取数字校验
 * @param resetRuleOption 复写表单规则
 */
export function getOnyNumberRule(resetRuleOption?) {
    return {
        pattern: onlyNumberExp,
        message: '请输入数字',
        ...resetRuleOption,
    };
}

/**
 * 获取英文字符数字-_的校验
 * @param resetRuleOption 复写表单规则
 */
export function getEngNumAndLineCharRule(resetRuleOption?) {
    return {
        pattern: engNumAndLineCharExp,
        message: '仅支持输入英文，数字，下划线，横线；例如chuhaiyi-1_A',
        ...resetRuleOption,
    };
}