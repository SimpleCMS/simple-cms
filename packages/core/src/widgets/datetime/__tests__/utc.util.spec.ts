import formatISO from 'date-fns/formatISO';

import { getTimezoneOffset, localToUTC } from '../utc.util';

describe('utc util', () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date(2023, 1, 12, 10, 5, 35) });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('gets the timezone offset in milliseconds', () => {
    expect(getTimezoneOffset()).toBe(18000000);
  });

  it('converts local (EST) to UTC', () => {
    const expectedUTC = new Date(2023, 1, 12, 15, 5, 35);
    const actualUTC = localToUTC(new Date(), getTimezoneOffset());
    expect(formatISO(actualUTC)).toEqual(formatISO(expectedUTC));
  });
});
