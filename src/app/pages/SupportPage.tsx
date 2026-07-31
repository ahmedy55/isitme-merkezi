'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  IconSearch, IconPlus, IconCheck, IconWarning, IconRefresh, IconClose,
  IconMessage, IconBack, IconUsers, IconCalendar, IconSGK, IconCash,
  IconStock, IconPatients, IconChevronDown
} from '../components/Icons';

interface FAQ {
  cat: string;
  q: string;
  a: string;
}

interface RoleInfo {
  title: string;
  badge: string;
  badgeType: 'admin' | 'standard';
  desc: string;
}

interface ModuleGuide {
  title: string;
  icon: string;
  steps: string[];
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

  // Tab State: 'genel' | 'roller' | 'modul' | 'sss' | 'talepler'
  const [activeTab, setActiveTab] = useState<'genel' | 'roller' | 'modul' | 'sss' | 'talepler'>('genel');

  // FAQ State
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Module Guide State
  const [expandedModuleIndex, setExpandedModuleIndex] = useState<number | null>(null);

  // FAQ Data
  const faqData: FAQ[] = [
    { cat: 'Hasta yönetimi', q: 'Yeni bir hastayı nasıl eklerim?', a: 'Hastalar ekranında "Yeni Hasta" butonuna tıklayın, TC kimlik, ad soyad ve iletişim bilgilerini girip kaydedin.' },
    { cat: 'Hasta yönetimi', q: 'Bir hastanın geçmiş odyogram kayıtlarını nerede görürüm?', a: 'Hasta kartı detayındaki Odyogram sekmesinde tüm geçmiş ölçümler tarih sırasıyla listelenir.' },
    { cat: 'SGK Medula', q: 'SGK Medula provizyon sorgulamasını nasıl yaparım?', a: 'SGK ve Reçete menüsünden ilgili hastayı seçip "Provizyon Sorgula" butonunu kullanın.' },
    { cat: 'SGK Medula', q: 'Provizyon reddedilirse ne yapmalıyım?', a: 'Red sebebi ekranın altında gösterilir; eksik belge veya TC bilgisini tamamlayıp tekrar sorgulayabilirsiniz.' },
    { cat: 'Kasa ve muhasebe', q: 'Kasalar arası para transferi nasıl yapılır?', a: 'Kasa ve Tahsilat menüsünde Transfer sekmesinden kaynak ve hedef şubeyi seçip tutarı girin.' },
    { cat: 'Kasa ve muhasebe', q: 'Elden yapılan bir masrafı nasıl kaydederim?', a: 'Masraflar ekranından "Yeni Masraf Ekle" ile kategori, tutar ve açıklama girerek kaydedin.' },
    { cat: 'Kullanıcı yetkileri', q: 'Kullanıcılara ait roller ve yetki seviyeleri ne anlama geliyor?', a: 'Her rol belirli ekranlara erişim tanımlar; detaylar için "Roller ve yetkiler" sekmesini inceleyin.' },
    { cat: 'Kullanıcı yetkileri', q: 'Bir kullanıcının yetkisini nasıl değiştiririm?', a: 'Şubeler ve Yetki menüsünden ilgili kullanıcıyı seçip rolünü güncelleyebilirsiniz.' },
    { cat: 'Tedarikçi', q: 'Tedarikçiye ait bir faturayı sisteme nasıl işlerim?', a: 'Tedarikçiler ekranında ilgili firmayı açıp "Fatura Ekle" ile fatura no, tutar ve tarihi kaydedin.' }
  ];

