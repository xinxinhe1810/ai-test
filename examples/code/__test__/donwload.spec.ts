
import {saveFileByLink, saveFileByData} from '../donwload';

describe('saveFileByLink', () => {
    it('should render a download link for valid strings', () => {
        const downloadLink = 'http://example.com/example.zip';
        const filename = 'example.zip';

        const linkEl = jest.spyOn(document, 'createElement');

        saveFileByLink(downloadLink, filename);

        expect(linkEl).toBeCalledWith('a');

        const {href, download} = linkEl.mock.calls[0][0];
        expect(href).toBe(downloadLink);
        expect(download).toBe(filename);
    });

    it('should render a download link for valid Blob objects', () => {
        const downloadLink = new Blob(['example']);
        const filename = 'example.txt';

        const linkEl = jest.spyOn(document, 'createElement');

        saveFileByLink(downloadLink, filename);

        expect(linkEl).toBeCalledWith('a');

        const {href, download} = linkEl.mock.calls[0][0];
        expect(href).toBeDefined();
        expect(download).toBe(filename);
    });

    it('should still render a download link if no filename provided', () => {
        const downloadLink = 'http://example.com/example.zip';

        const linkEl = jest.spyOn(document, 'createElement');

        saveFileByLink(downloadLink);

        expect(linkEl).toBeCalledWith('a');

        const {href, download} = linkEl.mock.calls[0][0];
        expect(href).toBe(downloadLink);
        expect(download).toBeUndefined();
    });
});

describe('saveFileByData', () => {
    let data: Blob;
    beforeEach(() => {
        data = new Blob(['some data'], {type: 'application/octet-stream'});
    });
    it('should save file with just data', () => {
    // No filename is passed
        saveFileByData(data);
        expect(document.createElement).toHaveBeenCalledWith('a');
        const linkEl = getDownloadEl();
        expect(linkEl.getAttribute('href')).not.toBe('');
        expect(linkEl.getAttribute('download')).toBe('');
        expect(linkEl.click).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(linkEl.getAttribute('href'));
    });

    it('should save file with data and filename', () => {
    // A filename is passed.
        const filename = 'newDataFile.txt';
        saveFileByData(data, filename);
        expect(document.createElement).toHaveBeenCalledWith('a');
        const linkEl = getDownloadEl();
        expect(linkEl.getAttribute('href')).not.toBe('');
        expect(linkEl.getAttribute('download')).toBe(filename);
        expect(linkEl.click).toHaveBeenCalled();
        expect(URL.revokeObjectURL).toHaveBeenCalledWith(linkEl.getAttribute('href'));
    });

    it('should throw an error if data is not a Blob', () => {
    // Incorrect type of data is passed
        expect(() => saveFileByData('invalid data')).toThrowError(
            'The data provided must be of type Blob.'
        );
    });
});