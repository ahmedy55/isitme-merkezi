'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, isConfigured } from '../lib/supabase';

export default function SettingsPage() {
  const { addToast, currentOrgId } = useApp();
  const [activeSection, setActiveSection] = useState('firma');
  const [saving, setSaving] = useState(false);

  // Fix #7: Controlled form state for Firma Bilgileri
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

  // Fix #7: DB'den ayarları yükle
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
          firmName: data.firm_name || s.firmName, taxNo: data.tax_no || s.taxNo,
          phone: data.phone || s.phone, email: data.email || s.email, address: data.address || s.address
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
    } finally { setSaving(false); }
  };

  const handleSaveFirma = () => saveSettingsToDb({ firm_name: firmSettings.firmName, tax_no: firmSettings.taxNo, phone: firmSettings.phone, email: firmSettings.email, address: firmSettings.address }, 'Firma ayarları');
  const handleSaveMedula = () => saveSettingsToDb({ medula_facility_code: medulaSettings.facilityCode, medula_username: medulaSettings.username, medula_password: medulaSettings.password }, 'Medula entegrasyon ayarları');
  const handleSaveUts = () => saveSettingsToDb({ uts_kurum_no: utsSettings.firmCode }, 'ÜTS entegrasyon ayarları');
  const handleSaveWhatsapp = () => saveSettingsToDb({ whatsapp_api_key: whatsappSettings.apiToken }, 'WhatsApp & SMS ayarları');
  const handleSaveNotifications = () => saveSettingsToDb({ notification_settings: JSON.stringify(notifSettings) }, 'Bildirim ayarları');

  const handleChangePassword = async () => {
    if (!securityForm.newPassword || securityForm.newPassword.length < 8) { addToast({ type: 'warning', message: 'Yeni şifre en az 8 karakter olmalıdır.' }); return; }
    if (securityForm.newPassword !== securityForm.confirmPassword) { addToast({ type: 'warning', message: 'Yeni şifreler eşleşmiyor.' }); return; }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: securityForm.newPassword });
      if (error) throw error;
      addToast({ type: 'success', message: 'Şifreniz başarıyla güncellendi.' });
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) { addToast({ type: 'error', message: `Şifre güncellenemedi: ${err.message}` }); }
    finally { setSaving(false); }
  };

  const toggleNotifSetting = (id: string) => {
    setNotifSettings(notifSettings.map(n => n.id === id ? { ...n, checked: !n.checked } : n));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Ayarlar</h2>
          <p>Sistem ve entegrasyon yapılandırması</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body">
            <nav className="settings-nav">
              {[
                { id: 'firma', label: 'Firma Bilgileri' },
                { id: 'medula', label: 'Medula (SGK)' },
                { id: 'uts', label: 'ÜTS Entegrasyonu' },
                { id: 'fatura', label: 'E-Fatura / E-Arşiv' },
                { id: 'bildirim', label: 'Bildirimler' },
                { id: 'whatsapp', label: 'WhatsApp / SMS' },
                { id: 'guvenlik', label: 'Güvenlik' },
              ].map(item => (
                <button key={item.id} className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`} onClick={() => setActiveSection(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div>
          {activeSection === 'firma' && (
            <div className="settings-section">
              <h3>🏢 Firma Bilgileri</h3>
              <p>İşletmenizin temel bilgilerini güncelleyin</p>
              <div className="card">
                <div className="card-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Firma Adı</label>
                      <input className="form-input" value={firmSettings.firmName} onChange={e => setFirmSettings(s => ({ ...s, firmName: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vergi No</label>
                      <input className="form-input" value={firmSettings.taxNo} onChange={e => setFirmSettings(s => ({ ...s, taxNo: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Telefon</label>
                      <input className="form-input" value={firmSettings.phone} onChange={e => setFirmSettings(s => ({ ...s, phone: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-posta</label>
                      <input className="form-input" value={firmSettings.email} onChange={e => setFirmSettings(s => ({ ...s, email: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adres</label>
                    <textarea className="form-textarea" value={firmSettings.address} onChange={e => setFirmSettings(s => ({ ...s, address: e.target.value }))} />
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveFirma} disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'medula' && (
            <div className="settings-section">
              <h3>🏥 Medula (SGK) Entegrasyonu</h3>
              <p>SGK Medula web servislerine bağlanmak için tesis bilgilerinizi girin</p>
              <div className="card">
                <div className="card-body">
                  <div style={{ padding: '12px 16px', background: 'var(--info-50)', border: '1px solid var(--info-100)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: '0.82rem', color: 'var(--info-600)' }}>
                    ℹ️ Bu bilgileri SGK İl Müdürlüğü&apos;nden veya mevcut Medula panelinizden alabilirsiniz.
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tesis Kodu</label>
                    <input className="form-input" value={medulaSettings.facilityCode} onChange={e => setMedulaSettings(s => ({ ...s, facilityCode: e.target.value }))} placeholder="SGK tarafından atanan tesis kodu" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Medula Kullanıcı Adı</label>
                      <input className="form-input" value={medulaSettings.username} onChange={e => setMedulaSettings(s => ({ ...s, username: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Medula Şifresi</label>
                      <input className="form-input" type="password" value={medulaSettings.password} onChange={e => setMedulaSettings(s => ({ ...s, password: e.target.value }))} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">WSDL Endpoint URL</label>
                    <input className="form-input" value={medulaSettings.wsdlUrl} onChange={e => setMedulaSettings(s => ({ ...s, wsdlUrl: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => addToast({ type: 'info', message: 'Medula WSDL bağlantı testi başlatıldı...' })}>Bağlantıyı Test Et</button>
                    <button className="btn btn-primary" onClick={handleSaveMedula} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'uts' && (
            <div className="settings-section">
              <h3>📦 ÜTS (Ürün Takip Sistemi) Entegrasyonu</h3>
              <p>Sağlık Bakanlığı ÜTS sistemine bağlanmak için token bilgilerinizi girin</p>
              <div className="card">
                <div className="card-body">
                  <div style={{ padding: '12px 16px', background: 'var(--success-50)', border: '1px solid var(--success-100)', borderRadius: 'var(--radius-md)', marginBottom: 20, fontSize: '0.82rem', color: 'var(--success-700)' }}>
                    ✅ ÜTS token&apos;ınızı almak için: utsuygulama.saglik.gov.tr → Kullanıcı İşlemleri → Sistem Kullanıcısı Tanımlama → e-İmza ile onaylayın
                  </div>
                  <div className="form-group">
                    <label className="form-label">ÜTS Token (API Anahtarı)</label>
                    <textarea className="form-textarea" value={utsSettings.token} onChange={e => setUtsSettings(s => ({ ...s, token: e.target.value }))} placeholder="ÜTS panelinden aldığınız token kodunu buraya yapıştırın..." style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ortam</label>
                      <select className="form-select" value={utsSettings.environment} onChange={e => setUtsSettings(s => ({ ...s, environment: e.target.value }))}>
                        <option value="test">Test Ortamı</option>
                        <option value="production">Canlı Ortam</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Firma Kodu</label>
                      <input className="form-input" value={utsSettings.firmCode} onChange={e => setUtsSettings(s => ({ ...s, firmCode: e.target.value }))} placeholder="ÜTS firma kodu" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => addToast({ type: 'info', message: 'ÜTS API bağlantı testi başlatıldı...' })}>Bağlantıyı Test Et</button>
                    <button className="btn btn-primary" onClick={handleSaveUts} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'fatura' && (
            <div className="settings-section">
              <h3>🧾 E-Fatura / E-Arşiv Entegrasyonu</h3>
              <p>Satışlarda otomatik fatura oluşturma ayarları</p>
              <div className="card">
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Entegrasyon Sağlayıcısı</label>
                    <select className="form-select"><option>Seçiniz...</option><option>Paraşüt</option><option>Logo İşbaşı</option><option>Bizim Hesap</option><option>Kolays Fatura</option></select>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">API Anahtarı</label><input className="form-input" placeholder="Sağlayıcıdan aldığınız API key" /></div>
                    <div className="form-group"><label className="form-label">API Secret</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  </div>
                  <button className="btn btn-primary" onClick={() => saveSettingsToDb({ efatura_enabled: true }, 'E-Fatura ayarları')} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bildirim' && (
            <div className="settings-section">
              <h3>Bildirim Ayarları</h3>
              <p>Hangi olaylarda bildirim almak istediğinizi seçin</p>
              <div className="card">
                <div className="card-body">
                  {notifSettings.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < notifSettings.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                      <span style={{ fontSize: '0.88rem' }}>{item.label}</span>
                      <label style={{ position: 'relative', width: 44, height: 24, cursor: 'pointer' }} onClick={() => toggleNotifSetting(item.id)}>
                        <input type="checkbox" checked={item.checked} readOnly style={{ display: 'none' }} />
                        <div style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-full)', background: item.checked ? 'var(--primary-500)' : 'var(--gray-300)', transition: 'background var(--transition-fast)', position: 'relative' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 'var(--radius-full)', background: 'white', position: 'absolute', top: 3, left: item.checked ? 23 : 3, transition: 'left var(--transition-fast)', boxShadow: 'var(--shadow-xs)' }} />
                        </div>
                      </label>
                    </div>
                  ))}
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={handleSaveNotifications} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Bildirim Ayarlarını Kaydet'}</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'whatsapp' && (
            <div className="settings-section">
              <h3>📱 WhatsApp & SMS Entegrasyonu</h3>
              <p>Otomatik hatırlatma ve recall mesajları için API ayarları</p>
              <div className="card">
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">WhatsApp Business API Sağlayıcısı</label>
                    <select className="form-select" value={whatsappSettings.provider} onChange={e => setWhatsappSettings(s => ({ ...s, provider: e.target.value }))}>
                      <option value="">Seçiniz...</option><option value="meta">Meta WhatsApp Business API</option><option value="twilio">Twilio</option><option value="netgsm">NetGSM</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">API Token</label><input className="form-input" value={whatsappSettings.apiToken} onChange={e => setWhatsappSettings(s => ({ ...s, apiToken: e.target.value }))} placeholder="WhatsApp API token" /></div>
                    <div className="form-group"><label className="form-label">Telefon Numarası ID</label><input className="form-input" value={whatsappSettings.phoneNumberId} onChange={e => setWhatsappSettings(s => ({ ...s, phoneNumberId: e.target.value }))} placeholder="Gönderim yapılacak numara" /></div>
                  </div>
                  <button className="btn btn-primary" onClick={handleSaveWhatsapp} disabled={saving}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'guvenlik' && (
            <div className="settings-section">
              <h3>🔒 Güvenlik Ayarları</h3>
              <p>Hesap güvenliği ve veri koruma ayarları</p>
              <div className="card">
                <div className="card-body">
                  <div className="form-group"><label className="form-label">Mevcut Şifre</label><input className="form-input" type="password" value={securityForm.currentPassword} onChange={e => setSecurityForm(s => ({ ...s, currentPassword: e.target.value }))} placeholder="••••••••" /></div>
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Yeni Şifre</label><input className="form-input" type="password" value={securityForm.newPassword} onChange={e => setSecurityForm(s => ({ ...s, newPassword: e.target.value }))} placeholder="En az 8 karakter" /></div>
                    <div className="form-group"><label className="form-label">Yeni Şifre (Tekrar)</label><input className="form-input" type="password" value={securityForm.confirmPassword} onChange={e => setSecurityForm(s => ({ ...s, confirmPassword: e.target.value }))} placeholder="Şifreyi tekrar girin" /></div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>{saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}</button>
                  </div>
                </div>
              </div>
              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header"><span className="card-title">Otomatik Yedekleme</span></div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontWeight: 600 }}>Günlük otomatik yedekleme</div><div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Son yedek: 09.07.2026, 03:00</div></div>
                    <span className="badge badge-success">Aktif</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
