import { afterEach, describe, expect, it, vi } from 'vitest';
import { EventBus } from '../EventBus';
import { Logger } from '../../lib/logger';

describe('sensitive data is not written to browser logs', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not log event payloads', async () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await EventBus.publish({
      type: 'AUDIT_LOGGED',
      payload: { tc: '11111111110', patientName: 'Test Patient' },
      timestamp: new Date().toISOString(),
    });
    expect(consoleLog).not.toHaveBeenCalled();
  });

  it('omits structured info and error objects', () => {
    const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const privateData = { phone: '+905551112233', tc: '11111111110' };

    Logger.info('event', 'security-test', privateData);
    Logger.error('request failed', new Error(JSON.stringify(privateData)), 'security-test');

    expect(consoleLog).not.toHaveBeenCalledWith(expect.anything(), privateData);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('11111111110');
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain('+905551112233');
  });
});
