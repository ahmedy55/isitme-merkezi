# Güvenlik ve üretime hazırlık notları

Bu belge depo kodunu ve migration dosyalarını özetler; canlı Supabase/Vercel ayarlarının veya migration geçmişinin doğrulandığı anlamına gelmez. Canlıya geçişten önce staging ortamında API, RLS, rol, eşzamanlı işlem ve uçtan uca testler ayrıca yapılmalıdır.

## Mevcut uygulama sınırları

- Uygulama Next.js/React istemci arayüzü, ortak React context'leri, Supabase veri yardımcıları/repository'leri ve SQL migration/RPC katmanlarından oluşur. Veri erişimi her yerde repository katmanından geçmez.
- `supabase/migrations/001–019` içinde tenant/şube RLS politikaları ve satış (`complete_sale`), stok düzeltme (`adjust_stock_item`) ve hasta şubesi transferi (`transfer_patient_branch`) gibi atomik işlemler tanımlıdır. Migration dosyalarının depoda bulunması bunların canlı projede uygulandığını kanıtlamaz.
- `014_server_side_patient_tc_encryption.sql`, Supabase Vault'ta tutulan anahtarla `pgcrypto` üzerinden AES-256 PGP şifreleme ve yetkili `decrypt_patient_tcs` RPC'si kurar. Önceki XOR/Base64 açıklamaları güncel migration'ı yansıtmıyordu. Canlı ortamda anahtarın, uzantıların ve migration'ın durumunu doğrulayın.
- Servis kayıtları `ServiceTicketRepository`, demirbaş/aktivite/şube transferi `OperationsRepository` ve SGK dönem faturaları ilgili Supabase tablo/RPC akışlarını kullanır. Yine de tüm eylemlerin ve rollerin canlı ortamda çalıştığı buradan doğrulanamaz.
- Destek talepleri şu anda yalnızca sayfa belleğinde tutulur; sunucuya gönderilmez.
- Medula, ÜTS, e-fatura ve WhatsApp için gerçek dış servis bağlantısı uygulanmış değildir. Entegrasyon testleri artık başarı simüle etmez; işlemler açıkça gönderilmedi/bağlı değil olarak sonuçlanır. Ayarlar ekranı gizli parola ve API anahtarlarını yeni kayıt olarak kaydetmez; yalnızca gizli olmayan bazı tercihler saklanabilir. Eski sürümlerde saklanmış olabilecek `medula_password` veya `whatsapp_api_key` değerleri mevcut veritabanında kalmış olabilir; canlı projede envanter çıkarıp anahtarları döndürmeden/temizlemeden önce yedek ve veri sahibi onayı alın.
- Tedarikçi alış faturası canlı firma için atomik backend işlemi olmadan kaydedilmez.

## Canlıya geçiş öncesi zorunlu kontroller

1. Staging kopyasında `supabase/preflight.sql` çalıştırın; migration geçmişini ve şema farklarını incelemeden eski migration'ları canlı veritabanında yeniden çalıştırmayın.
2. Firma A/B oturumlarıyla tüm tenant tablolarında doğrudan API/RLS IDOR testleri yapın. Her rol için sayfa, RPC, dışa aktarma ve yazma yetkisini doğrulayın.
3. İki eşzamanlı oturumla son stok adedinin satışı, idempotency anahtarı ve kısmi hata/yeniden deneme senaryolarını deneyin.
4. Hasta TC çözme RPC'sini, şube sınırlarını, audit kayıtlarını ve Supabase Vault anahtar erişimini staging'de sınayın.
5. Medula/ÜTS/e-fatura/mesajlaşma kullanılacaksa gerçek sağlayıcı, secret yönetimi, timeout, tekrar deneme ve idempotency sözleşmeleri tamamlanmadan bu entegrasyonları canlı işlem olarak sunmayın.
6. Test süiti, typecheck, lint ve production build'i CI'da çalıştırın; sonrasında gerçek Supabase staging ve tarayıcı E2E testlerini tamamlayın.

## Yerel kontroller

`npm test`, `npm run typecheck`, `npm run lint` ve `npm run build` komutları kullanılabilir. Birim testlerin geçmesi canlı Supabase politikalarını, üretim verisini veya dış servisleri doğrulamaz.
