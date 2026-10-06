'use client';

import React, { useState, useEffect } from 'react';
import styles from './SettingsPage.module.css';
import { useApp } from '../context/AppContext';
import { supabase, isConfigured } from '../lib/supabase';
import {
  IconBuilding, IconSGK, IconTag, IconDocument, IconMessage,
  IconBell, IconLock, IconPhone, IconMail, IconMapPin,
  IconSave, IconDatabase, IconShield, IconPlug,
  IconCalendar, IconRecall, IconStock, IconCash, IconInfo, IconSettings
} from '../components/Icons';
import { IntegrationService } from '../services/IntegrationService';

export default function SettingsPage() {
  const { addToast, currentOrgId, currentUser } = useApp();
  const [activeSection, setActiveSection] = useState('firma');
  const [saving, setSaving] = useState(false);

  // Controlled form state for Firma Bilgileri
  const [firmSettings, setFirmSettings] = useState({
    firmName: '',
    taxNo: '',
    phone: '',
    email: '',
    address: ''
  });

  const [medulaSettings, setMedulaSettings] = useState({
    facilityCode: '', username: '', password: '',
    wsdlUrl: '', environment: 'test'
  });

  const [utsSettings, setUtsSettings] = useState({ token: '', environment: 'test', firmCode: '' });
  const [faturaSettings, setFaturaSettings] = useState({ provider: 'Paraşüt', apiKey: '', apiSecret: '', seriNo: '', baslangicSiraNo: '' });
  const [whatsappSettings, setWhatsappSettings] = useState({ provider: 'meta', apiToken: '', phoneNumberId: '', isConnected: false });
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [notifSettings, setNotifSettings] = useState([
    { id: 'apt_create', label: 'Yeni randevu oluşturulduğunda', icon: 'calendar', checked: true },
    { id: 'apt_cancel', label: 'Randevu iptal edildiğinde', icon: 'calendar', checked: true },
    { id: 'stock_critical', label: 'Stok kritik seviyeye düştüğünde', icon: 'stock', checked: true },
    { id: 'sale_create', label: 'Yeni satış kaydedildiğinde', icon: 'cash', checked: false },
    { id: 'recall_firsat', label: 'Recall fırsatı oluştuğunda', icon: 'recall', checked: true },
    { id: 'sgk_renewal', label: 'SGK yenileme hakkı açıldığında', icon: 'shield', checked: true },
  ]);

  // DB'den ayarları yükle
  useEffect(() => {
    if (currentOrgId && isConfigured) {
      loadSettings();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrgId]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', currentOrgId)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setFirmSettings(s => ({
          firmName: data.firm_name || s.firmName,
          taxNo: data.tax_no || s.taxNo,
          phone: data.phone || s.phone,
          email: data.email || s.email,
          address: data.address || s.address
        }));
        if (data.efatura_provider) {
          setFaturaSettings(s => ({ ...s, provider: data.efatura_provider }));
        } else if (data.notification_settings) {
          try {
            const parsed = typeof data.notification_settings === 'string' ? JSON.parse(data.notification_settings) : data.notification_settings;
            if (Array.isArray(parsed)) setNotifSettings(parsed);
            else if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.items)) setNotifSettings(parsed.items);
              if (parsed.efatura_provider) setFaturaSettings(s => ({ ...s, provider: parsed.efatura_provider }));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      console.warn('[SettingsPage] Settings could not be loaded.');
    }
  };

  const saveSettingsToDb = async (payload: Record<string, any>, label: string) => {
    if (!currentOrgId || !isConfigured) {
      addToast({ type: 'error', message: `${label} kaydedilemedi: Aktif firma veritabanı bağlantısı yok.` });
      return;
    }
    setSaving(true);
    try {
      let { error } = await supabase.from('organization_settings').upsert({
        organization_id: currentOrgId, ...payload, updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id' });

      if (error && (error.message?.includes('efatura_provider') || error.code === 'PGRST204' || error.code === '42703')) {
        const { efatura_provider, ...fallbackPayload } = payload;
        const res = await supabase.from('organization_settings').upsert({
          organization_id: currentOrgId,
          ...fallbackPayload,
          efatura_enabled: Boolean(efatura_provider && efatura_provider !== 'Yok'),
          notification_settings: JSON.stringify({
            items: notifSettings,
            efatura_provider: efatura_provider || 'Yok',
          }),
          updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id' });
        error = res.error;
      }

      if (error) throw error;
      addToast({ type: 'success', message: `${label} başarıyla kaydedildi.` });
    } catch (err: any) {
      addToast({ type: 'error', message: `${label} kaydedilemedi: ${err?.message || 'Lütfen tekrar deneyin.'}` });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFirma = () => saveSettingsToDb({
    firm_name: firmSettings.firmName,
    tax_no: firmSettings.taxNo,
    phone: firmSettings.phone,
    email: firmSettings.email,
    address: firmSettings.address
  }, 'Firma bilgileri');

  const [testingService, setTestingService] = useState<string | null>(null);

  const handleTestMedula = async () => {
    setTestingService('medula');
    try {
      const res = await IntegrationService.testMedulaConnection(medulaSettings.wsdlUrl, medulaSettings.facilityCode);
      addToast({ type: res.status === 'online' ? 'success' : 'warning', message: res.message });
    } finally {
      setTestingService(null);
    }
  };

  const handleTestUts = async () => {
    setTestingService('uts');
    try {
      const res = await IntegrationService.testUtsConnection(utsSettings.firmCode, utsSettings.token);
      addToast({ type: res.status === 'online' ? 'success' : 'warning', message: res.message });
    } finally {
      setTestingService(null);
    }
  };

  const handleTestFatura = async () => {
    setTestingService('fatura');
    try {
      const res = await IntegrationService.testEfaturaConnection(faturaSettings.provider, faturaSettings.apiKey);
      addToast({ type: res.status === 'online' ? 'success' : 'warning', message: res.message });
    } finally {
      setTestingService(null);
    }
  };

  const handleTestWhatsapp = async () => {
    setTestingService('whatsapp');
    try {
      const res = await IntegrationService.testWhatsappConnection(whatsappSettings.provider, whatsappSettings.phoneNumberId);
      setWhatsappSettings(s => ({ ...s, isConnected: res.status === 'online' }));
      addToast({ type: res.status === 'online' ? 'success' : 'warning', message: res.message });
    } finally {
      setTestingService(null);
    }
  };

  const handleSaveMedula = () => saveSettingsToDb({
    medula_facility_code: medulaSettings.facilityCode
  }, 'Medula tesis kodu');

  const handleSaveUts = () => saveSettingsToDb({
    uts_kurum_no: utsSettings.firmCode
  }, 'ÜTS entegrasyon ayarları');

  const handleSaveFatura = () => saveSettingsToDb({
    efatura_provider: faturaSettings.provider,
    efatura_enabled: Boolean(faturaSettings.provider && faturaSettings.provider !== 'Yok'),
    notification_settings: JSON.stringify({
      items: notifSettings,
      efatura_provider: faturaSettings.provider,
    }),
  }, 'E-Fatura sağlayıcı tercihi');

  const handleSaveWhatsapp = () => addToast({
    type: 'info',
    message: 'WhatsApp bağlantısı henüz uygulanmadı. API anahtarı kaydedilmedi ve mesaj gönderilmedi.'
  });

  const handleSaveNotifications = () => saveSettingsToDb({
    notification_settings: JSON.stringify(notifSettings)
  }, 'Bildirim ayarları');

  const handleChangePassword = async () => {
    if (!securityForm.newPassword || securityForm.newPassword.length < 8) {
      addToast({ type: 'warning', message: 'Yeni şifre en az 8 karakter olmalıdır.' });
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      addToast({ type: 'warning', message: 'Yeni şifreler eşleşmiyor.' });
      return;
    }
    setSaving(true);
    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const refresh = await supabase.auth.refreshSession();
        session = refresh.data.session;
      }
      let success = false;
      if (session) {
        const { error } = await supabase.auth.updateUser({ password: securityForm.newPassword });
        if (!error) {
          success = true;
        } else if (!error.message.includes('Auth session missing') && !error.message.includes('session missing')) {
          throw error;
        }
      }
      if (!success) {
        const token = session?.access_token || '';
        const res = await fetch('/api/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            newPassword: securityForm.newPassword,
            userId: currentUser?.id
          })
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) {
          throw new Error(resData.error || 'Şifre güncellenemedi.');
        }
      }
      addToast({ type: 'success', message: 'Şifreniz başarıyla güncellendi.' });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      addToast({ type: 'error', message: `Şifre güncellenemedi: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifSetting = (id: string) => {
    setNotifSettings(notifSettings.map(n => n.id === id ? { ...n, checked: !n.checked } : n));
  };

  const sections = [
    { id: 'firma', label: 'Firma Bilgileri', icon: <IconBuilding size={17} /> },
    { id: 'medula', label: 'Medula (SGK)', icon: <IconSGK size={17} /> },
    { id: 'uts', label: 'ÜTS Entegrasyonu', icon: <IconTag size={17} /> },
    { id: 'fatura', label: 'E-Fatura / E-Arşiv', icon: <IconDocument size={17} /> },
    { id: 'whatsapp', label: 'WhatsApp / SMS', icon: <IconMessage size={17} /> },
    { id: 'bildirim', label: 'Bildirimler', icon: <IconBell size={17} /> },
    { id: 'guvenlik', label: 'Güvenlik', icon: <IconLock size={17} /> },
  ];

  return (
    <div className={styles.settingsPage}>
      <header className={styles.pageHeading}>
        <div className={styles.headingIcon}><IconSettings size={23} /></div>
        <div>
          <h1>Ayarlar</h1>
          <p>İşletmenizin temel bilgilerini ve sistem tercihlerini buradan yönetin.</p>
        </div>
      </header>

      <nav className={styles.tabs} aria-label="Ayar kategorileri">
        {sections.map(section => (
          <button
            type="button"
            key={section.id}
            className={`${styles.tab} ${activeSection === section.id ? styles.activeTab : ''}`}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onClick={() => setActiveSection(section.id)}
          >
            {section.icon}<span>{section.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.contentPanel}>
        {['medula', 'uts', 'fatura', 'whatsapp'].includes(activeSection) && (
          <div className={styles.connectionNotice} role="status">
            <IconInfo size={17} />
            <span>Bu servis bağlantısı henüz uygulanmadı. Test düğmeleri dış servise bağlanmaz. Gizli parola ve API anahtarları kaydedilmez; yalnızca firma kodu veya sağlayıcı tercihi gibi gizli olmayan bilgiler saklanabilir.</span>
          </div>
        )}
          
          {/* SECTION 1: Firma Bilgileri */}
          {activeSection === 'firma' && (
            <>
              <div className={styles.companyLayout}>
              <div className={`${styles.card} ${styles.companyForm}`} style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                    <IconBuilding size={16} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Firma bilgileri</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>İşletmenizin temel bilgilerini güncelleyin.</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Firma adı</label>
                    <input
                      value={firmSettings.firmName}
                      onChange={e => setFirmSettings(s => ({ ...s, firmName: e.target.value }))}
                      style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Vergi no</label>
                    <input
                      value={firmSettings.taxNo}
                      onChange={e => setFirmSettings(s => ({ ...s, taxNo: e.target.value }))}
                      style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <IconPhone size={13} color="#8A8776" /> Telefon
                    </label>
                    <input
                      value={firmSettings.phone}
                      onChange={e => setFirmSettings(s => ({ ...s, phone: e.target.value }))}
                      style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                      <IconMail size={13} color="#8A8776" /> E-posta
                    </label>
                    <input
                      value={firmSettings.email}
                      onChange={e => setFirmSettings(s => ({ ...s, email: e.target.value }))}
                      style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <IconMapPin size={13} color="#8A8776" /> Adres
                  </label>
                  <textarea
                    value={firmSettings.address}
                    onChange={e => setFirmSettings(s => ({ ...s, address: e.target.value }))}
                    style={{ width: '100%', height: 64, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8', fontFamily: 'inherit', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                  <button
                    type="button"
                    onClick={loadSettings}
                    style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFirma}
                    disabled={saving}
                    style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <IconSave size={13} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                  </button>
                </div>
              </div>

              <aside className={`${styles.card} ${styles.companyPreview}`}>
                <h2>Kartvizit / Fatura Önizleme</h2>
                <p>Firma bilgilerinizin belgelerde görünecek örnek görünümü.</p>
                <div className={styles.previewPaper}>
                  <div className={styles.previewMark}><IconBuilding size={24} /></div>
                  <strong>{firmSettings.firmName || 'Firma adı girilmedi'}</strong>
                  <span>{firmSettings.taxNo ? `Vergi No: ${firmSettings.taxNo}` : 'Vergi numarası eklenmedi'}</span>
                  <span>{firmSettings.address || 'Adres eklenmedi'}</span>
                  <span>{firmSettings.phone || 'Telefon eklenmedi'}</span>
                  <span>{firmSettings.email || 'E-posta eklenmedi'}</span>
                </div>
                <div className={styles.previewNote}>
                  <IconInfo size={17} />
                  <span>Önizleme, girdiğiniz bilgileri anlık gösterir. Kaydedilmemiş bilgiler sisteme uygulanmaz.</span>
                </div>
              </aside>
              </div>

              <section className={`${styles.card} ${styles.hoursNotice}`}>
                <div className={styles.hoursIcon}><IconCalendar size={18} /></div>
                <div>
                  <h2>Çalışma Saatleri</h2>
                  <p>Çalışma saatleri şu anda veritabanında saklanmıyor. Bu nedenle kaybolabilecek bir saat formu yerine, bu ayarın henüz kullanıma açılmadığını belirtiyoruz.</p>
                </div>
                <span>Henüz yapılandırılmadı</span>
              </section>

              {/* Compact Otomatik Yedekleme Kartı */}
              <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '16px 20px', marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                    <IconDatabase size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#22281F' }}>Veritabanı yedekleme durumu</div>
                    <div style={{ fontSize: 11, color: '#8A8776' }}>Durum ve tarih Supabase panelinden kontrol edilir.</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#F0EDE4', color: '#6B685E', padding: '3px 10px', borderRadius: 20 }}>Doğrulanmadı</span>
              </div>
            </>
          )}

          {/* SECTION 2: Medula (SGK) */}
          {activeSection === 'medula' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconShield size={16} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Medula (SGK)</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>SGK Medula web servislerine bağlanmak için tesis bilgilerinizi girin.</div>

              {/* Bilgi Kutusu (Mavi tonlu: #EAF1FB bg, #C7DBF2 border, #1F4E85 text) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#EAF1FB', border: '0.5px solid #C7DBF2', borderRadius: 8, marginBottom: 18, fontSize: 12, color: '#1F4E85' }}>
                <IconInfo size={16} color="#1F4E85" />
                <span>Bu bilgileri SGK İl Müdürlüğü veya mevcut Medula eczane/tesis panelinizden alabilirsiniz.</span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Tesis Kodu</label>
                <input
                  value={medulaSettings.facilityCode}
                  onChange={e => setMedulaSettings(s => ({ ...s, facilityCode: e.target.value }))}
                  placeholder="SGK tarafından atanan tesis kodu"
                  style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Medula Kullanıcı Adı</label>
                  <input
                    value={medulaSettings.username}
                    onChange={e => setMedulaSettings(s => ({ ...s, username: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Medula Şifresi</label>
                  <input
                    type="password"
                    value={medulaSettings.password}
                    onChange={e => setMedulaSettings(s => ({ ...s, password: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>WSDL Endpoint URL</label>
                <input
                  value={medulaSettings.wsdlUrl}
                  onChange={e => setMedulaSettings(s => ({ ...s, wsdlUrl: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 12, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8', fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={handleTestMedula}
                  disabled={testingService === 'medula'}
                  style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconPlug size={14} color="#6B685E" /> {testingService === 'medula' ? 'Test ediliyor...' : 'Bağlantıyı test et'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveMedula}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={13} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: ÜTS Entegrasyonu */}
          {activeSection === 'uts' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconTag size={16} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>ÜTS entegrasyonu</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Sağlık Bakanlığı Ürün Takip Sistemi API ayarları.</div>

              {/* Bilgi Kutusu (Yeşil tonlu: #F0FDF4 bg, #BBF7D0 border, #166534 text) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#F0FDF4', border: '0.5px solid #BBF7D0', borderRadius: 8, marginBottom: 18, fontSize: 12, color: '#166534' }}>
                <span>✅ ÜTS token almak için: utsuygulama.saglik.gov.tr → Kullanıcı İşlemleri → Sistem Kullanıcısı Tanımlama adımlarını izleyin.</span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>ÜTS Token (API Anahtarı)</label>
                <textarea
                  value={utsSettings.token}
                  onChange={e => setUtsSettings(s => ({ ...s, token: e.target.value }))}
                  placeholder="ÜTS panelinden aldığınız token kodunu buraya yapıştırın..."
                  style={{ width: '100%', height: 60, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8', fontFamily: 'monospace', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Ortam</label>
                  <select
                    value={utsSettings.environment}
                    onChange={e => setUtsSettings(s => ({ ...s, environment: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#22281F', background: '#FCFBF8' }}
                  >
                    <option value="test">Test Ortamı</option>
                    <option value="production">Canlı Ortam</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Firma Kodu</label>
                  <input
                    value={utsSettings.firmCode}
                    onChange={e => setUtsSettings(s => ({ ...s, firmCode: e.target.value }))}
                    placeholder="ÜTS Kurum Kodu"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={handleTestUts}
                  disabled={testingService === 'uts'}
                  style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconPlug size={14} color="#6B685E" /> {testingService === 'uts' ? 'Test ediliyor...' : 'Bağlantıyı test et'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveUts}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={13} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: E-Fatura / E-Arşiv */}
          {activeSection === 'fatura' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconDocument size={16} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>E-Fatura / E-Arşiv</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Satışlarda otomatik fatura kesme entegrasyonu.</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Entegrasyon Sağlayıcısı</label>
                <select
                  value={faturaSettings.provider}
                  onChange={e => setFaturaSettings(s => ({ ...s, provider: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#22281F', background: '#FCFBF8' }}
                >
                  <option value="Paraşüt">Paraşüt</option>
                  <option value="Logo İşbaşı">Logo İşbaşı</option>
                  <option value="Bizim Hesap">Bizim Hesap</option>
                  <option value="Kolay Fatura">Kolay Fatura</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>API Anahtarı</label>
                  <input
                    value={faturaSettings.apiKey}
                    onChange={e => setFaturaSettings(s => ({ ...s, apiKey: e.target.value }))}
                    placeholder="Sağlayıcıdan aldığınız API Key"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>API Secret</label>
                  <input
                    type="password"
                    value={faturaSettings.apiSecret}
                    onChange={e => setFaturaSettings(s => ({ ...s, apiSecret: e.target.value }))}
                    placeholder="••••••••"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Fatura Seri No</label>
                  <input
                    value={faturaSettings.seriNo}
                    onChange={e => setFaturaSettings(s => ({ ...s, seriNo: e.target.value }))}
                    placeholder="Örn: EP"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Başlangıç Sıra No</label>
                  <input
                    value={faturaSettings.baslangicSiraNo}
                    onChange={e => setFaturaSettings(s => ({ ...s, baslangicSiraNo: e.target.value }))}
                    placeholder="Örn: 1001"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={handleTestFatura}
                  disabled={testingService === 'fatura'}
                  style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconPlug size={14} color="#6B685E" /> {testingService === 'fatura' ? 'Test ediliyor...' : 'Bağlantıyı test et'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveFatura}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={13} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: WhatsApp / SMS */}
          {activeSection === 'whatsapp' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                    <IconMessage size={16} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>WhatsApp / SMS</span>
                </div>
                {/* Durum Rozeti (Bağlı değil / Bağlı) */}
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  background: whatsappSettings.isConnected ? '#E1F0E8' : '#F0EDE4',
                  color: whatsappSettings.isConnected ? '#0F5C43' : '#8A8776',
                  padding: '3px 10px',
                  borderRadius: 20
                }}>
                  {whatsappSettings.isConnected ? 'Bağlı' : 'Bağlı değil'}
                </span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Otomatik randevu hatırlatma ve recall mesajları için API ayarları.</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Servis Sağlayıcı</label>
                <select
                  value={whatsappSettings.provider}
                  onChange={e => setWhatsappSettings(s => ({ ...s, provider: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#22281F', background: '#FCFBF8' }}
                >
                  <option value="meta">Meta WhatsApp Business API</option>
                  <option value="twilio">Twilio SMS / WhatsApp</option>
                  <option value="netgsm">NetGSM Toplu SMS</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>API Token</label>
                  <input
                    type="password"
                    value={whatsappSettings.apiToken}
                    onChange={e => setWhatsappSettings(s => ({ ...s, apiToken: e.target.value }))}
                    placeholder="••••••••"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Telefon Numarası ID</label>
                  <input
                    value={whatsappSettings.phoneNumberId}
                    onChange={e => setWhatsappSettings(s => ({ ...s, phoneNumberId: e.target.value }))}
                    placeholder="WhatsApp Phone Number ID"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={handleTestWhatsapp}
                  disabled={testingService === 'whatsapp'}
                  style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconPlug size={14} color="#6B685E" /> {testingService === 'whatsapp' ? 'Test ediliyor...' : 'Bağlantıyı test et'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveWhatsapp}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={13} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: Bildirimler */}
          {activeSection === 'bildirim' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconBell size={16} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Bildirimler</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Otomatik sistem bildirim tercihlerini yönetin.</div>

              {/* Toggle List Pattern */}
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
                {notifSettings.map((item, i) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 4px',
                      borderBottom: i < notifSettings.length - 1 ? '0.5px solid #F0EDE4' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                        {item.icon === 'calendar' && <IconCalendar size={15} />}
                        {item.icon === 'stock' && <IconStock size={15} />}
                        {item.icon === 'cash' && <IconCash size={15} />}
                        {item.icon === 'recall' && <IconRecall size={15} />}
                        {item.icon === 'shield' && <IconShield size={15} />}
                      </div>
                      <span style={{ fontSize: 12.5, color: '#22281F', fontWeight: 500 }}>{item.label}</span>
                    </div>

                    {/* Toggle Switch: On #0F5C43, Off #D8D4C6 */}
                    <label style={{ position: 'relative', width: 42, height: 22, cursor: 'pointer' }} onClick={() => toggleNotifSetting(item.id)}>
                      <input type="checkbox" checked={item.checked} readOnly style={{ display: 'none' }} />
                      <div style={{ width: '100%', height: '100%', borderRadius: 12, background: item.checked ? '#0F5C43' : '#D8D4C6', transition: 'all 0.2s ease', position: 'relative' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: item.checked ? 23 : 3, transition: 'all 0.2s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={13} /> {saving ? 'Kaydediliyor...' : 'Bildirim ayarlarını kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 7: Güvenlik (İki Ayrı Kart) */}
          {activeSection === 'guvenlik' && (
            <>
              {/* Kart 1: Şifre Değiştir */}
              <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                    <IconLock size={16} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Şifre değiştir</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Hesap güvenliğiniz için düzenli olarak şifrenizi güncelleyin.</div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Mevcut Şifre</label>
                  <input
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={e => setSecurityForm(s => ({ ...s, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Yeni Şifre</label>
                    <input
                      type="password"
                      value={securityForm.newPassword}
                      onChange={e => setSecurityForm(s => ({ ...s, newPassword: e.target.value }))}
                      placeholder="En az 8 karakter"
                      style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Yeni Şifre (Tekrar)</label>
                    <input
                      type="password"
                      value={securityForm.confirmPassword}
                      onChange={e => setSecurityForm(s => ({ ...s, confirmPassword: e.target.value }))}
                      placeholder="Şifreyi tekrar girin"
                      style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                  <button
                    type="button"
                    onClick={handleChangePassword}
                    disabled={saving}
                    style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <IconLock size={13} /> {saving ? 'Güncelleniyor...' : 'Şifreyi güncelle'}
                  </button>
                </div>
              </div>

              {/* Kart 2: Otomatik Yedekleme (Ayrı Kompakt Kart) */}
              <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '16px 20px', marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                    <IconDatabase size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500, color: '#22281F' }}>Veritabanı yedekleme durumu</div>
                    <div style={{ fontSize: 11, color: '#8A8776' }}>Durum ve tarih Supabase panelinden kontrol edilir.</div>
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#F0EDE4', color: '#6B685E', padding: '3px 10px', borderRadius: 20 }}>Doğrulanmadı</span>
              </div>
            </>
          )}

      </div>
    </div>
  );
}
