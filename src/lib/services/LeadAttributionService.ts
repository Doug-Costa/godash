export type AttributionChannel =
  | 'PAID_SOCIAL'
  | 'PAID_SEARCH'
  | 'ORGANIC_SOCIAL'
  | 'ORGANIC_SEARCH'
  | 'EMAIL'
  | 'REFERRAL'
  | 'DIRECT'
  | 'OTHER';

export interface AttributionInput {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  pageUrl?: string | null;
  referrer?: string | null;
}

export class LeadAttributionService {
  static classify(input: AttributionInput): { channel: AttributionChannel; platform: string | null } {
    const source = this.normalize(input.utmSource);
    const medium = this.normalize(input.utmMedium);
    const referrerHost = this.hostname(input.referrer);
    const platform = this.detectPlatform(source || referrerHost);

    const isSocialPlatform = !!platform && ['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'LINKEDIN', 'YOUTUBE'].includes(platform);
    if (/(paid_social|social_paid|paidsocial)/.test(medium) || (isSocialPlatform && /(cpc|ppc|paid)/.test(medium))) {
      return { channel: 'PAID_SOCIAL', platform };
    }
    if (/(cpc|ppc|paid_search|search_paid)/.test(medium)) return { channel: 'PAID_SEARCH', platform };
    if (/(email|newsletter)/.test(medium)) return { channel: 'EMAIL', platform: source || null };
    if (/(referral|affiliate|partner)/.test(medium)) return { channel: 'REFERRAL', platform: source || referrerHost || null };

    if (isSocialPlatform) {
      return { channel: 'ORGANIC_SOCIAL', platform };
    }
    if (platform && ['GOOGLE', 'BING', 'YAHOO', 'DUCKDUCKGO'].includes(platform)) {
      return { channel: 'ORGANIC_SEARCH', platform };
    }
    if (source || medium) return { channel: 'OTHER', platform: platform || source || null };
    if (referrerHost) return { channel: 'REFERRAL', platform: platform || referrerHost };
    return { channel: 'DIRECT', platform: null };
  }

  private static normalize(value?: string | null): string {
    return (value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  }

  private static hostname(value?: string | null): string {
    if (!value) return '';
    try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ''); }
    catch { return ''; }
  }

  private static detectPlatform(value: string): string | null {
    if (!value) return null;
    if (/(instagram|ig)/.test(value)) return 'INSTAGRAM';
    if (/(facebook|fb)/.test(value)) return 'FACEBOOK';
    if (/google/.test(value)) return 'GOOGLE';
    if (/bing/.test(value)) return 'BING';
    if (/yahoo/.test(value)) return 'YAHOO';
    if (/duckduckgo/.test(value)) return 'DUCKDUCKGO';
    if (/tiktok/.test(value)) return 'TIKTOK';
    if (/linkedin/.test(value)) return 'LINKEDIN';
    if (/youtube/.test(value)) return 'YOUTUBE';
    return null;
  }
}
