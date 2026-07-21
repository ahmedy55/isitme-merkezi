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
  category: 'Sistem Hatası' | 'Kullanım Yardımı' | 'Yeni Özellik Talebi' | 'Diğer';
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
      a: 'Sol menüden "Hastalar" sayfasını açın. Sağ üstteki "Yeni Hasta Ekle" butonuna tıklayarak isim, soyad, telefon, TC no gibi gerekli alanları doldurup kaydedin.',
      category: 'Hasta Yönetimi'
    },
    {
      q: 'SGK Medula provizyon sorgulamasını nasıl yaparım?',
      a: 'Sol menüden "SGK & Reçete" sayfasına tıklayın. Arama kutusuna hastanın 11 haneli TC kimlik numarasını girip "Sorgula" butonuna basarak hak sahipliği durumunu ve SUT ödeme limitlerini görebilirsiniz.',
      category: 'SGK Medula'
    },
    {
      q: 'Tedarikçiye ait bir faturayı sisteme nasıl işlerim?',
      a: 'Sol menüden "Tedarikçiler" modülüne gidin. İlgili firmanın yanındaki "Faturalar" butonuna tıklayarak açılan pencereden "Fatura/Alış Gir" seçeneğini kullanın. Bu işlem tedarikçi bakiyesini de borç olarak güncelleyecektir.',
      category: 'Tedarikçi Yönetimi'
    },
    {
      q: 'Kasalar arası para transferi veya elden nakit ödeme/masraf girişini nasıl yaparım?',
      a: 'Nakit girişleri ve hesaplar arası para transferi için "Kasa & Tahsilat" sayfasındaki "Para Giriş/Çıkış" butonunu kullanın. Genel harcama ve fatura ödemeleri için ise "Masraflar" modülünü kullanmanız önerilir.',
      category: 'Kasa & Muhasebe'
    },
    {
      q: 'Kullanıcılara ait roller ve yetki seviyeleri ne anlama geliyor?',
      a: 'Sistemde 4 temel rol vardır. Firma Yöneticisi tam yetkilidir. Odyometrist hasta ve klinik işlemleri yapabilir. Sekreter randevu ve kayıt işlerini yönetir, Muhasebe ise kasaları ve masrafları takip eder. Bir kullanıcıya birden fazla rol tanımlanabilir.',
      category: 'Kullanıcı Yetkileri'
    }
  ];

  // Simulated active tickets
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
        { author: 'Destek Ekibi', message: 'Merhaba, tarayıcı yazdırma ayarlarından "Arka plan grafiklerini yazdır" seçeneğini aktif ederek tekrar deneyebilir misiniz?', date: '2026-07-20 15:30' }
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

  // New ticket Form State
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState<'Sistem Hatası' | 'Kullanım Yardımı' | 'Yeni Özellik Talebi' | 'Diğer'>('Kullanım Yardımı');
  const [formPriority, setFormPriority] = useState<'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'>('Orta');
  const [formMessage, setFormMessage] = useState('');

  // Selected ticket view state
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    const newTicket: SupportTicket = {
      id: 'tkt-' + Math.floor(Math.random() * 1000000),
      subject: formSubject,
      category: formCategory,
      priority: formPriority,
      message: formMessage,
      status: 'Açık',
      date: new Date().toISOString().split('T')[0],
      replies: []
    };

    setTickets(prev => [newTicket, ...prev]);
    setShowNewTicketForm(false);
    setFormSubject('');
    setFormMessage('');
    addToast({ type: 'success', message: 'Destek talebiniz başarıyla oluşturuldu. En kısa sürede yanıtlanacaktır.' });
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReplyMessage.trim() || !selectedTicket) return;

    const newReply = {
      author: 'Ben (Firma Sahibi)',
      message: newReplyMessage,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updated = {
      ...selectedTicket,
      replies: [...selectedTicket.replies, newReply],
      status: 'Açık' as const // Destek ekibine geri döndü
    };

    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updated : t));
    setSelectedTicket(updated);
    setNewReplyMessage('');
    addToast({ type: 'success', message: 'Cevabınız iletildi.' });
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-left">
          <h2>Destek & Yardım Merkezi</h2>
          <p>Kullanım rehberi, sıkça sorulan sorular ve teknik destek talepleri</p>
        </div>
      </div>

      <div className="responsive-grid-2" style={{ gap: 20 }}>
        {/* Left Side — User Guide / FAQs */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">📖 Sıkça Sorulan Sorular (Kullanım Rehberi)</span>
            </div>
            <div className="card-body">
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>
                  <IconSearch size={18} />
                </span>
                <input
                  className="form-input"
                  placeholder="Rehberde konu veya soru arayın..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  style={{ paddingLeft: 38, width: '100%', margin: 0 }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredFaqs.map((faq, i) => {
                  const isOpen = activeFAQIndex === i;
                  return (
                    <div key={i} style={{ border: '1px solid var(--surface-border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <button
                        onClick={() => setActiveFAQIndex(isOpen ? null : i)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'var(--surface-card)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          textAlign: 'left',
                          fontWeight: 600,
                          color: 'var(--gray-800)',
                          fontSize: '0.9rem'
                        }}
                      >
                        <span>{faq.q}</span>
                        <span style={{
                          fontSize: '0.74rem',
                          background: 'var(--primary-50)',
                          color: 'var(--primary-700)',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>{faq.category}</span>
                      </button>
                      {isOpen && (
                        <div style={{ padding: '12px 16px', background: 'var(--surface-white)', borderTop: '1px solid var(--surface-border-light)', fontSize: '0.86rem', color: 'var(--gray-700)', lineHeight: 1.5 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side — Tickets / Support Desk */}
        <div>
          {!selectedTicket ? (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="card-title">💬 Teknik Destek Talepleri</span>
                {!showNewTicketForm && (
                  <button className="btn btn-primary" onClick={() => setShowNewTicketForm(true)} style={{ padding: '6px 12px', fontSize: '0.84rem' }}>
                    Talep Oluştur
                  </button>
                )}
              </div>
              <div className="card-body">
                {!showNewTicketForm ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {tickets.map((tkt) => (
                      <div
                        key={tkt.id}
                        onClick={() => setSelectedTicket(tkt)}
                        style={{
                          border: '1px solid var(--surface-border-light)',
                          borderRadius: 'var(--radius-md)',
                          padding: 14,
                          background: 'var(--gray-25)',
                          cursor: 'pointer',
                          transition: 'all 120ms'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--gray-800)', fontSize: '0.92rem' }}>{tkt.subject}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', marginTop: 4 }}>
                              Kategori: {tkt.category} · Tarih: {tkt.date}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span className={`badge badge-${
                              tkt.status === 'Çözüldü' ? 'success' :
                              tkt.status === 'Cevaplandı' ? 'info' : 'warning'
                            }`} style={{ fontSize: '0.74rem' }}>
                              {tkt.status}
                            </span>
                            <span className="badge" style={{
                              fontSize: '0.72rem',
                              background: tkt.priority === 'Kritik' || tkt.priority === 'Yüksek' ? 'var(--danger-50)' : 'var(--gray-100)',
                              color: tkt.priority === 'Kritik' || tkt.priority === 'Yüksek' ? 'var(--danger-700)' : 'var(--gray-600)',
                              fontWeight: 600
                            }}>
                              {tkt.priority} Öncelik
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <form onSubmit={handleCreateTicket}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 12 }}>Yeni Destek Talebi Gönder</h3>
                    
                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Konu / Başlık</label>
                      <input
                        className="form-input"
                        placeholder="Karşılaştığınız sorunu kısaca özetleyin"
                        value={formSubject}
                        onChange={(e) => setFormSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label className="form-label">Kategori</label>
                        <select className="form-input" value={formCategory} onChange={(e) => setFormCategory(e.target.value as any)}>
                          <option value="Kullanım Yardımı">Kullanım Yardımı</option>
                          <option value="Sistem Hatası">Sistem Hatası</option>
                          <option value="Yeni Özellik Talebi">Yeni Özellik Talebi</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label className="form-label">Öncelik Seviyesi</label>
                        <select className="form-input" value={formPriority} onChange={(e) => setFormPriority(e.target.value as any)}>
                          <option value="Düşük">Düşük</option>
                          <option value="Orta">Orta</option>
                          <option value="Yüksek">Yüksek</option>
                          <option value="Kritik">Kritik</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label className="form-label">Detaylı Açıklama</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Sorunun adımlarını, aldığınız hata mesajını detaylıca yazın."
                        value={formMessage}
                        onChange={(e) => setFormMessage(e.target.value)}
                        required
                        style={{ resize: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowNewTicketForm(false)}>İptal</button>
                      <button type="submit" className="btn btn-primary">Talebi Gönder</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="btn-icon" onClick={() => setSelectedTicket(null)} style={{ padding: 4 }}>
                  <IconBack size={16} />
                </button>
                <div>
                  <span className="card-title" style={{ fontSize: '1rem', fontWeight: 700 }}>{selectedTicket.subject}</span>
                  <div style={{ fontSize: '0.76rem', color: 'var(--gray-400)' }}>ID: {selectedTicket.id} · Durum: {selectedTicket.status}</div>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Ticket Message */}
                <div style={{ background: 'var(--gray-50)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--gray-500)', marginBottom: 6 }}>
                    <strong>Ben (Firma Sahibi)</strong>
                    <span>{selectedTicket.date}</span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--gray-800)', lineHeight: 1.4 }}>{selectedTicket.message}</p>
                </div>

                {/* Replies */}
                {selectedTicket.replies.map((rep, idx) => (
                  <div key={idx} style={{ background: 'var(--primary-50)', padding: 12, borderRadius: 'var(--radius-md)', border: '1px solid var(--primary-100)', alignSelf: 'flex-end', width: '90%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--primary-700)', marginBottom: 6 }}>
                      <strong>{rep.author}</strong>
                      <span>{rep.date}</span>
                    </div>
                    <p style={{ fontSize: '0.86rem', color: 'var(--primary-900)', lineHeight: 1.4 }}>{rep.message}</p>
                  </div>
                ))}

                {/* Reply Form */}
                {selectedTicket.status !== 'Çözüldü' ? (
                  <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 14 }}>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <textarea
                        className="form-input"
                        rows={2}
                        placeholder="Yanıtınızı buraya yazın..."
                        value={newReplyMessage}
                        onChange={(e) => setNewReplyMessage(e.target.value)}
                        required
                        style={{ resize: 'none' }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'Çözüldü' } : t));
                          setSelectedTicket(null);
                          addToast({ type: 'success', message: 'Talep kapatıldı.' });
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                      >
                        Sorun Çözüldü (Kapat)
                      </button>
                      <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>Yanıtla</button>
                    </div>
                  </form>
                ) : (
                  <div style={{ padding: 12, background: 'var(--success-50)', color: 'var(--success-700)', textAlign: 'center', borderRadius: 'var(--radius-md)', fontWeight: 600 }}>
                    Bu talep çözüldü olarak işaretlenmiştir.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
