import { describe, expect, it } from 'vitest';
import { LeadAttributionService } from './LeadAttributionService';

describe('LeadAttributionService', () => {
  it('classifica mídia social paga', () => {
    expect(LeadAttributionService.classify({ utmSource: 'instagram', utmMedium: 'paid_social' }))
      .toEqual({ channel: 'PAID_SOCIAL', platform: 'INSTAGRAM' });
  });

  it('usa o referrer para busca orgânica quando não existe UTM', () => {
    expect(LeadAttributionService.classify({ referrer: 'https://www.google.com/search?q=laminados' }))
      .toEqual({ channel: 'ORGANIC_SEARCH', platform: 'GOOGLE' });
  });

  it('classifica cpc de plataforma social como midia social paga', () => {
    expect(LeadAttributionService.classify({ utmSource: 'instagram', utmMedium: 'cpc' }))
      .toEqual({ channel: 'PAID_SOCIAL', platform: 'INSTAGRAM' });
  });

  it('classifica acesso sem UTM e sem referrer como direto', () => {
    expect(LeadAttributionService.classify({})).toEqual({ channel: 'DIRECT', platform: null });
  });
});
