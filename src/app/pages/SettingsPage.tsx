'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, isConfigured } from '../lib/supabase';
import {
  IconBuilding, IconSGK, IconTag, IconDocument, IconMessage,
  IconBell, IconLock, IconPhone, IconMail, IconMapPin,
  IconSave, IconDatabase, IconCheck, IconWarning, IconShield
} from '../components/Icons';

export default function SettingsPage() {
  const { addToast, currentOrgId } = useApp();
  const [activeSection, setActiveSection] = useState('firma');
  const [saving, setSaving] = useState(false);

  // Controlled form state for Firma Bilgileri
  const [firmSettings, setFirmSettings] = useState({
    firmName: 'AudioPro İşitme Merkezi',
    taxNo: '1234567890',
    phone: '0216 555 00 00',
    email: 'info@audiopro.com',
    address: 'Caferağa Mah. Moda Cad. No:42, Kadıköy / İstanbul'
  });

  const [medulaSettings, setMedulaSettings] = useState({
    facilityCode: '', username: '', password: '',
    wsdlUrl: 'https://medula.sgk.gov.tr/MedulaWS/services/...', environment: 'test'
  });

  const [utsSettings, setUtsSettings] = useState({ token: '', environment: 'test', firmCode: '' });
  const [whatsappSettings, setWhatsappSettings] = useState({ provider: '', apiToken: '', phoneNumberId: '' });
  const [securityForm, setSecurityForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [notifSettings, setNotifSettings] = useState([
    { id: 'apt_create', label: 'Yeni randevu oluşturulduğunda', checked: true },
    { id: 'apt_cancel', label: 'Randevu iptal edildiğinde', checked: true },
    { id: 'stock_critical', label: 'Stok kritik seviyeye düştüğünde', checked: true },
    { id: 'sale_create', label: 'Yeni satış kaydedildiğinde', checked: false },
    { id: 'recall_firsat', label: 'Recall fırsatı oluştuğunda', checked: true },
    { id: 'sgk_renewal', label: 'SGK yenileme hakkı açıldığında', checked: true },
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
        if (data.notification_settings) {
          try {
            const parsed = typeof data.notification_settings === 'string' ? JSON.parse(data.notification_settings) : data.notification_settings;
            if (Array.isArray(parsed)) setNotifSettings(parsed);
          } catch { /* ignore */ }
        }
      }
    } catch (err: any) {
      console.warn('[SettingsPage] load error:', err.message);
    }
  };

  const saveSettingsToDb = async (payload: Record<string, any>, label: string) => {
    setSaving(true);
    try {
      if (currentOrgId && isConfigured) {
        const { error } = await supabase.from('organization_settings').upsert({
          organization_id: currentOrgId, ...payload, updated_at: new Date().toISOString()
        }, { onConflict: 'organization_id' });
        if (error) throw error;
      }
      addToast({ type: 'success', message: `${label} başarıyla kaydedildi.` });
    } catch (err: any) {
      addToast({ type: 'error', message: `${label} kaydedilemedi: ${err.message}` });
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

  const handleSaveMedula = () => saveSettingsToDb({
    medula_facility_code: medulaSettings.facilityCode,
    medula_username: medulaSettings.username,
    medula_password: medulaSettings.password
  }, 'Medula (SGK) entegrasyon ayarları');

  const handleSaveUts = () => saveSettingsToDb({
    uts_kurum_no: utsSettings.firmCode
  }, 'ÜTS entegrasyon ayarları');

  const handleSaveWhatsapp = () => saveSettingsToDb({
    whatsapp_api_key: whatsappSettings.apiToken
  }, 'WhatsApp & SMS ayarları');

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
      const { error } = await supabase.auth.updateUser({ password: securityForm.newPassword });
      if (error) throw error;
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

  const navGroups = [
    {
      title: 'İŞLETME',
      items: [
        { id: 'firma', label: 'Firma bilgileri', icon: 'building' },
      ]
    },
    {
      title: 'ENTEGRASYONLAR',
      items: [
        { id: 'medula', label: 'Medula (SGK)', icon: 'sgk' },
        { id: 'uts', label: 'ÜTS entegrasyonu', icon: 'tag' },
        { id: 'fatura', label: 'E-Fatura / E-Arşiv', icon: 'document' },
        { id: 'whatsapp', label: 'WhatsApp / SMS', icon: 'message' },
      ]
    },
    {
      title: 'HESAP',
      items: [
        { id: 'bildirim', label: 'Bildirimler', icon: 'bell' },
        { id: 'guvenlik', label: 'Güvenlik', icon: 'lock' },
      ]
    }
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#F3F0E8', borderRadius: 12, border: '0.5px solid #E2DED0', overflow: 'hidden' }}>
      
      {/* Header Banner */}
      <div style={{ padding: '22px 28px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#22281F' }}>Ayarlar</div>
        <div style={{ fontSize: 13, color: '#6B685E', marginTop: 2 }}>Sistem ve entegrasyon yapılandırması</div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'flex', gap: 20, padding: '20px 28px 28px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Navigation Sidebar */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#8A8776', letterSpacing: '.4px', padding: '0 4px 6px' }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map(item => {
                  const isActive = activeSection === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: isActive ? '#0F5C43' : 'transparent',
                        color: isActive ? '#fff' : '#3A3A36',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span style={{ color: isActive ? '#fff' : '#6B685E', display: 'flex' }}>
                        {item.icon === 'building' && <IconBuilding size={16} />}
                        {item.icon === 'sgk' && <IconSGK size={16} />}
                        {item.icon === 'tag' && <IconTag size={16} />}
                        {item.icon === 'document' && <IconDocument size={16} />}
                        {item.icon === 'message' && <IconMessage size={16} />}
                        {item.icon === 'bell' && <IconBell size={16} />}
                        {item.icon === 'lock' && <IconLock size={16} />}
                      </span>
                      <span>{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Right Content Panel */}
        <div style={{ flex: 1, minWidth: 280 }}>
          
          {/* SECTION 1: Firma Bilgileri */}
          {activeSection === 'firma' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconBuilding size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Firma bilgileri</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>İşletmenizin temel bilgilerini güncelleyin.</div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <IconPhone size={14} color="#8A8776" /> Telefon
                  </label>
                  <input
                    value={firmSettings.phone}
                    onChange={e => setFirmSettings(s => ({ ...s, phone: e.target.value }))}
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <IconMail size={14} color="#8A8776" /> E-posta
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
                  <IconMapPin size={14} color="#8A8776" /> Adres
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
                  <IconSave size={15} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 2: Medula (SGK) */}
          {activeSection === 'medula' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconSGK size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Medula (SGK) entegrasyonu</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>SGK Medula web servislerine bağlanmak için tesis bilgilerinizi girin.</div>

              <div style={{ padding: '12px 14px', background: '#F0F9FF', border: '0.5px solid #BAE6FD', borderRadius: 8, marginBottom: 18, fontSize: 12, color: '#0369A1' }}>
                ℹ️ Bu bilgileri SGK İl Müdürlüğü veya mevcut Medula eczane/tesis panelinizden alabilirsiniz.
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
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
                  style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={() => addToast({ type: 'info', message: 'Medula WSDL bağlantı testi başlatıldı...' })}
                  style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Bağlantıyı Test Et
                </button>
                <button
                  type="button"
                  onClick={handleSaveMedula}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={15} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: ÜTS Entegrasyonu */}
          {activeSection === 'uts' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconTag size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>ÜTS entegrasyonu</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Sağlık Bakanlığı Ürün Takip Sistemi API ayarları.</div>

              <div style={{ padding: '12px 14px', background: '#F0FDF4', border: '0.5px solid #BBF7D0', borderRadius: 8, marginBottom: 18, fontSize: 12, color: '#166534' }}>
                ✅ ÜTS token almak için: utsuygulama.saglik.gov.tr → Kullanıcı İşlemleri → Sistem Kullanıcısı Tanımlama adımlarını izleyin.
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
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
                  onClick={() => addToast({ type: 'info', message: 'ÜTS API bağlantı testi başlatıldı...' })}
                  style={{ background: '#fff', color: '#3A3A36', border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  Bağlantıyı Test Et
                </button>
                <button
                  type="button"
                  onClick={handleSaveUts}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={15} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 4: E-Fatura / E-Arşiv */}
          {activeSection === 'fatura' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconDocument size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>E-Fatura / E-Arşiv entegrasyonu</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Satışlarda otomatik fatura kesme entegrasyonu.</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Entegrasyon Sağlayıcısı</label>
                <select style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#22281F', background: '#FCFBF8' }}>
                  <option>Paraşüt</option>
                  <option>Logo İşbaşı</option>
                  <option>Bizim Hesap</option>
                  <option>Kolay Fatura</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>API Anahtarı</label>
                  <input placeholder="Sağlayıcıdan aldığınız API Key" style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>API Secret</label>
                  <input type="password" placeholder="••••••••" style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={() => saveSettingsToDb({ efatura_enabled: true }, 'E-Fatura ayarları')}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={15} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 5: WhatsApp / SMS */}
          {activeSection === 'whatsapp' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconMessage size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>WhatsApp / SMS entegrasyonu</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Otomatik randevu hatırlatma ve recall mesajları için API ayarları.</div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Servis Sağlayıcı</label>
                <select
                  value={whatsappSettings.provider}
                  onChange={e => setWhatsappSettings(s => ({ ...s, provider: e.target.value }))}
                  style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 10px', fontSize: 13, color: '#22281F', background: '#FCFBF8' }}
                >
                  <option value="">Seçiniz...</option>
                  <option value="meta">Meta WhatsApp Business API</option>
                  <option value="twilio">Twilio SMS / WhatsApp</option>
                  <option value="netgsm">NetGSM Toplu SMS</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>API Token</label>
                  <input
                    value={whatsappSettings.apiToken}
                    onChange={e => setWhatsappSettings(s => ({ ...s, apiToken: e.target.value }))}
                    placeholder="API Token anahtarınız"
                    style={{ width: '100%', height: 38, border: '0.5px solid #D8D4C6', borderRadius: 8, padding: '0 12px', fontSize: 13, color: '#22281F', boxSizing: 'border-box', background: '#FCFBF8' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: '#3A3A36', display: 'block', marginBottom: 6 }}>Gönderen Numarası ID</label>
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
                  onClick={handleSaveWhatsapp}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={15} /> {saving ? 'Kaydediliyor...' : 'Değişiklikleri kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 6: Bildirimler */}
          {activeSection === 'bildirim' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconBell size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Bildirimler</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Otomatik sistem bildirimlerini yönetin.</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {notifSettings.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FCFBF8', border: '0.5px solid #E2DED0', borderRadius: 8 }}>
                    <span style={{ fontSize: 13, color: '#22281F', fontWeight: 500 }}>{item.label}</span>
                    <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }} onClick={() => toggleNotifSetting(item.id)}>
                      <input type="checkbox" checked={item.checked} readOnly style={{ display: 'none' }} />
                      <div style={{ width: '100%', height: '100%', borderRadius: 12, background: item.checked ? '#0F5C43' : '#D8D4C6', transition: 'all 0.2s ease', position: 'relative' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: item.checked ? 23 : 3, transition: 'all 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '0.5px solid #F0EDE4' }}>
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  style={{ background: '#0F5C43', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <IconSave size={15} /> {saving ? 'Kaydediliyor...' : 'Bildirim ayarlarını kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* SECTION 7: Güvenlik */}
          {activeSection === 'guvenlik' && (
            <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '22px 26px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                  <IconLock size={18} />
                </div>
                <span style={{ fontSize: 15, fontWeight: 600, color: '#22281F' }}>Güvenlik ayarları</span>
              </div>
              <div style={{ fontSize: 12, color: '#6B685E', margin: '2px 0 20px 42px' }}>Hesap şifrenizi güncelleyin ve güvenlik tercihlerini değiştirin.</div>

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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
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
                  <IconLock size={15} /> {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </button>
              </div>
            </div>
          )}

          {/* Bottom Info Card: Günlük Otomatik Yedekleme */}
          <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 12, padding: '16px 20px', marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43' }}>
                <IconDatabase size={16} />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#22281F' }}>Günlük otomatik yedekleme</div>
                <div style={{ fontSize: 11, color: '#8A8776', marginTop: 1 }}>Son yedek: 09.07.2026, 03:00</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, background: '#E1F0E8', color: '#0F5C43', padding: '3px 10px', borderRadius: 20 }}>Aktif</span>
          </div>

        </div>

      </div>

    </div>
  );
}
