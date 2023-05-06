const isObject = (value) => {
    return Reflect.toString.call(value) === '[object Object]';
}

/**
 * 过滤传入的 Object 只获取需要的字段（基于原对象的浅拷贝）
 * @param obj 原对象
 * @param filterHandle 过滤器
 * @returns 返回新的对象
 * @author jiguangrui(jiguangrui@baidu.com)
 * @date 2021-09-09
 */
export function filterObject<T>(obj: T, filterHandle: (key: string, value: any) => boolean): Partial<T> {
    const newObj: Partial<T> = {};
    if (isObject(obj)) {
        Object.keys(obj).forEach(key => {
            if (filterHandle(key, obj[key])) {
                newObj[key] = obj[key];
            }
        });
    }
    else {
        throw new Error('filterObject 传入的数据类型需要为 Object');
    }
    return newObj;
}

export const DEFAULT_EMPTY_ITEMS = [null, undefined, ''];

/**
 * 传入一个对象，过滤掉对象中的空值字段
 * @param params
 * @param emptyValues
 * @returns
 */
export function returnNotEmptyValue<T>(params: T, emptyValues: any[] = DEFAULT_EMPTY_ITEMS): Partial<T> {
    return filterObject(
        params,
        (key, value) => !emptyValues.includes(typeof value === 'string' ? value.trim() : value)
    );
}

/**
 * 传入一个对象，该方法会遍历该对象的每一个值，如果当前值是一个字符串，那么会对字符串进行 trim 操作；该方法会修改对象本身，并返回修改后的结果。
 * @param obj 目标对象
 * @param optionalKeys 仅处理对象的部分字段，如果不传则会处理所有可处理的字段
 */
export function trimmedObjectValue<T extends { [key: string]: any }>(obj: T, optionalKeys?: string[]) {
    if (isObject(obj)) {
        // 检查是否是仅对部分字段进行 trim 操作
        if (optionalKeys instanceof Array) {
            optionalKeys.forEach(key => {
                const currentVal = obj[key];
                if (typeof currentVal === 'string') {
                    (obj[key] as string) = currentVal.trim();
                }
            });
        }
        // 如果没有传入 optionalKeys，就对所有字段进行 trim 操作
        else {
            for (let key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) {
                    const currentVal = obj[key];
                    // 如果当前遍历的值是字符串类型的，再进行处理
                    if (typeof currentVal === 'string') {
                        obj[key] = currentVal.trim();
                    }
                }
            }
        }
    }
    return obj;
}

/**
 * 获取重定向的页面 url，规则如下：
 * 1. 如果当前页面的 url query 中有 redirect 参数，则返回 redirect 参数的值
 * 2. 如果当前页面位于 /login 路径，则返回 /
 * 3. 如果不匹配上面两种规则，仍返回当前页面的 url
 * @param {String} includeHost 返回的 url 是否包含 host
 * @returns {String}
 */
export function getRedirectTarget(includeHost: boolean = false): string {
    const currentUrlSearchParams = new URLSearchParams(location.search.split('?')[1]);
    const redirectTarget
        = currentUrlSearchParams.get('redirect') || (location.pathname === '/login' ? '/' : location.pathname);
    return (includeHost ? location.host : '') + redirectTarget;
}