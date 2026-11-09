'use client';

import React, { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';

const FAQ_DATA = [
  {
    id: 1,
    question: 'What is Bajiwala Baji365 Agent List?',
    answer:
      'Bajiwala Baji365 Agent List is an online platform where users can find useful information about Bajiwala Baji365 agents, login details, and related services in one place.'
  },
  {
    id: 2,
    question: 'How can I find a Bajiwala Baji365 Agent?',
    answer:
      'You can browse the agent list on our website and find the available agent information you are looking for.'
  },
  {
    id: 3,
    question: 'How do I contact a Bajiwala Baji365 Agent?',
    answer:
      'Agent information available on the website may include relevant contact or service details. Please verify the information before contacting an agent.'
  },
  {
    id: 4,
    question: 'How can I access Bajiwala Baji365 Agent Login?',
    answer:
      'Go to the relevant login section of the website and follow the provided instructions to access your account.'
  },
  {
    id: 5,
    question: 'Is the information on the agent list updated?',
    answer:
      'We try to keep the information as accurate and updated as possible. However, agent details may change, so users should verify important information before using any service.'
  }
];

export default function FaqSection() {
  const { siteName, replaceVelki } = useSettings();
  const [openIndex, setOpenIndex] = useState(0); // First item open by default

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="faq-wrapper-section">
      <div className="faq-heading-wrap">
        <h2 className="faq-heading-title">{siteName} AGENT LIST FAQ</h2>
      </div>

      <div className="faq-accordion-list">
        {FAQ_DATA.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.id} className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
              <div
                className="faq-accordion-title"
                onClick={() => toggleFaq(index)}
                role="button"
                tabIndex={0}
              >
                <span className="faq-accordion-text">{replaceVelki(item.question)}</span>
                <span className="faq-accordion-icon">
                  {isOpen ? (
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-minus"
                      viewBox="0 0 448 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fill="currentColor" d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      className="e-font-icon-svg e-fas-plus"
                      viewBox="0 0 448 512"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path fill="currentColor" d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path>
                    </svg>
                  )}
                </span>
              </div>
              {isOpen && (
                <div className="faq-accordion-content">
                  <p>{replaceVelki(item.answer)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
