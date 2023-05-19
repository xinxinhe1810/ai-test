
export default {
    formatRatio(num: number | string) {
        const formatNum = Number(num);

        if (isNaN(formatNum) || formatNum > 1) {
            console.warn('formatRate num 不合法');
            return '-';
        }

        return `${(formatNum * 100).toFixed(2)}%`;
    },
    normalizeHtml(str: string): string {
        return str && str.replace(/&nbsp;|\u202F|\u00A0/ig, ' ');
    },
};
