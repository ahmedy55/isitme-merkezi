'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  IconCalculator, IconCalendar, IconCash, IconChevronDown,
  IconClose, IconCrown, IconMessage, IconPatients, IconPlus, IconSearch,
  IconSGK, IconStethoscope, IconStock, IconStore, IconSupport, IconUsers,
  IconWarning,
} from '../components/Icons';
import styles from './SupportPage.module.css';

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  priority: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik';
  message: string;
  status: 'Açık' | 'Çözüldü';
  createdAt: string;
};

const faqs = [
  { category: 'Randevular', question: 'Randevu oluştururken çakışma hatası alıyorum, ne yapmalıyım?', answer: 'Seçili şube, gün ve saat aralığını; ayrıca randevuya atanmış çalışanı kontrol edin. Aynı çalışan için aynı saat aralığında başka bir randevu varsa uygun bir saat seçin.' },
  { category: 'SGK & Reçete', question: 'SGK ödemesi ne zaman alınacak?', answer: 'SGK’ya kesilen dönem faturası ve beklenen ödeme tarihi SGK Ödeme Takvimi ekranına manuel kaydedilir. Takvim tahmini geri sayım sağlar; SGK sisteminden ödeme doğrulaması yapmaz.' },
  { category: 'Hastalar', question: 'Hasta kartında geçmiş randevuları nasıl görüntülerim?', answer: 'Hastalar ekranından hastayı açın. Hasta detayındaki randevu ve işlem geçmişi, erişim yetkiniz kapsamında görüntülenir.' },
  { category: 'Stok & Aksesuar', question: 'Cihazın barkod ve seri numarasını nerede görebilirim?', answer: 'Stok & Aksesuar ekranında cihaz satırında seri numarası ve barkod görüntülenir. Satış tamamlandığında cihaz hasta ile ilişkilendirilir.' },
  { category: 'Kasa & Muhasebe', question: 'Bir cihaz satışı kasaya ve raporlara yansır mı?', answer: 'Satış işlemi tamamlandığında satış kaydı, stok hareketi ve kasa girişi birlikte oluşturulur; ciro ilgili raporlara yansır.' },
  { category: 'Teknik Servis', question: 'Servise gönderdiğim cihazı nasıl takip ederim?', answer: 'Teknik Servis ekranında servis kaydı oluşturup hastayı ve cihazın seri numarasını seçin. Durum güncellemelerini aynı kayıt üzerinden izleyebilirsiniz.' },
  { category: 'Kullanıcı yetkileri', question: 'Kullanıcılara ait roller ve yetki seviyeleri nasıl belirlenir?', answer: 'Şubeler & Yetki ekranında kullanıcıya rol ve erişebileceği şubeler atanır. Kullanıcı yalnızca rolünün ve şube kapsamının izin verdiği verilere erişebilir.' },
  { category: 'Kullanıcı yetkileri', question: 'Tek şubeli işletmede şube seçimi neden görünmüyor?', answer: 'Tek aktif şubesi bulunan işletmelerde seçici gereksiz olduğu için gizlenir; işlemler o şube kapsamında yürütülür.' },
  { category: 'Tedarikçiler', question: 'Tedarikçi faturası veya ödemesi nasıl kaydedilir?', answer: 'Tedarikçiler ekranında firma bilgilerini yönetin. Ödeme ve gider hareketlerini Kasa, Tahsilat & Masraflar ekranından kaydedin.' },
];

const topics = [
  { title: 'Randevu Yönetimi', description: 'Randevu oluşturma, düzenleme ve iptal', icon: IconCalendar, tone: 'mint', page: 'appointments' as const },
  { title: 'Hasta İşlemleri', description: 'Hasta kaydı, hasta kartı ve geçmişi', icon: IconPatients, tone: 'blue', page: 'patients' as const },
  { title: 'SGK & Reçete', description: 'Reçete kayıtları ve ödeme takvimi', icon: IconSGK, tone: 'amber', page: 'sgk' as const },
  { title: 'Kasa & Muhasebe', description: 'Satış, tahsilat ve masraflar', icon: IconCalculator, tone: 'violet', page: 'cash' as const },
  { title: 'Stok & Aksesuar', description: 'Ürün, barkod ve stok yönetimi', icon: IconStock, tone: 'rose', page: 'stock' as const },
  { title: 'Teknik Servis', description: 'Cihaz kaydı, onarım ve takip', icon: IconStethoscope, tone: 'teal', page: 'service' as const },
];

