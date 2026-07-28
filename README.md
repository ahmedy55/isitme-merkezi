# 🎧 AudiPro — İşitme Merkezi Yönetim Otomasyon Sistemi

> **Enterprise ERP Mimarisinde İşitme Cihazı Merkezleri için Profesyonel Otomasyon Platformu**

![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-SSR-emerald?logo=supabase)
![Vitest](https://img.shields.io/badge/Vitest-4.1-yellow?logo=vitest)
![Build](https://img.shields.io/badge/Build-Passing-brightgreen)

---

## 🏛️ Mimari Katman Yapısı (Architecture Layering)

AudiPro mimarisi, UI katmanını doğrudan veri tabanına bağlamak yerine **DDD (Domain-Driven Design)** ve **Repository Pattern** ilkelerini benimseyen 4 katmanlı kurumsal bir yapıdır:

```
[ UI (Pages & Components) ]
            │
            ▼
[ Service Layer (Domain Services & EventBus) ]
            │
            ▼
[ Data Access Layer (Repositories & Mappers) ]
            │
            ▼
[ Database & External APIs (Supabase SSR & Medula) ]
```

### 📂 Klasör Dizini
- `src/app/pages/`: 23 modüler sayfa bileşeni (Hastalar, Randevular, Stok, Kasa, SGK, Servis vb.).
- `src/app/services/`: İş kurallarını yöneten Domain Servisleri (`StockDomainService`, `SGKDomainService`, `CashDomainService`, `EventBus`, `MemoryCache`, `AuditServiceEnriched`).
- `src/app/repositories/`: Tip güvenliğini sağlayan Jenerik Repository yapısı (`BaseRepository`, `PatientRepository`, `StockRepository`, `CashRepository`).
- `src/app/lib/mappers/`: Özyinelemeli döngüleri kaldıran doğrudan varlık dönüştürücüleri (`entityMappers.ts`).
- `src/app/lib/errors/`: Hata hiyerarşisi (`DatabaseError`, `ValidationError`, `PermissionError`).
- `src/app/components/`: Reusable UI bileşenleri (`ErrorBoundary`, `StatCard`, `Sidebar`, `Header`, `BottomNav`).

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
Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 🧪 Test ve Derleme Komutları

| Komut | Açıklama |
|:---|:---|
| `npm run test` | Vitest otomatik birim test suitini çalıştırır. |
| `npm run build` | Next.js üretken derleme kontrolünü sıfır hatayla gerçekleştirir. |
| `npm run lint` | ESLint statik kod analizini yürütür. |

---

## 🛡️ Güvenlik ve Multi-Tenant Mimarisi
- **JWT & Role Authentication:** Tüm sunucu isteklerinde JWT token doğrulaması yapılır.
- **Service Role Key Isolation:** Service Role Key asla tarayıcıya sızmaz; yalnızca korumalı API yollarında kullanılır.
- **Audit Trail & JSON Diffs:** Tüm kritik değişiklikler `AuditServiceEnriched` ile nesne öncesi/sonrası JSON farklarıyla loglanır.

---

## 📜 Lisans
Gizli ve Özel Mülk — Tüm Hakları Saklıdır.
