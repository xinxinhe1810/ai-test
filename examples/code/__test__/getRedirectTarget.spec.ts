
import {getRedirectTarget} from '..';
            
describe('getRedirectTarget', () => {
  test('should return the redirect when the current URL query includes a redirect parameter', () => {
    const result = getRedirectTarget(false);
    const mockLocationSearch = { search: '?redirect=/about' };
    const urlSearchParamsMock = new URLSearchParams(mockLocationSearch.split('?')[1]);

    expect(urlSearchParamsMock.get('redirect')).toBe("/about");
    expect(result).toBe("/about");
  });

  test('should return "/" when the current URL pathname is "\/login"', () => {
    const result = getRedirectTarget(false);
    const mockLocationPathname = '/login';
    expect(mockLocationPathname).toBe("/login");
    expect(result).toBe("/");
  });

  test('should return the current URL pathname when no valid parameter is found', () => {
    const result = getRedirectTarget(false);
    const mockLocationPathname = '/home';

    expect(mockLocationPathname).toBe("/home");
    expect(result).toBe("/home");
  });
});
            