const guides = [
  {
    title: 'Randevu oluşturma ve yönetimi',
    description: 'Hasta, çalışan ve uygun zaman seçerek randevu planlayın.',
    category: 'Randevular',
    icon: IconCalendar,
    steps: ['Sol menüden Randevular ekranını açın.', 'Yeni Randevu seçeneğiyle hasta ve şube bilgilerini belirleyin.', 'Uygun gün, saat, çalışan ve randevu türünü seçip kaydedin.', 'Değişiklik veya iptal için randevu kaydını açın.'],
  },
  {
    title: 'SGK faturası ve ödeme takvimi',
    description: 'Dönem faturası tutarını ve beklenen tahsilat tarihini kaydedin.',
    category: 'SGK & Reçete',
    icon: IconSGK,
    steps: ['SGK & Reçete ekranındaki dönem işlemlerinizi kontrol edin.', 'SGK’ya kestiğiniz dönem faturası tutarını SGK Ödeme Takvimi’ne manuel ekleyin.', 'Fatura dönemi ve beklenen ödeme tarihini girin.', 'Takvimdeki tarih ve tutarların tahmini olduğunu, gerçek SGK ödeme bilgisi olmadığını unutmayın.'],
  },
  {
    title: 'Satış, tahsilat ve kasa takibi',
    description: 'Satışı kaydedin; kasa ve rapor yansımalarını takip edin.',
    category: 'Kasa & Muhasebe',
    icon: IconCash,
    steps: ['Kasa, Tahsilat & Masraflar ekranında Yeni Satış’ı seçin.', 'Hastayı ve satılacak stok cihazını belirleyin.', 'Ödeme şeklini ve tahsilat tutarını girip satışı tamamlayın.', 'Kasa hareketi, stok düşümü ve rapor ciro kaydını kontrol edin.'],
  },
  {
    title: 'Cihaz barkodu ve stok hareketleri',
    description: 'Seri numarası ve barkodla cihazı şubeye kaydedin.',
    category: 'Stok & Aksesuar',
    icon: IconStock,
    steps: ['Stok & Aksesuar ekranından Yeni Ürün Ekle’yi seçin.', 'Cihazın seri numarasını ve kutu üzerindeki barkod numarasını girin.', 'Şubeyi, maliyet ve satış fiyatını kaydedin.', 'Satışta cihazın hasta ile ilişkilendirildiğini stok listesinden doğrulayın.'],
  },
  {
    title: 'Kullanıcı ekleme ve rol atama',
    description: 'Çalışan erişimlerini rol ve şube kapsamına göre yönetin.',
    category: 'Kullanıcı yetkileri',
    icon: IconUsers,
    steps: ['Şubeler & Yetki ekranına gidin.', 'Kullanıcıyı ekleyip uygun rolü seçin.', 'Kullanıcının erişebileceği şubeleri belirleyin.', 'Erişimi, kullanıcı oturumuyla ve ilgili sayfalarda doğrulayın.'],
  },
];

const roleCards = [
  { title: 'Firma yöneticisi', label: 'Yönetim', description: 'Firma ayarlarını, şubeleri, kullanıcıları ve konsolide görünümü yönetir.', icon: IconCrown },
  { title: 'Şube yöneticisi', label: 'Şube kapsamı', description: 'Yetkilendirildiği şubenin günlük operasyonlarını yönetir.', icon: IconStore },
  { title: 'Odyometrist', label: 'Klinik', description: 'Rol ve şube yetkisi kapsamında hasta, randevu ve cihaz süreçlerinde çalışır.', icon: IconStethoscope },
  { title: 'Sekreter', label: 'Ön büro', description: 'Rol ve şube yetkisi kapsamında hasta ve randevu işlemlerini yürütür.', icon: IconSupport },
  { title: 'Muhasebe', label: 'Mali işler', description: 'Yetkisi dahilindeki kasa, masraf, satış ve tedarikçi hareketlerini takip eder.', icon: IconCalculator },
];

