
import {saveFileByLink, saveFileByData} from '../donwload';

describe('saveFileByLink', () => {
    let linkEl: HTMLAnchorElement;
    let appendChildSpy: jest.SpyInstance;
    let createElementSpy: jest.SpyInstance;
    let clickSpy: jest.SpyInstance;
    let originalCreateObjectURL: typeof URL.createObjectURL;

    beforeEach(() => {
        linkEl = document.createElement('a');
        appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(linkEl);
        clickSpy = jest.spyOn(linkEl, 'click').mockImplementation(() => {});

        // Save original URL.createObjectURL and replace with mock
        originalCreateObjectURL = URL.createObjectURL;
        (URL as any).createObjectURL = jest.fn(() => 'blob:http://example.com');
    });

    afterEach(() => {
        appendChildSpy.mockRestore();
        createElementSpy.mockRestore();
        clickSpy.mockRestore();

        // Restore original URL.createObjectURL
        (URL as any).createObjectURL = originalCreateObjectURL;
    });

    it('sets the href attribute and triggers a click', () => {
        const downloadLink = 'http://example.com';
        saveFileByLink(downloadLink);

        expect(linkEl.getAttribute('href')).toBe(downloadLink);
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('sets the download attribute if a filename is provided', () => {
        const downloadLink = 'http://example.com';
        const filename = 'test-file.txt';
        saveFileByLink(downloadLink, filename);

        expect(linkEl.getAttribute('href')).toBe(downloadLink);
        expect(linkEl.getAttribute('download')).toBe(filename);
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('does not set the download attribute if a filename is not provided', () => {
        const downloadLink = 'http://example.com';
        saveFileByLink(downloadLink);

        expect(linkEl.getAttribute('href')).toBe(downloadLink);
        expect(linkEl.getAttribute('download')).toBeNull();
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('handles blob object URLs', () => {
        const blob = new Blob(['test data'], {type: 'text/plain'});
        const downloadLink = URL.createObjectURL(blob);
        saveFileByLink(downloadLink);

        expect(linkEl.getAttribute('href')).toBe(downloadLink);
        expect(clickSpy).toHaveBeenCalledTimes(1);
    });
});

describe('saveFileByData', () => {
    let linkEl: HTMLAnchorElement;
    let appendChildSpy: jest.SpyInstance;
    let createElementSpy: jest.SpyInstance;
    let clickSpy: jest.SpyInstance;
    let originalCreateObjectURL: typeof URL.createObjectURL;
    let originalRevokeObjectURL: typeof URL.revokeObjectURL;

    beforeEach(() => {
        jest.useFakeTimers();
        linkEl = document.createElement('a');
        appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
        createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(linkEl);
        clickSpy = jest.spyOn(linkEl, 'click').mockImplementation(() => {});

        originalCreateObjectURL = URL.createObjectURL;
        (URL as any).createObjectURL = jest.fn(() => 'blob:http://example.com');

        originalRevokeObjectURL = URL.revokeObjectURL;
        (URL as any).revokeObjectURL = jest.fn();
    });

    afterEach(() => {
        jest.useRealTimers();
        appendChildSpy.mockRestore();
        createElementSpy.mockRestore();
        clickSpy.mockRestore();

        (URL as any).createObjectURL = originalCreateObjectURL;
        (URL as any).revokeObjectURL = originalRevokeObjectURL;
    });

    it('sets the href attribute, triggers a click and revokes URL after timeout', () => {
        const data = new Blob(['test data'], {type: 'text/plain'});
        saveFileByData(data);

        expect(URL.createObjectURL).toHaveBeenCalledWith(data);
        expect(linkEl.getAttribute('href')).toBe('blob:http://example.com');
        expect(clickSpy).toHaveBeenCalledTimes(1);

        jest.runAllTimers();

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://example.com');
        expect(linkEl.getAttribute('href')).toBe('');
    });

    it('sets the download attribute if a filename is provided and clears it after timeout', () => {
        const data = new Blob(['test data'], {type: 'text/plain'});
        const filename = 'test-file.txt';
        saveFileByData(data, filename);

        expect(linkEl.getAttribute('download')).toBe(filename);

        jest.runAllTimers();

        expect(linkEl.getAttribute('download')).toBe('');
    });

    it('does not set the download attribute if a filename is not provided', () => {
        const data = new Blob(['test data'], {type: 'text/plain'});
        saveFileByData(data);

        expect(linkEl.getAttribute('download')).toBeNull();
    });
});