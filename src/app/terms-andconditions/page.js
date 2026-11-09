import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions | Bajiwala Baji365 Official Agent List',
  description: 'Terms and conditions for utilizing the Bajiwala Baji365 agent directory and verification tool.'
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#060a12', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '12px', padding: '35px' }}>
        <h1 style={{ color: '#f3c346', fontSize: '26px', marginBottom: '15px' }}>
          Terms &amp; Conditions
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '20px', fontSize: '15px' }}>
          By accessing and using this directory, you agree to comply with and be bound by the following terms and conditions.
        </p>

        <h2 style={{ color: '#fce08a', fontSize: '18px', margin: '20px 0 10px 0' }}>
          Directory Verification
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '14px', marginBottom: '15px' }}>
          Users must verify the agent ID and WhatsApp contact details directly on this official website before engaging in any transaction.
        </p>

        <h2 style={{ color: '#fce08a', fontSize: '18px', margin: '20px 0 10px 0' }}>
          Limitation of Liability
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '14px' }}>
          We are not responsible for any transactions conducted with individuals not listed in this official directory or contacted through unofficial contact channels.
        </p>

        <div style={{ marginTop: '30px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <Link href="/" className="verify-btn" style={{ display: 'inline-block' }}>
            RETURN TO HOME
          </Link>
        </div>
      </div>
    </div>
  );
}