export default function SupportPage() {
  const { addToast, setCurrentPage } = useApp();
  const [search, setSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [activeGuideFilter, setActiveGuideFilter] = useState('Tümü');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showTickets, setShowTickets] = useState(false);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Kullanım Yardımı');
  const [priority, setPriority] = useState<SupportTicket['priority']>('Orta');
  const [message, setMessage] = useState('');

  const visibleFaqs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('tr-TR');
    if (!query) return faqs;
    return faqs.filter(item => `${item.category} ${item.question} ${item.answer}`.toLocaleLowerCase('tr-TR').includes(query));
  }, [search]);

  const visibleGuides = activeGuideFilter === 'Tümü'
    ? guides
    : guides.filter(guide => activeGuideFilter === 'Adım Adım' || guide.category === activeGuideFilter);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const searchGuides = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    scrollTo('support-faq');
  };

  const submitTicket = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subject.trim() || !message.trim()) {
      addToast({ type: 'error', message: 'Lütfen konu ve açıklama alanlarını doldurun.' });
      return;
    }

    const ticket: SupportTicket = {
      id: `local-${Date.now()}`,
      subject: subject.trim(),
      category,
      priority,
      message: message.trim(),
      status: 'Açık',
      createdAt: new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date()),
    };
    setTickets(current => [ticket, ...current]);
    setShowTicketModal(false);
    setShowTickets(true);
    setSubject('');
    setMessage('');
    addToast({ type: 'success', message: 'Talep bu oturum için listeye eklendi.' });
  };

  const markTicketResolved = (id: string) => {
    setTickets(current => current.map(ticket => ticket.id === id ? { ...ticket, status: 'Çözüldü' } : ticket));
  };

  return (
    <main className={styles.page}>
      <div className={styles.heroGrid}>
        <section className={styles.hero} aria-labelledby="support-heading">
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>Destek &amp; Yardım Merkezi</div>
            <h1 id="support-heading">Nasıl yardımcı olabiliriz?</h1>
            <p>İşitme Merkezi’ni daha verimli kullanmanız için kılavuzlar, adım adım anlatımlar ve sık sorulan sorular burada.</p>
            <form className={styles.searchForm} onSubmit={searchGuides} role="search">
              <IconSearch size={20} />
              <input
                aria-label="Destek içeriklerinde ara"
                placeholder="Destek içeriklerinde arama yapın..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
              <button type="submit">Ara</button>
            </form>
            <div className={styles.popularSearches}>
              <span>Popüler aramalar:</span>
              {['randevu', 'reçete', 'sgk', 'kasa', 'kullanıcı ekleme'].map(term => (
                <button key={term} type="button" onClick={() => { setSearch(term); scrollTo('support-faq'); }}>{term}</button>
              ))}
            </div>
          </div>
          <div className={styles.heroArt} aria-hidden="true">
            <span className={styles.questionBubble}>?</span>
            <span className={styles.bulb} />
            <span className={styles.book}><i /><i /><i /><i /><i /><i /></span>
            <span className={styles.artSpark}>✳</span>
          </div>
        </section>

        <aside className={styles.quickColumn} aria-label="Hızlı destek">
          <section className={styles.quickCard}>
            <h2><span className={`${styles.iconTile} ${styles.mint}`}><IconMessage size={20} /></span>Hızlı Destek</h2>
            <button className={styles.quickAction} onClick={() => setShowTicketModal(true)}>
              <span className={`${styles.iconTile} ${styles.blue}`}><IconMessage size={20} /></span>
              <span><strong>Teknik destek talebi oluştur</strong><small>Talep formunu doldurun</small></span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.quickAction} onClick={() => { setShowTickets(true); scrollTo('support-tickets'); }}>
              <span className={`${styles.iconTile} ${styles.mint}`}><IconSearch size={20} /></span>
              <span><strong>Taleplerimi görüntüle</strong><small>Bu oturumda oluşturduklarınız</small></span>
              <span className={styles.chevron}>›</span>
            </button>
            <button className={styles.quickAction} onClick={() => scrollTo('support-faq')}>
              <span className={`${styles.iconTile} ${styles.amber}`}><IconWarning size={20} /></span>
              <span><strong>Yardım konularına göz atın</strong><small>Yanıtı hızlıca bulun</small></span>
              <span className={styles.chevron}>›</span>
            </button>
          </section>
        </aside>
      </div>

      <div className={styles.topicSupportGrid}>
      <section className={`${styles.section} ${styles.topicSection}`} aria-labelledby="topics-heading">
        <div className={styles.sectionHeading}>
          <h2 id="topics-heading"><IconDashboardMark />Popüler Konular</h2>
          <button className={styles.textLink} onClick={() => scrollTo('support-guides')}>Tüm kılavuzları gör <span>→</span></button>
        </div>
        <div className={styles.topicGrid}>
          {topics.map(topic => {
            const TopicIcon = topic.icon;
            return (
              <button className={styles.topicCard} key={topic.title} onClick={() => setCurrentPage(topic.page)}>
                <span className={`${styles.topicIcon} ${styles[topic.tone]}`}><TopicIcon size={24} /></span>
                <span className={styles.topicCopy}><strong>{topic.title}</strong><small>{topic.description}</small></span>
                <span className={styles.chevron}>›</span>
              </button>
            );
          })}
        </div>
      </section>
      <aside className={styles.availabilityCard}>
        <span className={styles.availabilityIcon}>i</span>
        <div><strong>Destek talebiniz mi var?</strong><p>Talebinizi bu ekrandan oluşturabilirsiniz. Gönderimler şu anda yalnızca oturum süresince saklanır.</p></div>
      </aside>
      </div>

      <section className={styles.section} id="support-guides" aria-labelledby="guides-heading">
        <div className={styles.sectionHeading}>
          <h2 id="guides-heading"><span className={styles.headingBook}>▤</span>Öne Çıkan Kılavuzlar</h2>
          <div className={styles.filterPills} role="group" aria-label="Kılavuz filtreleri">
            {['Tümü', 'Adım Adım', 'SGK & Reçete', 'Kasa & Muhasebe'].map(filter => (
              <button key={filter} className={activeGuideFilter === filter ? styles.selectedPill : ''} onClick={() => setActiveGuideFilter(filter)}>{filter}</button>
            ))}
          </div>
        </div>
        <div className={styles.guideGrid}>
          {visibleGuides.map((guide, index) => {
            const GuideIcon = guide.icon;
            const isExpanded = expandedGuide === guide.title;
            return (
              <article className={`${styles.guideCard} ${isExpanded ? styles.guideExpanded : ''}`} key={guide.title}>
                <button className={styles.guideButton} onClick={() => setExpandedGuide(isExpanded ? null : guide.title)} aria-expanded={isExpanded}>
                  <span className={`${styles.guideIllustration} ${styles[`guideTone${index % 4}`]}`}><GuideIcon size={30} /></span>
                  <span className={styles.guideCategory}>{guide.category}</span>
                  <strong>{guide.title}</strong>
                  <small>{guide.description}</small>
                  <span className={styles.guideMeta}><span>Adım adım kılavuz</span><span>{guide.steps.length} adım</span></span>
                </button>
                {isExpanded && <ol className={styles.guideSteps}>{guide.steps.map(step => <li key={step}>{step}</li>)}</ol>}
              </article>
            );
          })}
        </div>
      </section>

      <div className={styles.bottomGrid}>
        <section className={styles.faqSection} id="support-faq" aria-labelledby="faq-heading">
          <div className={styles.sectionHeading}>
            <h2 id="faq-heading"><span className={styles.faqMark}>?</span>Sık Sorulan Sorular</h2>
            <span className={styles.resultCount}>{visibleFaqs.length} konu</span>
          </div>
          <div className={styles.faqList}>
            {visibleFaqs.length ? visibleFaqs.map(item => {
              const isExpanded = expandedFaq === item.question;
              return (
                <article className={styles.faqItem} key={item.question}>
                  <button onClick={() => setExpandedFaq(isExpanded ? null : item.question)} aria-expanded={isExpanded}>
                    <span><small>{item.category}</small><strong>{item.question}</strong></span>
                    <IconChevronDown size={18} />
                  </button>
                  {isExpanded && <p>{item.answer}</p>}
                </article>
              );
            }) : <p className={styles.emptyState}>Aramanızla eşleşen bir yardım konusu bulunamadı. Teknik destek talebi oluşturabilirsiniz.</p>}
          </div>
        </section>

        <aside className={styles.rolesAside}>
          <div className={styles.rolesHeading}><IconUsers size={21} /><div><h2>Roller ve yetkiler</h2><p>Erişim, rol ve şube kapsamına göre belirlenir.</p></div></div>
          <div className={styles.roleList}>
            {roleCards.map(role => {
              const RoleIcon = role.icon;
              return <div className={styles.roleCard} key={role.title}><span><RoleIcon size={19} /></span><div><strong>{role.title}</strong><small>{role.description}</small></div><em>{role.label}</em></div>;
            })}
          </div>
          <button className={styles.primaryButton} onClick={() => setCurrentPage('branches')}><IconUsers size={17} />Şube &amp; Yetki ekranına git</button>
        </aside>
      </div>

      <section className={styles.ticketSection} id="support-tickets">
        <div className={styles.ticketIntro}>
          <div><h2><IconMessage size={20} />Teknik Destek Talepleri</h2><p>Yeni bir destek konusu için talep formunu açın.</p></div>
          <button className={styles.outlineButton} onClick={() => setShowTickets(value => !value)}>{showTickets ? 'Talepleri gizle' : `Taleplerimi görüntüle (${tickets.length})`}</button>
        </div>
        {showTickets && <div className={styles.ticketList}>
          <p className={styles.localNotice}>Bu liste yalnızca mevcut tarayıcı oturumunda saklanır; henüz sunucuya gönderilmez.</p>
          {tickets.length === 0 ? <p className={styles.emptyState}>Bu oturumda oluşturulmuş destek talebi yok.</p> : tickets.map(ticket => (
            <article className={styles.ticketCard} key={ticket.id}>
              <div><strong>{ticket.subject}</strong><small>{ticket.category} · {ticket.createdAt} · {ticket.priority} öncelik</small><p>{ticket.message}</p></div>
              <div className={styles.ticketStatus}><span className={ticket.status === 'Açık' ? styles.openStatus : styles.resolvedStatus}>{ticket.status}</span>{ticket.status === 'Açık' && <button onClick={() => markTicketResolved(ticket.id)}>Çözüldü işaretle</button>}</div>
            </article>
          ))}
        </div>}
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaIcon}>✦</div><div><h2>Aradığınız yanıtı bulamadınız mı?</h2><p>Talep formunu açın; taslağınız bu oturumda saklanır.</p></div>
        <button onClick={() => setShowTicketModal(true)}><IconMessage size={17} />Teknik destek talebi oluştur</button>
      </section>

      {showTicketModal && <div className={styles.modalBackdrop} role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setShowTicketModal(false); }}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="ticket-modal-title">
          <div className={styles.modalHeader}><div><span className={styles.eyebrow}>Yardım merkezi</span><h2 id="ticket-modal-title">Yeni destek talebi</h2></div><button aria-label="Kapat" onClick={() => setShowTicketModal(false)}><IconClose size={20} /></button></div>
          <form onSubmit={submitTicket}>
            <label>Konu<input value={subject} onChange={event => setSubject(event.target.value)} placeholder="Sorununuzu kısaca özetleyin" required /></label>
            <div className={styles.formRow}>
              <label>Kategori<select value={category} onChange={event => setCategory(event.target.value)}><option>Kullanım Yardımı</option><option>Sistem Hatası</option><option>Yeni Özellik Talebi</option><option>SGK &amp; Entegrasyon</option><option>Diğer</option></select></label>
              <label>Öncelik<select value={priority} onChange={event => setPriority(event.target.value as SupportTicket['priority'])}><option>Düşük</option><option>Orta</option><option>Yüksek</option><option>Kritik</option></select></label>
            </div>
            <label>Açıklama<textarea value={message} onChange={event => setMessage(event.target.value)} placeholder="Sorunu ve tekrar etmek için izlediğiniz adımları yazın" rows={5} required /></label>
            <p className={styles.localNotice}>Not: Bu formdaki talepler şu anda yalnızca açık oturumda tutuluyor, destek ekibine iletilmiyor.</p>
            <div className={styles.modalActions}><button type="button" className={styles.outlineButton} onClick={() => setShowTicketModal(false)}>Vazgeç</button><button type="submit" className={styles.primaryButton}><IconPlus size={17} />Talebi listeye ekle</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}

function IconDashboardMark() {
  return <span className={styles.dashboardMark} aria-hidden="true"><i /><i /><i /><i /></span>;
}
