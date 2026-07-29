'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { IconWarning, IconCheck } from './Icons';

/**
 * NetworkStatusNotifier - Monitors online/offline network state
 * Provides instant user feedback and offline resilience warnings.
 */
export function NetworkStatusNotifier() {
  const { addToast } = useApp();
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      addToast({
        type: 'success',
        message: 'İnternet bağlantısı yeniden sağlandı. Veriler senkronize ediliyor.'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'warning',
        message: 'İnternet bağlantısı kesildi! Çevrimdışı moddasınız, değişiklikler yerel bellekte saklanıyor.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        backgroundColor: '#fef2f2',
        border: '1px solid #fca5a5',
        color: '#991b1b',
        borderRadius: 8,
        padding: '10px 16px',
        fontSize: '0.84rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        zIndex: 9999
      }}
    >
      <IconWarning size={18} />
      <span>Çevrimdışı Mod — İnternet Bağlantısı Yok</span>
    </div>
  );
}
