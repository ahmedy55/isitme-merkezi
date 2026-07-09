'use client';

import React, { useState } from 'react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('firma');

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Ayarlar</h2>
          <p>Sistem ve entegrasyon yapılandırması</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Nav */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-body">
            <nav className="settings-nav">
              {[
                { id: 'firma', icon: '🏢', label: 'Firma Bilgileri' },
                { id: 'medula', icon: '🏥', label: 'Medula (SGK)' },
                { id: 'uts', icon: '📦', label: 'ÜTS Entegrasyonu' },
                { id: 'fatura', icon: '🧾', label: 'E-Fatura / E-Arşiv' },
                { id: 'bildirim', icon: '🔔', label: 'Bildirimler' },
                { id: 'whatsapp', icon: '📱', label: 'WhatsApp / SMS' },
                { id: 'guvenlik', icon: '🔒', label: 'Güvenlik' },
              ].map(item => (
                <button
                  key={item.id}
                  className={`settings-nav-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
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
                      <input className="form-input" defaultValue="AudioPro İşitme Merkezi" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Vergi No</label>
                      <input className="form-input" defaultValue="1234567890" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Telefon</label>
                      <input className="form-input" defaultValue="0216 555 00 00" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">E-posta</label>
                      <input className="form-input" defaultValue="info@audiopro.com" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Adres</label>
                    <textarea className="form-textarea" defaultValue="Caferağa Mah. Moda Cad. No:42, Kadıköy / İstanbul" />
                  </div>
                  <button className="btn btn-primary">💾 Kaydet</button>
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
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--info-50)',
                    border: '1px solid var(--info-100)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20,
                    fontSize: '0.82rem',
                    color: 'var(--info-600)',
                  }}>
                    ℹ️ Bu bilgileri SGK İl Müdürlüğü&apos;nden veya mevcut Medula panelinizden alabilirsiniz.
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tesis Kodu</label>
                    <input className="form-input" placeholder="SGK tarafından atanan tesis kodu" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Medula Kullanıcı Adı</label>
                      <input className="form-input" placeholder="Kullanıcı adınız" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Medula Şifresi</label>
                      <input className="form-input" type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">WSDL Endpoint URL</label>
                    <input className="form-input" placeholder="https://medula.sgk.gov.tr/..." defaultValue="https://medula.sgk.gov.tr/MedulaWS/services/..." />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ortam</label>
                      <select className="form-select">
                        <option>Test Ortamı</option>
                        <option>Canlı Ortam (Production)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">SSL Sertifika Dosyası</label>
                      <input className="form-input" type="file" style={{ padding: '8px 12px' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary">🔄 Bağlantıyı Test Et</button>
                    <button className="btn btn-primary">💾 Kaydet</button>
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
                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--success-50)',
                    border: '1px solid var(--success-100)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20,
                    fontSize: '0.82rem',
                    color: 'var(--success-700)',
                  }}>
                    ✅ ÜTS token&apos;ınızı almak için: utsuygulama.saglik.gov.tr → Kullanıcı İşlemleri → Sistem Kullanıcısı Tanımlama → e-İmza ile onaylayın
                  </div>
                  <div className="form-group">
                    <label className="form-label">ÜTS Token (API Anahtarı)</label>
                    <textarea className="form-textarea" placeholder="ÜTS panelinden aldığınız uzun token kodunu buraya yapıştırın..." style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ortam</label>
                      <select className="form-select">
                        <option>Test Ortamı (utstest.saglik.gov.tr)</option>
                        <option>Canlı Ortam (utsuygulama.saglik.gov.tr)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Firma Kodu</label>
                      <input className="form-input" placeholder="ÜTS firma kodu" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary">🔄 Bağlantıyı Test Et</button>
                    <button className="btn btn-primary">💾 Kaydet</button>
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
                    <select className="form-select">
                      <option>Seçiniz...</option>
                      <option>Paraşüt</option>
                      <option>Logo İşbaşı</option>
                      <option>Bizim Hesap</option>
                      <option>Kolays Fatura</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">API Anahtarı</label>
                      <input className="form-input" placeholder="Sağlayıcıdan aldığınız API key" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">API Secret</label>
                      <input className="form-input" type="password" placeholder="••••••••" />
                    </div>
                  </div>
                  <button className="btn btn-primary">💾 Kaydet</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'bildirim' && (
            <div className="settings-section">
              <h3>🔔 Bildirim Ayarları</h3>
              <p>Hangi olaylarda bildirim almak istediğinizi seçin</p>
              <div className="card">
                <div className="card-body">
                  {[
                    { label: 'Yeni randevu oluşturulduğunda', checked: true },
                    { label: 'Randevu iptal edildiğinde', checked: true },
                    { label: 'Stok kritik seviyeye düştüğünde', checked: true },
                    { label: 'Yeni satış kaydedildiğinde', checked: false },
                    { label: 'Recall fırsatı oluştuğunda', checked: true },
                    { label: 'SGK yenileme hakkı açıldığında', checked: true },
                  ].map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: i < 5 ? '1px solid var(--gray-100)' : 'none',
                    }}>
                      <span style={{ fontSize: '0.88rem' }}>{item.label}</span>
                      <label style={{
                        position: 'relative',
                        width: 44,
                        height: 24,
                        cursor: 'pointer',
                      }}>
                        <input type="checkbox" defaultChecked={item.checked} style={{ display: 'none' }} />
                        <div style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: 'var(--radius-full)',
                          background: item.checked ? 'var(--primary-500)' : 'var(--gray-300)',
                          transition: 'background var(--transition-fast)',
                          position: 'relative',
                        }}>
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: 'var(--radius-full)',
                            background: 'white',
                            position: 'absolute',
                            top: 3,
                            left: item.checked ? 23 : 3,
                            transition: 'left var(--transition-fast)',
                            boxShadow: 'var(--shadow-xs)',
                          }} />
                        </div>
                      </label>
                    </div>
                  ))}
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
                    <select className="form-select">
                      <option>Seçiniz...</option>
                      <option>Meta (Facebook) WhatsApp Business API</option>
                      <option>Twilio</option>
                      <option>NetGSM</option>
                    </select>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">API Token</label>
                      <input className="form-input" placeholder="WhatsApp API token" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Telefon Numarası ID</label>
                      <input className="form-input" placeholder="Gönderim yapılacak numara" />
                    </div>
                  </div>
                  <button className="btn btn-primary">💾 Kaydet</button>
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
                  <div className="form-group">
                    <label className="form-label">Mevcut Şifre</label>
                    <input className="form-input" type="password" placeholder="••••••••" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Yeni Şifre</label>
                      <input className="form-input" type="password" placeholder="En az 8 karakter" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Yeni Şifre (Tekrar)</label>
                      <input className="form-input" type="password" placeholder="Şifreyi tekrar girin" />
                    </div>
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary">🔑 Şifreyi Güncelle</button>
                  </div>
                </div>
              </div>

              <div className="card" style={{ marginTop: 16 }}>
                <div className="card-header">
                  <span className="card-title">🗄️ Otomatik Yedekleme</span>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>Günlük otomatik yedekleme</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>Son yedek: 09.07.2026, 03:00</div>
                    </div>
                    <span className="badge badge-success">✓ Aktif</span>
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
