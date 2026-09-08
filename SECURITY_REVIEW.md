# İnceleme teslimi — üretime hazırlık

Bu kopya güvenlik düzeltmeleri içerir; canlı veritabanına uygulanmış değildir. Ayrıntılı Türkçe rapor, teslimin `INCELEME_RAPORU.md` dosyasındadır.

1. Node 22 ile `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build` çalıştırın.
2. `.env.example` dosyasını `.env.local` olarak kopyalayın; yalnızca kendi staging projenizin değerlerini girin. Service-role anahtarını NEXT_PUBLIC değişkenine koymayın.
3. Yeni veritabanında migration 001–010 sırasıyla uygulanır. 002'ye eklenen iki branch sütunu, orijinal 003'ün temiz kurulum hatasını düzeltir.
4. Mevcut veritabanında eski migration'ları tekrar çalıştırmayın. Önce `supabase/preflight.sql` ile şemayı karşılaştırın; uyumlu bir staging kopyasında 007–010'u sırayla değerlendirin. 007, katalogdaki bilinen tabloların politikalarını yeniler. Özelleştirilmiş canlı politikalar önce kaydedilmelidir.
5. Eski null şube kayıtları otomatik bir şubeye atanmaz. Doğru atama iş sahibi tarafından yapılmalıdır. `NOT VALID` kısıtlar yeni yazmalarda çalışır; eski ihlaller giderildikten sonra `validate-after-repair.sql` çıktısındaki doğrulamaları uygulayın.
6. `audit-tests` paketini `audipro` klasörüyle aynı düzeye çıkarın, o klasörde `npm ci` ve `npm test` çalıştırın. Test, PGlite PostgreSQL motorunda yapay iki firma oluşturur; canlı Supabase'e bağlanmaz.
7. Gerçek Supabase staging üzerinde PostgREST ilişkilerini, Auth cookie/JWT yenilemesini, eşzamanlı istekleri ve bütün rol ekranlarını ayrıca doğrulayın.

Firma yöneticisi kendi firmasını yönetir. Şube çalışanlarında boş şube erişim vermez. Üyelik ve lisans durumu veritabanından kontrol edilir; JWT alanları tek başına yetki kaynağı değildir. Eski `admin` ve `firma_yoneticisi` üyelik rolleri migration'da `Firma Yöneticisi` olarak normalleştirilir.

Yeni kullanıcı için en az 12 karakterlik ilk giriş şifresi ve çalışan rolleri için geçerli şube gerekir. Oluşturma akışı e-posta göndermez. Şifre güvenli kanaldan kullanıcıya verilmelidir. Var olan başka Auth hesabı e-posta ile sahiplenilmez.

Firma/üye provisioning SQL işlemleri atomiktir; Auth API ayrı sistemdir. Kesin SQL hatasında yeni Auth hesabı temizlenir. Ağ sonucu belirsizse hesap silinmez; üyelik/organizasyon kontrol edilerek mutabakat yapılmalıdır.

Kalan sınırlar: servis, demirbaş, aktivite, şube transferi ve SGK alacağı ekranlarının tüm eylemleri kalıcı backend'e bağlı değildir; banner ile işaretlenmiştir. SGK/ÜTS/e-fatura/WhatsApp gerçek sağlayıcı entegrasyonları uygulanmamıştır. `ENC:` TC saklama formatı XOR/Base64'tür, kriptografik şifreleme değildir. Bu format mevcut kayıtlarla uyum için korunmuştur. Ayrı sunucu anahtarı ve kontrollü veri dönüşümü gerekir.

Şube silmek yerine pasifleştirme tercih edilmelidir; tenant FK'leri kayıt bağlantılarını koparan silmeleri engeller. İncelenmiş bir şubeler arası transfer işlemi tamamlanana kadar operasyonel kaydın branch_id alanı değiştirilemez.
