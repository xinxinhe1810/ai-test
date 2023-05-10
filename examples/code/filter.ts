/**
 * 过滤器
 * @author dingxin02
 * @date 2021-10-26
 */

// import dayjs from 'dayjs';

const a = () => { };

function b() {}

class Cache {
    map = {};
    getCache(key) {
        return this.map[key];
    }

    setCache(key, value) {
        this.map[key] = value;
    }

    clearCache() {
        Object.keys(this.map).forEach(key => {
            delete this.map[key];
        });
    }
}

const format = {
    /**
     * 将时间戳转化为格式化日期
     *
     * @param  {number} source  时间戳，单位为ms
     * @param  {string} formatString  日期格式，如 yyyy-MM-dd hh:mm
     * @return {string} 格式化日期
     */
    formatTime(time: number | string, type = 'YYYY-MM-DD HH:mm') {
        if (!time) {
            return '';
        };

        if (typeof time === 'string') {
            // return dayjs(time).format(type);
        }
        if (typeof time === 'number') {
            time = +time;

            if (time >= 1e9 && time < 1e10) {
                const timestamp = time * 1000;
                // return dayjs(new Date(timestamp)).format(type);
                return '';
            }
        }
        // return dayjs(time).format(type);
        return '';
    },
    /**
     * 将数字转换为百分数，保留两位小数
     *
     * @param  {number} num  小数
     * @return {string} 百分数
     */
    formatRatio(num: number | string) {
        const formatNum = Number(num);

        if (isNaN(formatNum)) {
            console.warn('formatRate num 不合法');
            return '-';
        }

        return `${(formatNum * 100).toFixed(2)}%`;
    },
    c: () => {

    },
    d() {

    },
    a,
};

export const testFunc = () => {
    return '123';
};

export const format2 = format;

export function testFunc2() {
    return '321';
}

export default {
    format,
    f: format,
    a,
    Cache,
};

// export default format;