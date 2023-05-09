/**
 * 获取下载的挂载元素
 */
function getDownloadEl(): HTMLElement {
    let linkEl = document.querySelector('downloadLinkEl');
    if (!linkEl) {
        linkEl = document.createElement('a');
        document.body.append(linkEl);
    }
    return linkEl as HTMLElement;
}

/**
 * 根据数据下载文件
 * @param data
 * @param filename
 */
export function saveFileByData(data, filename?: string) {
    const linkEl = getDownloadEl();
    const downloadLink = URL.createObjectURL(data);
    linkEl.setAttribute('href', downloadLink);
    if (filename) {
        linkEl.setAttribute('download', filename);
    }
    linkEl.click();
    setTimeout(function () {
        // 通过createObjectURL创建的url需要通过revokeObjectURL()来释放
        URL.revokeObjectURL(downloadLink);
        linkEl.setAttribute('href', '');
        if (filename) {
            linkEl.setAttribute('download', '');
        }
    });
}

/**
 * skip-test
 * 通过链接下载文件，可以是cdn地址，也可以是blob对象地址
 * @param downloadLink
 * @param filename
 */
export function saveFileByLink(downloadLink: string, filename?: string) {
    const linkEl = getDownloadEl();
    linkEl.setAttribute('href', downloadLink);
    if (filename) {
        linkEl.setAttribute('download', filename);
    }
    linkEl.click();
}
