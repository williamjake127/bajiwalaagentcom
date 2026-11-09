'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { defaultSettings, DEFAULT_BRAND_NAME, normalizeSiteName, sanitizeBrandText } from '@/lib/seedData';
import { broadcastSync, subscribeSync } from '@/lib/syncChannel';

const SETTINGS_STORAGE_KEY = 'velki_site_settings_cache_v5';

const SettingsContext = createContext({
  settings: defaultSettings,
  siteName: DEFAULT_BRAND_NAME,
  siteLogo: '/wp-content/uploads/2026/07/logo.png',
  siteIcon: '/wp-content/uploads/2026/07/ChatGPT-Image-Jul-27-2026-06_49_47-PM.webp',
  complainWhatsapp: '27635215141',
  replaceVelki: (text) => sanitizeBrandText(text, DEFAULT_BRAND_NAME),
  updateSettings: () => {},
  refreshSettings: () => {}
});

export function SettingsProvider({ children, initialSettings }) {
  const [settings, setSettings] = useState(() => {
    if (initialSettings && initialSettings.site_name) {
      return {
        ...initialSettings,
        site_name: normalizeSiteName(initialSettings.site_name)
      };
    }
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            return {
              ...defaultSettings,
              ...parsed,
              site_name: normalizeSiteName(parsed.site_name)
            };
          }
        }
      } catch (e) {
        // ignore storage error
      }
    }
    return initialSettings || defaultSettings;
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch(`/api/settings?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const merged = {
          ...defaultSettings,
          ...data.data,
          site_name: normalizeSiteName(data.data.site_name)
        };
        setSettings(merged);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.error('Error loading settings context:', err);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Subscribe to cross-tab updates for settings
    const unsubscribe = subscribeSync((event) => {
      if (event.type === 'SETTINGS_UPDATED') {
        if (event.payload && typeof event.payload === 'object') {
          setSettings(prev => ({
            ...prev,
            ...event.payload,
            site_name: normalizeSiteName(event.payload.site_name || prev.site_name)
          }));
        }
      } else if (event.type === 'SETTINGS_CACHE_MUTATED') {
        try {
          const cached = localStorage.getItem(SETTINGS_STORAGE_KEY);
          if (cached) {
            const parsed = JSON.parse(cached);
            setSettings(prev => ({
              ...prev,
              ...parsed,
              site_name: normalizeSiteName(parsed.site_name || prev.site_name)
            }));
          }
        } catch (e) {}
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const siteName = normalizeSiteName(settings.site_name);
  const siteLogo = settings.site_logo || '/wp-content/uploads/2026/07/logo.png';
  const siteIcon = settings.site_icon || '/wp-content/uploads/2026/07/ChatGPT-Image-Jul-27-2026-06_49_47-PM.webp';
  const complainWhatsapp = settings.complain_whatsapp || '27635215141';

  // Helper function to replace "CHORKI365", "Velki", "চরকি", "ভেলকি" in strings
  const replaceVelki = (text) => {
    if (!text || typeof text !== 'string') return text;
    return sanitizeBrandText(text, siteName);
  };

  // Dynamically update document title & favicon in browser instantly
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Dynamic Title
      const baseTitle = `${siteName} Agent List 2026 | Official Master & Super Agent BD`;
      if (
        !document.title ||
        /9xbet|chorki|velki/i.test(document.title) ||
        document.title.includes(siteName)
      ) {
        document.title = baseTitle;
      } else {
        document.title = replaceVelki(document.title);
      }

      // Dynamic Favicon
      if (siteIcon) {
        let favicon = document.querySelector("link[rel*='icon']");
        if (!favicon) {
          favicon = document.createElement('link');
          favicon.rel = 'icon';
          document.head.appendChild(favicon);
        }
        favicon.href = siteIcon;

        let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
        if (!appleIcon) {
          appleIcon = document.createElement('link');
          appleIcon.rel = 'apple-touch-icon';
          document.head.appendChild(appleIcon);
        }
        appleIcon.href = siteIcon;
      }
    }
  }, [siteName, siteIcon]);

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
        } catch (e) {}
      }
      return merged;
    });
    // Broadcast instantly to all tabs
    broadcastSync('SETTINGS_UPDATED', newSettings);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        siteName,
        siteLogo,
        siteIcon,
        complainWhatsapp,
        replaceVelki,
        updateSettings,
        refreshSettings: fetchSettings
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
