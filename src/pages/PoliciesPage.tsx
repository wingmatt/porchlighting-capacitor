import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import styles from './PoliciesPage.module.css';

const operatorName = import.meta.env.VITE_POLICY_OPERATOR_NAME || 'the Porchlighting operator';
const contactEmail = import.meta.env.VITE_POLICY_CONTACT_EMAIL || 'the support email address';
const jurisdiction = import.meta.env.VITE_POLICY_JURISDICTION || 'the United States';

type PolicyTab = 'privacy' | 'terms';

export const PoliciesPage: FunctionComponent = () => {
  const [activeTab, setActiveTab] = useState<PolicyTab>('privacy');

  const selectTab = (tab: PolicyTab) => setActiveTab(tab);
  const handleTabKeyDown = (event: KeyboardEvent) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.key === 'ArrowLeft' || event.key === 'Home' ? 'privacy' : 'terms';
    selectTab(nextTab);
    document.getElementById(`policy-tab-${nextTab}`)?.focus();
  };

  return <article className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>Porchlighting policies</p>
      <h1>Privacy policy and terms of use</h1>
      <p>
        These policies explain how Porchlighting works as a free, open-source community website
        operated by {operatorName}. They were last updated October 6, 2026.
      </p>
      <p className={styles.notice}>
        This is general product information, not legal advice. Please contact {operatorName} at{' '}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> with questions or concerns.
      </p>
    </header>

    <div className={styles.tabs} role="tablist" aria-label="Policies">
      <button
        id="policy-tab-privacy"
        type="button"
        className={`${styles.tab} ${activeTab === 'privacy' ? styles.activeTab : ''}`}
        onClick={() => selectTab('privacy')}
        onKeyDown={handleTabKeyDown}
        role="tab"
        aria-selected={activeTab === 'privacy'}
        aria-controls="policy-panel-privacy"
        tabIndex={activeTab === 'privacy' ? 0 : -1}
      >
        Privacy policy
      </button>
      <button
        id="policy-tab-terms"
        type="button"
        className={`${styles.tab} ${activeTab === 'terms' ? styles.activeTab : ''}`}
        onClick={() => selectTab('terms')}
        onKeyDown={handleTabKeyDown}
        role="tab"
        aria-selected={activeTab === 'terms'}
        aria-controls="policy-panel-terms"
        tabIndex={activeTab === 'terms' ? 0 : -1}
      >
        Terms of use
      </button>
    </div>

    {activeTab === 'privacy' ? <section id="policy-panel-privacy" className={styles.card} role="tabpanel" aria-labelledby="policy-tab-privacy" tabIndex={0}>
      <h2>Privacy policy</h2>
      <p>
        This policy describes the information Porchlighting may collect, how it is used, and the
        choices available to you when you use the Porchlighting website or mobile applications.
      </p>

      <h3>Information we collect</h3>
      <ul>
        <li>Account details such as your email address, name, authentication credentials, and account activity, when you create an account.</li>
        <li>Guest details such as a guest name and guest access token when you join without an account.</li>
        <li>Porchlight content you create or share, including names, status information, invitations, roles, and location coordinates.</li>
        <li>System performance and error information collected through New Relic APM and Sentry to help monitor, diagnose, and improve the service.</li>
        <li>Preferences stored on your device, such as authentication, guest-session, theme, and accessibility settings.</li>
      </ul>

      <p>
        Porchlighting does not automatically collect your location. Location information is only
        included when you or another authorized participant chooses to enter or share it. {operatorName}
        does not retain personally identifiable information, although service providers such as
        Firebase, Mapbox, New Relic, and Sentry may process information as needed to provide their
        respective services.
      </p>

      <h3>How we use information</h3>
      <p>
        We use information to provide and secure the service, authenticate users and guests, show
        shared porchlights to authorized participants, synchronize status updates, send requested
        notifications, respond to support requests, and maintain and improve the service.
      </p>

      <h3>Sharing and service providers</h3>
      <p>
        Information may be processed by Firebase for authentication and real-time synchronization,
        Mapbox for map display and location-related features, New Relic APM for system performance
        monitoring, and Sentry for error reporting. We may also disclose information when required
        by law or reasonably necessary to protect the service and its users. We do not sell personal
        information.
      </p>

      <h3>Location and shared content</h3>
      <p>
        Porchlight coordinates and other content may be visible to people who receive access from
        you or another authorized participant. Do not add information that you are not comfortable
        sharing with that audience. You are responsible for having permission to share locations,
        names, and other content you submit.
      </p>

      <h3>Retention, security, and your choices</h3>
      <p>
        {operatorName} does not retain personally identifiable information. Firebase, Mapbox, New Relic,
        Sentry, and other infrastructure providers may retain or process information according to
        their own policies and service configurations. We use reasonable administrative, technical,
        and organizational safeguards, but no service can guarantee absolute security. To ask a
        question, report a concern, or request that information under the operator's control be
        removed, contact <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h3>Children and changes</h3>
      <p>
        Porchlighting has no age requirement. We may update this policy as the service changes. We
        will post the revised policy here and update the date above; continued use after an update
        means the revised policy will apply to the extent permitted by law.
      </p>
    </section> : <section id="policy-panel-terms" className={styles.card} role="tabpanel" aria-labelledby="policy-tab-terms" tabIndex={0}>
      <h2>Terms of use</h2>
      <p>
        By using Porchlighting, you agree to these terms. If you do not agree, do not use the
        service. “Porchlighting,” “we,” and “us” refer to {operatorName}, who operates this free,
        open-source community website. The service is hosted in {jurisdiction}.
      </p>

      <h3>Using the service</h3>
      <p>
        You must provide accurate information, keep account credentials and guest links secure, and
        use the service only for lawful purposes. If you create or share a porchlight, you must have
        the rights and permissions needed to share its content and location. You are responsible for
        activity performed through your account or access credentials.
      </p>

      <h3>Prohibited conduct</h3>
      <p>
        You may not misuse or disrupt the service; attempt unauthorized access; probe, scan, or
        bypass security; distribute malware or abusive content; impersonate another person; or use
        the service to violate another person’s privacy, safety, or rights.
      </p>

      <h3>User content and moderation</h3>
      <p>
        You retain ownership of content you submit. You grant us the limited permission needed to
        host, process, display, synchronize, and back up that content to provide the service. We may
        remove content or restrict access when we reasonably believe it violates these terms, harms
        users, or creates legal or security risk. To report abuse, unsafe content, or a moderation
        concern, email <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>

      <h3>Availability and disclaimers</h3>
      <p>
        The service is provided on an “as available” basis. We do not promise that it will always be
        available, accurate, secure, or error-free, and porchlight status or notifications should
        not be used for emergencies, safety-critical decisions, or time-sensitive communication.
        To the fullest extent allowed by law, we disclaim warranties not expressly stated in these
        terms.
      </p>

      <h3>Suspension, termination, and changes</h3>
      <p>
        We may suspend or terminate access for security, legal, operational, or terms-violation
        reasons. You may stop using the service and request account deletion through the support
        channel provided in the app. We may update these terms by posting a new version here and
        changing the effective date. Material changes will be communicated where required by law.
      </p>

      <h3>Contact and governing law</h3>
      <p>
        Contact {operatorName} at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> for questions,
        notices, abuse reports, or moderation concerns. The service is hosted in {jurisdiction}; any
        applicable governing law, dispute procedures, liability limits, and consumer disclosures
        will be determined under applicable law in {jurisdiction}.
      </p>
    </section>
    }
  </article>;
};