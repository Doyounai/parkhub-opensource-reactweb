export interface I18nType {
  domainName: string;
}

export const I18nDomainResource = (domainName: string): I18nType => {
  return {
    domainName,
  };
};

export const i18n: I18nType = I18nDomainResource('accuracy-dashboard');
