'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { IconSearch, IconPlus, IconCheck, IconWarning, IconRefresh, IconClose, IconMessage, IconBack } from '../components/Icons';

interface FAQ {
  q: string;
  a: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
  message: string;
  status: 'Açık' | 'Cevaplandı' | 'Çözüldü';
  date: string;
  replies: { author: string; message: string; date: string }[];
}

export default function SupportPage() {
  const { addToast } = useApp();

  const faqs: FAQ[] = [
    {
      q: 'Yeni bir hastayı nasıl ekleyebilirim?',
      a: 'Sol menüden "Hastalar" sayfasına gidin. Sağ üstteki "+ Yeni Hasta Ekle" butonuna tıklayın. Açılan pencerede hastanın Adı, Soyadı, TC Kimlik Numarası, Telefon Numarası, İşitme Kaybı Derecesi ve varsa Doktor/SGK bilgilerini doldurarak "Kaydet" butonuna basın. Eklenen hasta otomatik olarak listeye dahil edilecektir.',
      category: 'Hasta Yönetimi'
    },
    {
      q: 'SGK Medula provizyon sorgulamasını nasıl yaparım?',
      a: 'Sol menüden "SGK & Reçete" modülüne girin. Sorgulama alanına hastanın 11 haneli TC Kimlik Numarasını ve Reçete/Rapor Numarasını yazarak "Medula Sorgula" butonuna tıklayın. Sistem Sağlık Bakanlığı ve SGK Medula servisleri üzerinden hak sahipliği durumunu ve hak ediş tutarını sorgulayıp ekranda gösterecektir.',
      category: 'SGK Medula'
    },
    {
      q: 'Tedarikçiye ait bir faturayı sisteme nasıl işlerim?',
      a: 'Sol menüdeki "Tedarikçiler" modülünü açın. Faturasını işlemek istediğiniz firmanın satırındaki "İşlemler > Fatura Ekle" seçeneğine tıklayın. Fatura Numarası, Fatura Tarihi, Alınan Cihaz/Pil Kategori Detayı ve Toplam Tutar bilgilerini girin. Bu işlem sonucunda stoklarınız otomatik güncellenecek ve tedarikçi cari hesabına borç kaydedilecektir.',
      category: 'Tedarikçi Yönetimi'
    },
    {
      q: 'Kasalar arası para transferi veya elden nakit ödeme/masraf girişini nasıl yaparım?',
      a: 'Nakit, POS veya banka hesapları arasındaki işlemler için "Kasa & Tahsilat" sayfasındaki "Para Transferi / Giriş-Çıkış" butonunu kullanabilirsiniz. İşletme masrafları, kira, fatura ve personel ödemeleri için ise "Masraflar" sayfasındaki "+ Yeni Masraf Ekle" formunu doldurmanız gerekmektedir.',
      category: 'Kasa & Muhasebe'
    },
    {
      q: 'Kullanıcılara ait roller ve yetki seviyeleri ne anlama geliyor?',
      a: 'AudiPro sisteminde 4 temel yetki rolü bulunur:\n1. Firma Yöneticisi: Tüm modüllere, raporlara ve şube ayarlarına tam erişim yetkisine sahiptir.\n2. Odyometrist: Hasta kaydı, odyogram testi, randevu ve cihaz denemesi işlemlerini yürütür.\n3. Sekreter: Randevu alma, karşılama ve hasta hatırlatmalarını (Recall) takip eder.\n4. Muhasebe: Kasa, tahsilat, SGK hak edişleri ve masraf kayıtlarını yönetir.',
      category: 'Kullanıcı Yetkileri'
    }
  ];

  // Destek Talepleri State
  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'tkt-1',
      subject: 'Odyogram raporu yazdırma hatası',
      category: 'Sistem Hatası',
      priority: 'Yüksek',
      message: 'Hasta detay ekranından KBB raporu yazdır dediğimde sayfa düzeni kayıyor, yazıcı çıktısında grafikler görünmüyor.',
      status: 'Cevaplandı',
      date: '2026-07-20',
      replies: [
        { author: 'Destek Ekibi', message: 'Merhaba, tarayıcı yazdırma ayarlarından "Arka plan grafiklerini yazdır" seçeneğini aktif ederek tekrar deneyebilir misiniz? Sorun devam ederse teknik ekibimiz uzak bağlantı ile destek sağlayacaktır.', date: '2026-07-20 15:30' }
      ]
    },
    {
      id: 'tkt-2',
      subject: 'Toplu SMS şablonu talebi',
      category: 'Yeni Özellik Talebi',
      priority: 'Düşük',
      message: 'Yıllık kontrolü yaklaşan hastalara toplu SMS atarken özel isim filtreli şablon oluşturmak istiyoruz.',
      status: 'Açık',
      date: '2026-07-21',
      replies: []
    }
  ]);

  // Search FAQ state
  const [faqSearch, setFaqSearch] = useState('');
  const [activeFAQIndex, setActiveFAQIndex] = useState<number | null>(null);

  // New ticket Modal State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('Sistem Hatası');
  const [formPriority, setFormPriority] = useState<'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'>('Orta');
  const [formMessage, setFormMessage] = useState('');

  // Selected ticket view state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) {
      addToast({ type: 'error', message: 'Lütfen konu ve açıklama alanlarını doldurun.' });
      return;
    }

    const newTicket: SupportTicket = {
      id: 'tkt-' + Math.floor(1000 + Math.random() * 9000),
      subject: formSubject,
      category: formCategory,
      priority: formPriority,
      message: formMessage,
      status: 'Açık',
      date: new Date().toISOString().split('T')[0],
      replies: []
    };

    setTickets(prev => [newTicket, ...prev]);
    setShowNewTicketModal(false);
    setFormSubject('');
    setFormMessage('');
    addToast({ type: 'success', message: 'Destek talebiniz oluşturuldu. En kısa sürede incelenecektir.' });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyMessage.trim() || !selectedTicket) return;

    const newReply = {
      author: 'Ben (Firma Yöneticisi)',
      message: newReplyMessage,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updated = {
      ...selectedTicket,
      replies: [...selectedTicket.replies, newReply],
      status: 'Açık' as const
    };

    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setNewReplyMessage('');
    addToast({ type: 'success', message: 'Yanıtınız iletildi.' });
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="page">
      {/* Sayfa Başlığı */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div className="page-header-left">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-900)', margin: 0 }}>Destek & Yardım Merkezi</h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--gray-500)', margin: '4px 0 0 0' }}>Kullanım rehberi, sıkça sorulan sorular ve teknik destek talepleri</p>
        </div>
      </div>

      {/* 2 Kolonlu Düzen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* Sol Kolon — Sıkça Sorulan Sorular (Kullanım Rehberi) */}
        <div className="card" style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 14, boxShadow: 'var(--shadow-xs)', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, borderBottom: '1px solid var(--gray-100)', paddingBottom: 14 }}>
            <span style={{ fontSize: '1.1rem' }}>📖</span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-900)' }}>
              Sıkça Sorulan Sorular (Kullanım Rehberi)
            </h3>
          </div>

          {/* Arama Kutusu */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', display: 'flex', alignItems: 'center' }}>
              <IconSearch size={17} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Rehberde konu veya soru arayın..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              style={{
                paddingLeft: 42,
                width: '100%',
                height: 42,
                borderRadius: 10,
                border: '1px solid var(--gray-200)',
                fontSize: '0.88rem',
                background: '#fafafa'
              }}
            />
          </div>

          {/* FAQ Soru Listesi (Accordion) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq, i) => {
                const isOpen = activeFAQIndex === i;
                return (
                  <div
                    key={i}
                    style={{
                      border: isOpen ? '1px solid var(--primary-300)' : '1px solid var(--gray-200)',
                      borderRadius: 10,
                      overflow: 'hidden',
                      transition: 'all 0.15s ease',
                      background: isOpen ? '#f8fafc' : '#fff'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFAQIndex(isOpen ? null : i)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'none',
                        border: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: isOpen ? 'var(--primary-800)' : 'var(--gray-800)',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        gap: 12
                      }}
                    >
                      <span style={{ lineHeight: '1.3' }}>{faq.q}</span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: '#f1f5f9',
                        color: '#475569',
                        padding: '3px 10px',
                        borderRadius: 12,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        {faq.category}
                      </span>
                    </button>
                    {isOpen && (
                      <div style={{
                        padding: '14px 16px',
                        background: '#fff',
                        borderTop: '1px solid var(--gray-200)',
                        fontSize: '0.85rem',
                        color: 'var(--gray-700)',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-line'
                      }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                Aramanıza uygun rehber sonucu bulunamadı.
              </div>
            )}
          </div>
        </div>

        {/* Sağ Kolon — Teknik Destek Talepleri */}
        <div className="card" style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 14, boxShadow: 'var(--shadow-xs)', padding: '20px 24px' }}>
          
          {!selectedTicket ? (
            <>
              {/* Kart Başlığı ve Buton */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--gray-100)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.1rem' }}>💬</span>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--gray-900)' }}>
                    Teknik Destek Talepleri
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(true)}
                  style={{
                    background: 'var(--primary-600)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <IconPlus size={15} /> Talep Oluştur
                </button>
              </div>

              {/* Talepler Listesi */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tickets.map((tkt) => (
                  <div
                    key={tkt.id}
                    onClick={() => setSelectedTicket(tkt)}
                    style={{
                      border: '1px solid var(--gray-200)',
                      borderRadius: 10,
                      padding: '16px 18px',
                      background: '#fafafa',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--gray-900)', fontSize: '0.92rem', marginBottom: 4 }}>
                        {tkt.subject}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                        Kategori: {tkt.category} · Tarih: {tkt.date}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      {/* Durum Rozeti */}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: tkt.status === 'Cevaplandı' ? '#e0f2fe' : (tkt.status === 'Çözüldü' ? '#dcfce7' : '#fef3c7'),
                        color: tkt.status === 'Cevaplandı' ? '#0369a1' : (tkt.status === 'Çözüldü' ? '#15803d' : '#b45309')
                      }}>
                        {tkt.status}
                      </span>
                      {/* Öncelik Rozeti */}
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: (tkt.priority === 'Yüksek' || tkt.priority === 'Kritik') ? '#fee2e2' : '#f3f4f6',
                        color: (tkt.priority === 'Yüksek' || tkt.priority === 'Kritik') ? '#b91c1c' : '#4b5563'
                      }}>
                        {tkt.priority} Öncelik
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Detay ve Yanıtlaşma Ekranı */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '1px solid var(--gray-100)', paddingBottom: 12 }}>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gray-600)' }}
                >
                  <IconBack size={18} />
                </button>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--gray-900)' }}>{selectedTicket.subject}</h4>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gray-500)', marginTop: 2 }}>ID: {selectedTicket.id} · Durum: {selectedTicket.status}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* İlk Mesaj */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid var(--gray-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: 6 }}>
                    <strong>Ben (Firma Yöneticisi)</strong>
                    <span>{selectedTicket.date}</span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--gray-800)', margin: 0, lineHeight: 1.5 }}>{selectedTicket.message}</p>
                </div>

                {/* Yanıtlar */}
                {selectedTicket.replies.map((rep, idx) => (
                  <div key={idx} style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', alignSelf: 'flex-end', width: '92%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#166534', marginBottom: 6 }}>
                      <strong>{rep.author}</strong>
                      <span>{rep.date}</span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: '#14532d', margin: 0, lineHeight: 1.5 }}>{rep.message}</p>
                  </div>
                ))}

                {/* Yanıt Formu */}
                {selectedTicket.status !== 'Çözüldü' ? (
                  <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 14, marginTop: 10 }}>
                    <textarea
                      className="form-input"
                      rows={3}
                      placeholder="Yanıtınızı buraya yazın..."
                      value={newReplyMessage}
                      onChange={(e) => setNewReplyMessage(e.target.value)}
                      required
                      style={{ width: '100%', borderRadius: 8, padding: 10, fontSize: '0.85rem', marginBottom: 10, resize: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'Çözüldü' } : t));
                          setSelectedTicket(null);
                          addToast({ type: 'success', message: 'Talep kapatıldı.' });
                        }}
                        style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                      >
                        Sorun Çözüldü (Kapat)
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>Yanıtla</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: 12, background: '#f0fdf4', color: '#166534', textAlign: 'center', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem' }}>
                    Bu talep çözüldü olarak kapatılmıştır.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Yeni Talep Oluşturma Modalı */}
      {showNewTicketModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 14,
            width: '100%',
            maxWidth: 520,
            padding: '24px 28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--gray-900)' }}>Yeni Destek Talebi Oluştur</h3>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
              >
                <IconClose size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Konu / Başlık</label>
                <input
                  className="form-input"
                  placeholder="Karşılaştığınız sorunu veya talebinizi özetleyin"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  required
                  style={{ width: '100%', height: 40, borderRadius: 8, padding: '0 12px', fontSize: '0.88rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Kategori</label>
                  <select
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', height: 40, borderRadius: 8, padding: '0 10px', fontSize: '0.88rem' }}
                  >
                    <option value="Sistem Hatası">Sistem Hatası</option>
                    <option value="Kullanım Yardımı">Kullanım Yardımı</option>
                    <option value="Yeni Özellik Talebi">Yeni Özellik Talebi</option>
                    <option value="SGK & Entegrasyon">SGK & Entegrasyon</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Öncelik Seviyesi</label>
                  <select
                    className="form-input"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    style={{ width: '100%', height: 40, borderRadius: 8, padding: '0 10px', fontSize: '0.88rem' }}
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Kritik">Kritik</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>Detaylı Açıklama</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Yaşadığınız sorunu veya talebinizi detaylıca açıklayın."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  required
                  style={{ width: '100%', borderRadius: 8, padding: 12, fontSize: '0.88rem', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewTicketModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 8 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', borderRadius: 8 }}
                >
                  Talebi Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
