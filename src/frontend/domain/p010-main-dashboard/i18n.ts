export const I18nDomainResource = (domainName: string) => {
  return {
    domainName,
    resources: {
      en: {
        translation: {
          title: 'Main Dashboard',
        },
      },
      ko: {
        translation: {
          title: '메인 대시보드',
        },
      },
    },
  };
};
