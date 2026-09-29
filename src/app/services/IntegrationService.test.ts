import { describe, expect, it } from 'vitest';
import { IntegrationService } from './IntegrationService';

describe('IntegrationService unavailable integrations', () => {
  it('never reports an unimplemented provider as connected, including in demo mode', async () => {
    const previousDemo = process.env.NEXT_PUBLIC_DEMO_MODE;
    const previousSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_DEMO_MODE = 'true';
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    try {
      const results = await Promise.all([
        IntegrationService.testMedulaConnection('https://example.invalid', 'facility'),
        IntegrationService.testUtsConnection('firm', 'token'),
        IntegrationService.testEfaturaConnection('provider', 'api-key'),
        IntegrationService.testWhatsappConnection('provider', 'phone-id'),
      ]);

      expect(results.map(result => result.status)).toEqual(['offline', 'offline', 'offline', 'offline']);
      expect(results.every(result => result.message.includes('istek gönderilmedi'))).toBe(true);
    } finally {
      if (previousDemo === undefined) delete process.env.NEXT_PUBLIC_DEMO_MODE;
      else process.env.NEXT_PUBLIC_DEMO_MODE = previousDemo;
      if (previousSupabase === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = previousSupabase;
    }
  });

  it('does not simulate a successful SGK approval or WhatsApp delivery', async () => {
    const provision = await IntegrationService.executeInFlightSgkProvision('patient', 'rx');
    const notification = await IntegrationService.sendWhatsappNotificationWithFallback('+905551112233', 'test');

    expect(provision.status).toBe('Durumu Belirsiz');
    expect(provision.message).toContain('isteği gönderilmedi');
    expect(notification.success).toBe(false);
    expect(notification.message).toContain('mesaj gönderilmedi');
  });
});