  // System Roles Data
  const rolesData: RoleInfo[] = [
    {
      title: 'Firma yöneticisi',
      badge: 'Tam yetki',
      badgeType: 'admin',
      desc: 'Tüm şubeleri konsolide görür, kullanıcı ve yetki tanımlar, mali raporlara erişir, SaaS panel ayarlarını yönetir.'
    },
    {
      title: 'Şube yöneticisi',
      badge: 'Şube bazlı',
      badgeType: 'standard',
      desc: 'Kendi şubesindeki randevu, stok ve kasa hareketlerini yönetir; diğer şubeleri görüntüleyemez.'
    },
    {
      title: 'Odyolog / teknisyen',
      badge: 'Klinik',
      badgeType: 'standard',
      desc: 'Hasta kartı, odyogram ve teknik servis kayıtlarına erişir; kasa ve muhasebe ekranlarını göremez.'
    },
    {
      title: 'Resepsiyon / sekreterya',
      badge: 'Ön büro',
      badgeType: 'standard',
      desc: 'Randevu oluşturur, hasta kaydı açar, recall listesini takip eder. SGK ve raporlama menülerine erişemez.'
    },
    {
      title: 'Muhasebe',
      badge: 'Mali',
      badgeType: 'standard',
      desc: 'Kasa, tahsilat, masraf ve tedarikçi faturalarını işler; hasta klinik verilerini göremez.'
    }
  ];

  // Module Guides Data
  const moduleGuides: ModuleGuide[] = [
    {
      title: 'Randevu oluşturma ve iptal kuralları',
      icon: 'calendar',
      steps: [
        '1. Sol menüden "Randevular" sekmesine gidin.',
        '2. Takvim üzerinde randevu vermek istediğiniz saat aralığına tıklayın.',
        '3. Açılan formda hasta adı, odyolog ve randevu tipini seçip onaylayın.',
        '4. İptal durumunda randevu kartına tıklayıp "İptal Et" butonunu kullanın.'
      ]
    },
    {
      title: 'SGK Medula provizyon adımları',
      icon: 'sgk',
      steps: [
        '1. Sol menüden "SGK & Reçete" modülüne girin.',
        '2. Hastanın 11 haneli TC Kimlik numarasını ve Reçete numarasını yazın.',
        '3. "Medula Sorgula" butonuna tıklayarak SUT ödeme limitlerini çekin.',
        '4. Cihaz teslimatı sonrası hak ediş kaydını tamamlayın.'
      ]
    },
    {
      title: 'Kasa açma, sayım ve şubeler arası transfer',
      icon: 'cash',
      steps: [
        '1. "Kasa & Tahsilat" ekranından günlük devir bakiyesini kontrol edin.',
        '2. Kasalar arası transfer için "Para Transferi" seçeneğini kullanın.',
        '3. Gün sonunda fiziki nakit sayımı yaparak gün sonu raporunu onaylayın.'
      ]
    },
    {
      title: 'Stok ve aksesuar giriş çıkışı',
      icon: 'stock',
      steps: [
        '1. "Stok & Aksesuar" modülünden "+ Yeni Ürün Ekle" butonuna basın.',
        '2. Seri numarası, barkod ve şube stok miktarını girin.',
        '3. Hasta satışı yapıldığında stok otomatik düşecektir.'
      ]
    },
    {
      title: 'Kullanıcı ekleme ve rol atama',
      icon: 'users',
      steps: [
        '1. "Şubeler & Yetki" modülüne gidin.',
        '2. "+ Yeni Kullanıcı Ekle" butonuna tıklayarak e-posta ve şifre belirleyin.',
        '3. Kullanıcıya "Firma Yöneticisi", "Odyolog" veya "Sekreter" rolü tanımlayın.'
      ]
    }
  ];

  // Support Tickets State
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

  // Modal & Ticket Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('Sistem Hatası');
  const [formPriority, setFormPriority] = useState<'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'>('Orta');
  const [formMessage, setFormMessage] = useState('');

