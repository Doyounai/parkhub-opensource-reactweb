import './index.scss';

import { I18nDomainResource } from './i18n';

const domainName = 'domainMan';
const i18n = I18nDomainResource(domainName);

const JSX = () => {
  return <>{domainName}</>;
};

export default { JSX, i18n };