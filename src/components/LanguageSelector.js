import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' }
];

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'none',
          border: '1.5px solid #E2E8F0',
          borderRadius: 8,
          padding: '8px 12px',
          cursor: 'pointer',
          color: '#64748B',
          fontSize: 12,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          transition: 'all 0.2s',
          fontFamily: 'DM Sans, sans-serif'
        }}
      >
        🌐 <span>{currentLanguage.nativeName}</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>▼</span>
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 8,
          width: 200,
          maxHeight: 300,
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          border: '1px solid #E2E8F0',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)'
          }}>
            <h3 style={{ 
              fontFamily: 'Syne, sans-serif', 
              fontWeight: 700, 
              fontSize: 14, 
              color: '#1E2845', 
              margin: 0 
            }}>
              {t('language')}
            </h3>
          </div>

          {/* Language List */}
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => changeLanguage(language.code)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: i18n.language === language.code ? '#F0F9FF' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  borderBottom: '1px solid #F1F5F9'
                }}
                onMouseEnter={(e) => {
                  if (i18n.language !== language.code) {
                    e.target.style.background = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (i18n.language !== language.code) {
                    e.target.style.background = '#fff';
                  }
                }}
              >
                <div style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: '#1E2845',
                  marginBottom: 2
                }}>
                  {language.nativeName}
                </div>
                <div style={{
                  fontSize: 11,
                  color: '#64748B'
                }}>
                  {language.name}
                </div>
                {i18n.language === language.code && (
                  <div style={{
                    position: 'absolute',
                    right: 16,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#0A7EA4',
                    fontSize: 12
                  }}>
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showDropdown && (
        <div
          onClick={() => setShowDropdown(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}