  // Ticket Detail View State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [newReplyMessage, setNewReplyMessage] = useState('');

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubject.trim() || !formMessage.trim()) {
      addToast({ type: 'error', message: 'Lütfen tüm alanları doldurun.' });
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
    addToast({ type: 'success', message: 'Teknik destek talebiniz başarıyla iletildi.' });
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

  // Filtered FAQs
  const filteredFaqs = faqData.filter(item =>
    item.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
    item.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
    item.cat.toLowerCase().includes(faqSearch.toLowerCase())
  );

  // Group FAQs by Category
  const groupedFaqs = filteredFaqs.reduce((acc, item) => {
    acc[item.cat] = acc[item.cat] || [];
    acc[item.cat].push(item);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", background: '#F3F0E8', borderRadius: 12, overflow: 'hidden', border: '0.5px solid #E2DED0' }}>
      
      {/* Header Banner */}
      <div style={{ background: '#132018', padding: '28px 32px' }}>
        <div style={{ fontSize: 12, color: '#8FA396', letterSpacing: '.3px', marginBottom: 6 }}>Destek &amp; Yardım Merkezi</div>
        <div style={{ fontSize: 22, fontWeight: 600, color: '#FFFFFF' }}>Kullanım kılavuzu ve roller</div>
        <div style={{ fontSize: 13, color: '#9DAE9F', marginTop: 4 }}>Sisteme yeni başlayanlar için adım adım anlatım, rol bazlı yetkiler ve genişletilmiş sık sorulan sorular</div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '14px 32px 0', borderBottom: '0.5px solid #E2DED0', background: '#F3F0E8', flexWrap: 'wrap' }}>
        <button
          className={`km-tab ${activeTab === 'genel' ? 'active' : ''}`}
          onClick={() => setActiveTab('genel')}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === 'genel' ? '#0F5C43' : '#6B685E',
            borderBottom: activeTab === 'genel' ? '2px solid #0F5C43' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Genel bakış
        </button>
        <button
          className={`km-tab ${activeTab === 'roller' ? 'active' : ''}`}
          onClick={() => setActiveTab('roller')}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === 'roller' ? '#0F5C43' : '#6B685E',
            borderBottom: activeTab === 'roller' ? '2px solid #0F5C43' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Roller ve yetkiler
        </button>
        <button
          className={`km-tab ${activeTab === 'modul' ? 'active' : ''}`}
          onClick={() => setActiveTab('modul')}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === 'modul' ? '#0F5C43' : '#6B685E',
            borderBottom: activeTab === 'modul' ? '2px solid #0F5C43' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          Modül kılavuzları
        </button>
        <button
          className={`km-tab ${activeTab === 'sss' ? 'active' : ''}`}
          onClick={() => setActiveTab('sss')}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === 'sss' ? '#0F5C43' : '#6B685E',
            borderBottom: activeTab === 'sss' ? '2px solid #0F5C43' : '2px solid transparent',
            cursor: 'pointer'
          }}
        >
          SSS
        </button>
        <button
          className={`km-tab ${activeTab === 'talepler' ? 'active' : ''}`}
          onClick={() => setActiveTab('talepler')}
          style={{
            border: 'none',
            background: 'none',
            padding: '10px 14px',
            fontSize: 13,
            fontWeight: 600,
            color: activeTab === 'talepler' ? '#0F5C43' : '#6B685E',
            borderBottom: activeTab === 'talepler' ? '2px solid #0F5C43' : '2px solid transparent',
            cursor: 'pointer',
            marginLeft: 'auto'
          }}
        >
          💬 Teknik Destek Talepleri ({tickets.length})
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ padding: '24px 32px 32px' }}>

        {/* TAB 1: Genel bakış */}
        {activeTab === 'genel' && (
          <div className="km-panel">
            <div style={{ fontSize: 13, color: '#6B685E', marginBottom: 16 }}>
              Yeni bir kullanıcı mısınız? Rolünüze göre önerilen başlangıç adımlarını takip edin.
            </div>

            {/* 3 Quick Start Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 10, padding: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43', fontSize: 16, marginBottom: 8 }}>
                  <IconUsers size={18} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#22281F', marginBottom: 2 }}>1. Hesabınızı tanıyın</div>
                <div style={{ fontSize: 12, color: '#6B685E' }}>Profil, şube seçimi ve bildirim tercihleri</div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 10, padding: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43', fontSize: 16, marginBottom: 8 }}>
                  <IconCalendar size={18} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#22281F', marginBottom: 2 }}>2. Günlük akışı öğrenin</div>
                <div style={{ fontSize: 12, color: '#6B685E' }}>Randevu, hasta kaydı ve kasa işlemleri</div>
              </div>

              <div style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 10, padding: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F0E8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F5C43', fontSize: 16, marginBottom: 8 }}>
                  <IconCheck size={18} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#22281F', marginBottom: 2 }}>3. Yetkinizi kontrol edin</div>
                <div style={{ fontSize: 12, color: '#6B685E' }}>Rolünüzün erişebildiği ekranları görün</div>
              </div>
            </div>

            {/* Kılavuz içindekiler */}
            <div style={{ fontSize: 13, fontWeight: 600, color: '#22281F', marginBottom: 10 }}>Kılavuz içindekiler</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#E2DED0', borderRadius: 10, overflow: 'hidden', border: '0.5px solid #E2DED0' }}>
              <div
                onClick={() => setActiveTab('modul')}
                style={{ background: '#fff', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#22281F', cursor: 'pointer' }}
              >
                Hasta ve randevu yönetimi <span style={{ color: '#6B685E', fontSize: 12 }}>6 başlık</span>
              </div>
              <div
                onClick={() => setActiveTab('modul')}
                style={{ background: '#fff', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#22281F', cursor: 'pointer' }}
              >
                SGK ve reçete süreçleri <span style={{ color: '#6B685E', fontSize: 12 }}>5 başlık</span>
              </div>
              <div
                onClick={() => setActiveTab('modul')}
                style={{ background: '#fff', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#22281F', cursor: 'pointer' }}
              >
                Kasa, tahsilat ve muhasebe <span style={{ color: '#6B685E', fontSize: 12 }}>4 başlık</span>
              </div>
              <div
                onClick={() => setActiveTab('roller')}
                style={{ background: '#fff', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#22281F', cursor: 'pointer' }}
              >
                Şubeler ve kullanıcı yetkileri <span style={{ color: '#6B685E', fontSize: 12 }}>3 başlık</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Roller ve yetkiler */}
        {activeTab === 'roller' && (
          <div className="km-panel">
            <div style={{ fontSize: 13, color: '#6B685E', marginBottom: 16 }}>
              Her rolün panelde görebildiği bölümler ve yapabileceği işlemler.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rolesData.map((role, idx) => (
                <div key={idx} style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#22281F' }}>{role.title}</div>
                    <span style={{
                      fontSize: 11,
                      background: role.badgeType === 'admin' ? '#0F5C43' : '#EAF1EC',
                      color: role.badgeType === 'admin' ? '#fff' : '#0F5C43',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontWeight: 600
                    }}>
                      {role.badge}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B685E', lineHeight: '1.5' }}>{role.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Modül kılavuzları */}
        {activeTab === 'modul' && (
          <div className="km-panel">
            <div style={{ fontSize: 13, color: '#6B685E', marginBottom: 16 }}>
              Her modül için kısa, adım adım kullanım anlatımı. (Detayları görmek için başlığa tıklayın)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {moduleGuides.map((guide, idx) => {
                const isOpen = expandedModuleIndex === idx;
                return (
                  <div key={idx} style={{ background: '#fff', border: '0.5px solid #E2DED0', borderRadius: 10, overflow: 'hidden' }}>
                    <div
                      onClick={() => setExpandedModuleIndex(isOpen ? null : idx)}
                      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, fontWeight: 600, color: '#22281F' }}>
                        <span style={{ color: '#0F5C43', display: 'flex' }}>
                          {guide.icon === 'calendar' && <IconCalendar size={18} />}
                          {guide.icon === 'sgk' && <IconSGK size={18} />}
                          {guide.icon === 'cash' && <IconCash size={18} />}
                          {guide.icon === 'stock' && <IconStock size={18} />}
                          {guide.icon === 'users' && <IconPatients size={18} />}
                        </span>
                        {guide.title}
                      </div>
                      <span style={{ color: '#6B685E', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                        <IconChevronDown size={16} />
                      </span>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0 16px 16px 46px', borderTop: '0.5px solid #F0ECE1', paddingTop: 12 }}>
                        {guide.steps.map((step, sIdx) => (
                          <div key={sIdx} style={{ fontSize: 12, color: '#4A5568', marginBottom: 6, lineHeight: 1.5 }}>
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: SSS */}
        {activeTab === 'sss' && (
          <div className="km-panel">
            <input
              id="km-search"
              placeholder="Sorularda ara..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              style={{
                width: '100%',
                height: 38,
                border: '0.5px solid #E2DED0',
                borderRadius: 8,
                padding: '0 12px',
                fontSize: 13,
                marginBottom: 16,
                boxSizing: 'border-box',
                background: '#fff',
                outline: 'none'
              }}
            />

            <div id="km-faq" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.keys(groupedFaqs).length > 0 ? (
                Object.keys(groupedFaqs).map((catName, catIdx) => (
                  <div key={catIdx}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0F5C43', margin: '4px 0 8px', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                      {catName}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {groupedFaqs[catName].map((item, itemIdx) => {
                        const globalIndex = catIdx * 100 + itemIdx;
                        const isExpanded = expandedFaqIndex === globalIndex;
                        return (
                          <div
                            key={itemIdx}
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : globalIndex)}
                            style={{
                              background: '#fff',
                              border: '0.5px solid #E2DED0',
                              borderRadius: 8,
                              padding: '12px 16px',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#22281F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span>{item.q}</span>
                              <span style={{ color: '#6B685E', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'flex' }}>
                                <IconChevronDown size={16} />
                              </span>
                            </div>
                            {isExpanded && (
                              <div style={{ fontSize: 12, color: '#6B685E', marginTop: 10, borderTop: '0.5px solid #F0ECE1', paddingTop: 8, lineHeight: 1.6 }}>
                                {item.a}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#6B685E', fontSize: 13 }}>
                  Aramanıza uygun soru bulunamadı.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Teknik Destek Talepleri */}
        {activeTab === 'talepler' && (
          <div className="km-panel">
            {!selectedTicket ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#22281F' }}>Teknik Destek Biletleriniz</h3>
                    <div style={{ fontSize: 12, color: '#6B685E', marginTop: 2 }}>Yazılım ve entegrasyon ile ilgili teknik destek talepleriniz</div>
                  </div>
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    style={{
                      background: '#0F5C43',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <IconPlus size={16} /> Talep Oluştur
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tickets.map((tkt) => (
                    <div
                      key={tkt.id}
                      onClick={() => setSelectedTicket(tkt)}
                      style={{
                        background: '#fff',
                        border: '0.5px solid #E2DED0',
                        borderRadius: 10,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: '#22281F', fontSize: 13, marginBottom: 4 }}>{tkt.subject}</div>
                        <div style={{ fontSize: 12, color: '#6B685E' }}>Kategori: {tkt.category} · Tarih: {tkt.date}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: tkt.status === 'Cevaplandı' ? '#E1F0E8' : (tkt.status === 'Çözüldü' ? '#DCFCE7' : '#FEF3C7'),
                          color: tkt.status === 'Cevaplandı' ? '#0F5C43' : (tkt.status === 'Çözüldü' ? '#15803D' : '#B45309')
                        }}>
                          {tkt.status}
                        </span>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 12,
                          background: (tkt.priority === 'Yüksek' || tkt.priority === 'Kritik') ? '#FEE2E2' : '#F3F4F6',
                          color: (tkt.priority === 'Yüksek' || tkt.priority === 'Kritik') ? '#B91C1C' : '#4B5563'
                        }}>
                          {tkt.priority} Öncelik
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              /* Ticket Detail View */
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '0.5px solid #E2DED0', paddingBottom: 12 }}>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#6B685E' }}
                  >
                    <IconBack size={18} />
                  </button>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#22281F' }}>{selectedTicket.subject}</h4>
                    <div style={{ fontSize: 11, color: '#6B685E', marginTop: 2 }}>ID: {selectedTicket.id} · Durum: {selectedTicket.status}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#fff', padding: 14, borderRadius: 8, border: '0.5px solid #E2DED0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6B685E', marginBottom: 6 }}>
                      <strong>Ben (Firma Yöneticisi)</strong>
                      <span>{selectedTicket.date}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#22281F', margin: 0, lineHeight: 1.5 }}>{selectedTicket.message}</p>
                  </div>

                  {selectedTicket.replies.map((rep, idx) => (
                    <div key={idx} style={{ background: '#E1F0E8', padding: 14, borderRadius: 8, border: '0.5px solid #B8DCFA', alignSelf: 'flex-end', width: '92%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#0F5C43', marginBottom: 6 }}>
                        <strong>{rep.author}</strong>
                        <span>{rep.date}</span>
                      </div>
                      <p style={{ fontSize: 13, color: '#0F5C43', margin: 0, lineHeight: 1.5 }}>{rep.message}</p>
                    </div>
                  ))}

                  {selectedTicket.status !== 'Çözüldü' ? (
                    <form onSubmit={handleSendReply} style={{ borderTop: '0.5px solid #E2DED0', paddingTop: 14, marginTop: 6 }}>
                      <textarea
                        className="form-input"
                        rows={3}
                        placeholder="Yanıtınızı buraya yazın..."
                        value={newReplyMessage}
                        onChange={(e) => setNewReplyMessage(e.target.value)}
                        required
                        style={{ width: '100%', borderRadius: 8, padding: 10, fontSize: 13, marginBottom: 10, resize: 'none', border: '0.5px solid #E2DED0' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'Çözüldü' } : t));
                            setSelectedTicket(null);
                            addToast({ type: 'success', message: 'Talep çözüldü olarak kapatıldı.' });
                          }}
                          style={{ padding: '6px 14px', fontSize: 12 }}
                        >
                          Sorun Çözüldü (Kapat)
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 12, background: '#0F5C43', border: 'none' }}>Yanıtla</button>
                      </div>
                    </form>
                  ) : (
                    <div style={{ padding: 12, background: '#DCFCE7', color: '#15803D', textAlign: 'center', borderRadius: 8, fontWeight: 600, fontSize: 12 }}>
                      Bu talep çözüldü olarak kapatılmıştır.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 500,
            padding: '24px 28px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#22281F' }}>Yeni Destek Talebi Oluştur</h3>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B685E' }}
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, display: 'block' }}>Konu / Başlık</label>
                <input
                  className="form-input"
                  placeholder="Sorun veya talebinizi özetleyin"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  required
                  style={{ width: '100%', height: 38, borderRadius: 6, padding: '0 10px', fontSize: 13, border: '0.5px solid #E2DED0' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, display: 'block' }}>Kategori</label>
                  <select
                    className="form-input"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', height: 38, borderRadius: 6, padding: '0 8px', fontSize: 13, border: '0.5px solid #E2DED0' }}
                  >
                    <option value="Sistem Hatası">Sistem Hatası</option>
                    <option value="Kullanım Yardımı">Kullanım Yardımı</option>
                    <option value="Yeni Özellik Talebi">Yeni Özellik Talebi</option>
                    <option value="SGK & Entegrasyon">SGK & Entegrasyon</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, display: 'block' }}>Öncelik Seviyesi</label>
                  <select
                    className="form-input"
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    style={{ width: '100%', height: 38, borderRadius: 6, padding: '0 8px', fontSize: 13, border: '0.5px solid #E2DED0' }}
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Kritik">Kritik</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 18 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: 12, marginBottom: 4, display: 'block' }}>Detaylı Açıklama</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Yaşadığınız sorunun adımlarını veya talebinizi detaylıca yazın."
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  required
                  style={{ width: '100%', borderRadius: 6, padding: 10, fontSize: 13, resize: 'none', border: '0.5px solid #E2DED0' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewTicketModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, fontSize: 13 }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '8px 18px', borderRadius: 6, fontSize: 13, background: '#0F5C43', border: 'none' }}
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
