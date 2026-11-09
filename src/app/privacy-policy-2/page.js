import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | Bajiwala Baji365 Official Agent List',
  description: 'Our privacy policy explains how user data and agent records are safeguarded.'
};

export default function PrivacyPolicyPage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 20px' }}>
      <div style={{ background: '#060a12', border: '1px solid rgba(212, 175, 55, 0.25)', borderRadius: '12px', padding: '35px' }}>
        <h1 style={{ color: '#f3c346', fontSize: '26px', marginBottom: '15px' }}>
          Privacy Policy
        </h1>
        <p style={{ color: '#94a3b8', lineHeight: '1.8', marginBottom: '20px', fontSize: '15px' }}>
          We respect your privacy and are committed to protecting your personal information. This Privacy Policy details the types of data collected on this directory.
        </p>

        <h2 style={{ color: '#fce08a', fontSize: '18px', margin: '20px 0 10px 0' }}>
          Information Collection &amp; Use
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '14px', marginBottom: '15px' }}>
          This website serves as a public verification directory. We do not collect banking details, credit card numbers, or passwords from visitors. Any communication made via WhatsApp occurs externally through WhatsApp services.
        </p>

        <h2 style={{ color: '#fce08a', fontSize: '18px', margin: '20px 0 10px 0' }}>
          Security
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: '1.8', fontSize: '14px' }}>
          We implement top-tier encryption and security best practices to protect the integrity of our verified agent listings and directory data.
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
