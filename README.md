# 🎧 AudiPro — İşitme Merkezi Yönetim & Otomasyon Platformu

> **Enterprise SaaS Mimarisinde İşitme Cihazı Merkezleri için Yeni Nesil Çok Şubeli Klinik, Envanter ve Finans Otomasyonu**

![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-SSR%20%26%20RLS-emerald?logo=supabase)
![Playwright](https://img.shields.io/badge/Playwright-60%20E2E%20Passed-green?logo=playwright)
![Vitest](https://img.shields.io/badge/Vitest-91%20Tests%20Passed-yellow?logo=vitest)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

---

## 🚀 Genel Bakış (Overview)

**AudiPro**, modern işitme cihazı satış ve uygulama merkezlerinin tüm operasyonel ihtiyaçlarını tek bir entegre platformda toplayan bulut tabanlı bir yönetim otomasyonudur. 

Hasta ilişkileri (CRM), randevu takvimi, seri numaralı cihaz/stok envanteri, kasa ve finansal hareketler, SGK/Medula evrak süreçleri ve teknik servis takibi gibi kritik süreçleri **Domain-Driven Design (DDD)** ve **Multi-Tenant** güvenlik standartlarıyla yönetir.

---

## ✨ Temel Modüller ve Özellikler

### 🏢 1. Çoklu Şube & Multi-Tenant Mimarisi
- **Organizasyon İzolasyonu:** Her firma veritabanı düzeyinde Row Level Security (RLS) ile tamamen izoledir.
- **Konsolide & Şube Bazlı Çalışma:** Üst yönetim tek tıkla tüm şubelerin konsolide verilerini veya münferit bir şubenin operasyonunu izleyebilir.
- **Rol ve Yetki Matrisi:** Firma Yöneticisi, Şube Müdürü, Odyolog ve Personel rolleriyle dinamik menü ve aksiyon yetkilendirmesi.

### 👥 2. Hasta Yönetimi & CRM
- **Akıllı Hasta Dizini:** İsim, telefon, TC kimlik ve cihaz seri numarasıyla anlık normalizasyonlu arama.
- **Hızlı Segmentasyon:** Cihaz kullananlar, önümüzdeki 7 günde randevusu olanlar, recall bekleyenler ve yeni hastalar için hızlı filtreler.
- **Hasta Zaman Çizelgesi (Timeline):** Muayene, test, cihaz denemesi ve satış hareketlerinin kronolojik işlem günlüğü.
- **Odyometri & Sağlık Verisi:** Çift kulak hava/kemik odyogram verileri, kayıp derecesi ve KVKK rıza takibi.

### 📅 3. Akıllı Randevu & Takvim
- **Çoklu Takvim Görünümü:** Günlük zaman çizelgesi (timeline slots), haftalık özet, aylık ızgara ve filtrelenebilir liste görünümü.
- **Durum Akışı:** *Bekliyor*, *Geldi*, *İşlem Tamamlandı*, *Hatırlatıldı* ve *İptal* durumları.
- **Hızlı Randevu Detayı:** Tek tıkla randevu detay penceresi, hasta bilgileri ve doğrudan düzenleme desteği.
- **WhatsApp Entegrasyonu:** Randevu hatırlatma ve bilgilendirme bağlantıları.

### 📦 4. Stok, Aksesuar & ÜTS Envanter Takibi
- **Kapsamlı Envanter:** İşitme cihazı, pil, kulak kalıbı ve aksesuarlar için kategorize edilmiş stok kartları.
- **Seri Numarası & Barkod:** Cihazlara özel seri numarası, barkod ve garanti bitiş tarihi eşleştirmesi.
- **ÜTS (Ürün Takip Sistemi) Uyumluluğu:** Kurum no, GLN ve tekil ürün ÜTS bildirim durumları (*Bildirildi*, *Bekliyor*, *Hata*).
- **Kritik Seviye & Hızlı Satış:** Kritik stok uyarıları, doğrudan satış formu ile otomatik stok düşümü ve kasa kaydı.

### 🔔 5. Recall (Geri Çağırma & Periyodik Takip)
- **Periyodik Bakım & Filtre:** Cihaz yıllık kontrolü, 5 yıllık SGK yenileme hakkı ve periyodik pil ihtiyaçları için otomatik hatırlatıcılar.
- **Özet Metrikler:** Tarihi geçen, bu ay beklenen ve yaklaşan hatırlatma sayaçları.
- **Aksiyon Yönetimi:** Tek tıkla tamamlandı işaretleme veya doğrudan randevuya dönüştürme.

### 💳 6. Kasa, Masraf & Finansal Hareketler
- **Çoklu Kasa:** Merkez ve şube kasaları bazında nakit, POS/kredi kartı ve banka transferi ayrımı.
- **İdempotency Koruması:** Çift kayıt oluşmasını engelleyen tekil işlem anahtarı güvenliği.
- **Gider & Tedarikçi Yönetimi:** Tedarikçi faturaları, cari bakiye takibi ve kategorize edilmiş operasyonel masraflar.

### 🏛️ 7. SGK, Medula & Rapor Takibi
- **Reçete & Rapor Yönetimi:** e-Reçete no, rapor no ve SGK Medula uygunluk durumu takibi.
- **Dönem Bazlı Faturalama:** SGK hakediş fatura dönemleri, kesinti oranları ve tahsilat geçmişi.

### 🔧 8. Teknik Servis & Demirbaş
- **Servis İş Emri:** Hasta cihazı teslim alma, arıza bildirimi ve onarım durumu takibi.
- **Yedek Parça Entegrasyonu:** Serviste kullanılan parçaların otomatik stoktan düşülmesi ve işçilik tahsilatı.
- **Yazdırılabilir Raporlar:** Tek tıkla resmi, yazdırılabilir teknik servis teslim/onarım fişi.
- **Demirbaş Takibi:** Klinik içi odyometre, kabin ve bilgisayar gibi demirbaşların kalibrasyon ve garanti takibi.

---

## 🏛️ Mimari Katman Yapısı (Architecture Layering)

AudiPro, iş kurallarını UI bileşenlerinden izole eden **Clean Architecture / DDD** ilkelerini benimser:

```
┌─────────────────────────────────────────────────────────────┐
│                 UI (Pages & Shared Components)              │
│      React 19, CSS Modules, Responsive Layout & Drawers      │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│           Domain Services & Application State               │
│     AppContext, BranchService, ServiceDomainService, EventBus│
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Data Access & Mappers                      │
│        database.ts, entityMappers, cryptoUtils (AES/GCM)    │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Supabase / PostgreSQL Core                   │
│   RLS Policies, Stored Procedures (RPC), Auth & Storage     │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Teknoloji Yığını (Tech Stack)

| Alan | Teknoloji | Açıklama |
|:---|:---|:---|
| **Framework** | Next.js 16.3 (App Router) | Hibrit SSR & Client-side Rendering |
| **Kütüphane** | React 19.2 | En güncel React sürümü ve hook altyapısı |
| **Dil** | TypeScript 5.x | Uçtan uca tip güvenliği |
| **Veritabanı & Auth** | Supabase (PostgreSQL) | RLS, RPC Stored Procedures, SSR Auth |
| **Stil** | Vanilla CSS Modules | Yüksek performanslı, esnek ve modern tasarım |
| **Birim Testleri** | Vitest 4.1 | 21 test dosyasında 91 kapsamlı test |
| **E2E Testleri** | Playwright 1.63 | 60 uçtan uca kullanıcı akışı senaryosu |
| **Dışa Aktarma** | ExcelJS | Toplu hasta aktarımı ve rapor dışa aktarma |

---

## ⚡ Kurulum ve Çalıştırma (Getting Started)

### 1. Depoyu Klonlayın ve Bağımlılıkları Yükleyin
```bash
git clone https://github.com/ahmedy55/isitme-merkezi.git
cd isitme-merkezi
npm install
```

### 2. Ortam Değişkenlerini Tanımlayın (`.env.local`)
Kök dizinde bir `.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Geliştirici Sunucusunu Başlatın
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde kullanıma hazır olacaktır.

---

## 🧪 Test ve Kalite Güvencesi (QA & Testing)

Tüm iş akışları otomatik birim, entegrasyon ve uçtan uca (E2E) testlerle korunmaktadır:

```bash
# 1. TypeScript Statik Tip Kontrolü
npm run typecheck

# 2. Vitest Birim ve Entegrasyon Testleri (91 test)
npm run test

# 3. Playwright Uçtan Uca (E2E) Test Paketi (60 senaryo)
npm run test:e2e:ui

# 4. Kritik P0 Güvenlik ve Yetki Testleri
npm run test:e2e:p0

# 5. ESLint Kod Analizi
npm run lint

# 6. Üretim Derlemesi Doğrulaması
npm run build
```

---

## 🛡️ Güvenlik ve Veri Koruma Standartları

- **Row Level Security (RLS):** Hiçbir kiracı diğer kiracının verilerine erişemez; yetkilendirme doğrudan veritabanı motorunda zorunlu kılınır.
- **Hassas Veri Şifreleme:** Hasta TC kimlik numaraları veritabanında `pgcrypto` ile şifreli (`ENC:`) saklanır; yetkili oturumlara RPC aracılığıyla çözülerek aktarılır.
- **Service Role İzolasyonu:** Hizmet rol anahtarı (Service Role Key) asla tarayıcı istemcisine gönderilmez, sadece sunucu taraflı güvenli rotalarda kullanılır.
- **Denetim İzi (Audit Logging):** Kritik kayıt ekleme, silme ve düzenleme işlemleri `AuditServiceEnriched` aracılığıyla işlem geçmişine yazılır.

---

## 📜 Lisans

Gizli ve Özel Mülk — Tüm Hakları Saklıdır.
