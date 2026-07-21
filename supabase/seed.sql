-- =========================================================================
-- AudiPro SaaS — Supabase Seed Data (seed.sql)
-- =========================================================================

-- 1. Create default organization
INSERT INTO organizations (id, name, slug, plan_type, subscription_status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Kadıköy İşitme Merkezi', 'kadikoy-isitme', 'pro', 'active')
ON CONFLICT (id) DO NOTHING;

-- 2. Create default branches
INSERT INTO branches (id, organization_id, name, address, phone, status)
VALUES ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Merkez 1 - Kadıköy', 'Caferağa Mah. Moda Cad. No:42, Kadıköy', '0216 555 00 00', 'active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO branches (id, organization_id, name, address, phone, status)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Merkez 2 - Beşiktaş', 'Sinanpaşa Mah. Çelebioğlu Sok. No:15, Beşiktaş', '0212 222 11 11', 'active')
ON CONFLICT (id) DO NOTHING;

-- 3. Create default platform admin (Ahmet Yılmaz)
-- Note: Replace this user_id with your real auth.users id
-- INSERT INTO platform_admins (user_id) VALUES ('YOUR_AUTH_USER_ID') ON CONFLICT DO NOTHING;

-- 4. Create patients
INSERT INTO patients (
  id, organization_id, tc, first_name, last_name, phone, email, birth_date, gender, address,
  hearing_loss, hearing_loss_side, current_device, device_date, sgk_status, sgk_renewal_date,
  notes, last_visit, battery_size, daily_usage_hours, last_battery_purchase, battery_pack_count,
  source, sales_stage, doctor_name, prescription_status, emergency_contact_name, emergency_contact_phone,
  emergency_contact_relation, next_action, prescription_no, report_no, sgk_insurance_status, patient_status,
  audiogram_left, audiogram_right, past_audiogram_left, past_audiogram_right, consent_given, consent_date
) VALUES (
  '33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', '12345678901', 'Ayşe', 'Yılmaz', '0532 111 2233', 'ayse.yilmaz@email.com', 
  '1958-03-15', 'Kadın', 'Kadıköy, İstanbul', 'Orta', 'Her İki Kulak', 
  'Phonak Audéo P90', '2021-06-20', 
  'Yenileme Hakkı Var', '2026-06-20', 
  'Yenileme hakkı yaklaşıyor, bilgilendirme yapılmalı.', '2026-05-15', '312',
  12, '2026-07-01', 2,
  'Tavsiye', 'Teklif Verildi', 'Dr. Serkan Koç',
  'Reçete Yazıldı', 'Ahmet Yılmaz', '0532 222 3344',
  'Oğlu', 'SGK yenileme evrakları Medula üzerinden kontrol edilecek.', 'REC-2026-9938', 'RAP-2026-1122', 'Emekli', 'Müşteri',
  '{20,25,35,45,55,60,65,70}', '{15,20,30,40,50,55,60,65}', '{15,20,25,35,45,50,55,60}', '{10,15,20,30,40,45,50,55}', true, NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '10.02.2019', 'İlk hasta kaydı oluşturuldu.', 'Patients');
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '20.06.2021', 'Phonak Audéo P90 cihaz satışı yapıldı.', 'Cash');
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '15.05.2026', 'Yıllık cihaz kontrol randevusu tamamlandı.', 'Check');
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '01.07.2026', '2 paket 312 numara pil sipariş edildi.', 'Plus');
INSERT INTO patients (
  id, organization_id, tc, first_name, last_name, phone, email, birth_date, gender, address,
  hearing_loss, hearing_loss_side, current_device, device_date, sgk_status, sgk_renewal_date,
  notes, last_visit, battery_size, daily_usage_hours, last_battery_purchase, battery_pack_count,
  source, sales_stage, doctor_name, prescription_status, emergency_contact_name, emergency_contact_phone,
  emergency_contact_relation, next_action, prescription_no, report_no, sgk_insurance_status, patient_status,
  audiogram_left, audiogram_right, past_audiogram_left, past_audiogram_right, consent_given, consent_date
) VALUES (
  '33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', '98765432109', 'Mehmet', 'Kaya', '0544 222 3344', 'mehmet.kaya@email.com', 
  '1972-09-22', 'Erkek', 'Beşiktaş, İstanbul', 'İleri', 'Sol', 
  'Oticon More 1', '2023-01-10', 
  'Aktif', '2028-01-10', 
  'Sol kulak ameliyat geçmişi mevcut.', '2026-06-28', '13',
  10, '2026-05-10', 1,
  'Doktor', 'Satış Yapıldı', 'Prof. Dr. Levent Acar',
  'SGK Onaylı', 'Merve Kaya', '0544 333 4455',
  'Eşi', '6 ay sonra rutin kontrol araması yapılacak.', 'REC-2026-5544', 'RAP-2026-8877', 'Çalışan (sigortalı)', 'Deneme Yapıldı',
  '{30,40,55,65,75,80,85,90}', '{10,15,15,20,25,25,30,35}', '{25,30,45,55,65,70,75,80}', '{10,10,15,15,20,20,25,30}', true, NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '05.11.2022', 'İlk muayene kaydı yapıldı.', 'Patients');
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '10.01.2023', 'Oticon More 1 cihaz satışı ve ÜTS bildirimi tamamlandı.', 'Check');
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '28.06.2026', 'Sol cihaz hoparlör değişimi için teknik servise alındı.', 'Warning');
INSERT INTO patients (
  id, organization_id, tc, first_name, last_name, phone, email, birth_date, gender, address,
  hearing_loss, hearing_loss_side, current_device, device_date, sgk_status, sgk_renewal_date,
  notes, last_visit, battery_size, daily_usage_hours, last_battery_purchase, battery_pack_count,
  source, sales_stage, doctor_name, prescription_status, emergency_contact_name, emergency_contact_phone,
  emergency_contact_relation, next_action, prescription_no, report_no, sgk_insurance_status, patient_status,
  audiogram_left, audiogram_right, past_audiogram_left, past_audiogram_right, consent_given, consent_date
) VALUES (
  '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', '45678901234', 'Hanım', 'Saraç', '0555 333 4455', 'hanim.sarac@email.com', 
  '1965-12-01', 'Kadın', 'Üsküdar, İstanbul', 'Hafif', 'Sağ', 
  NULL, NULL, 
  'Aktif', NULL, 
  'İlk kez başvurdu, cihaz denemesi planlanacak.', '2026-07-01', NULL,
  NULL, NULL, NULL,
  'Sosyal Medya', 'İlk Görüşme', 'Uzm. Dr. Aylin Kaya',
  'Yok', 'Can Saraç', '0555 444 5566',
  'Kardeşi', 'Cihaz denemesi için randevu verilecek.', '', '', 'Belirtilmemiş', 'Potansiyel',
  '{10,10,15,15,20,20,25,25}', '{15,20,25,30,35,40,45,45}', NULL, NULL, true, NOW()
) ON CONFLICT (id) DO NOTHING;
INSERT INTO patient_timeline (organization_id, patient_id, date, action, icon)
VALUES ('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '01.07.2026', 'Hasta kliniğe ilk kez gelerek işitme testi yaptırdı.', 'Patients');

-- 5. Create appointments
INSERT INTO appointments (id, organization_id, patient_id, branch_id, date, time, type, audiologist, status, notes)
VALUES ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222221', '2026-07-10', '10:00', 'SGK Yenileme', 'Dr. Elif Arslan', 'Bekliyor', 'Medula sorgusu ve cihaz denemesi yapılacak.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO appointments (id, organization_id, patient_id, branch_id, date, time, type, audiologist, status, notes)
VALUES ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222222', '2026-07-10', '11:30', 'Kontrol', 'Dr. Can Yılmaz', 'Hatırlatıldı', 'Teknik servisten çıkan cihaz teslim edilecek.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO appointments (id, organization_id, patient_id, branch_id, date, time, type, audiologist, status, notes)
VALUES ('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221', '2026-07-10', '14:00', 'Cihaz Denemesi', 'Dr. Elif Arslan', 'Bekliyor', 'Hafif işitme kaybına uygun RIC kasa tipi denenecek.')
ON CONFLICT (id) DO NOTHING;

-- 6. Create stock items
INSERT INTO stock_items (
  id, organization_id, branch_id, name, category, brand, model, serial_no, quantity,
  critical_level, price, sgk_price, warranty_expiry, location, status, uts_status,
  assigned_patient_id, uts_kurum_no, gln, mersis_no
) VALUES (
  '55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Phonak Audéo P90', 'Cihaz', 'Phonak', 'Audéo P90-R', 
  'PH-2024-00142', 1, 0, 48000, 6200, 
  '2028-07-10', 'A-Rafı, Kutu 4', 'Stokta', 'Bekliyor', 
  NULL, '', '', ''
) ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_items (
  id, organization_id, branch_id, name, category, brand, model, serial_no, quantity,
  critical_level, price, sgk_price, warranty_expiry, location, status, uts_status,
  assigned_patient_id, uts_kurum_no, gln, mersis_no
) VALUES (
  '55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Oticon More 1', 'Cihaz', 'Oticon', 'More 1 miniRITE', 
  'OT-2024-00089', 1, 0, 52000, 6200, 
  '2028-05-15', 'B-Rafı, Kutu 2', 'Hastaya Ayrıldı', 'Bekliyor', 
  '33333333-3333-3333-3333-333333333331', '', '', ''
) ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_items (
  id, organization_id, branch_id, name, category, brand, model, serial_no, quantity,
  critical_level, price, sgk_price, warranty_expiry, location, status, uts_status,
  assigned_patient_id, uts_kurum_no, gln, mersis_no
) VALUES (
  '55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Phonak Naída P70', 'Cihaz', 'Phonak', 'Naída P70-UP', 
  'PH-2024-00215', 1, 0, 36000, 6200, 
  '2027-11-20', 'A-Rafı, Kutu 9', 'Stokta', 'Bekliyor', 
  NULL, '', '', ''
) ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_items (
  id, organization_id, branch_id, name, category, brand, model, serial_no, quantity,
  critical_level, price, sgk_price, warranty_expiry, location, status, uts_status,
  assigned_patient_id, uts_kurum_no, gln, mersis_no
) VALUES (
  '55555555-5555-5555-5555-555555555554', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Rayovac 312 Numara Pil', 'Pil', 'Rayovac', 'Active Core 312', 
  'RY-312-BATCH12', 120, 50, 150, 0, 
  '2029-12-31', 'Pil Kutusu A', 'Stokta', 'Gerekli Değil', 
  NULL, '', '', ''
) ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_items (
  id, organization_id, branch_id, name, category, brand, model, serial_no, quantity,
  critical_level, price, sgk_price, warranty_expiry, location, status, uts_status,
  assigned_patient_id, uts_kurum_no, gln, mersis_no
) VALUES (
  '55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Rayovac 13 Numara Pil', 'Pil', 'Rayovac', 'Active Core 13', 
  'RY-13-BATCH08', 15, 40, 150, 0, 
  '2029-10-30', 'Pil Kutusu B', 'Stokta', 'Gerekli Değil', 
  NULL, '', '', ''
) ON CONFLICT (id) DO NOTHING;
INSERT INTO stock_items (
  id, organization_id, branch_id, name, category, brand, model, serial_no, quantity,
  critical_level, price, sgk_price, warranty_expiry, location, status, uts_status,
  assigned_patient_id, uts_kurum_no, gln, mersis_no
) VALUES (
  '55555555-5555-5555-5555-555555555556', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Rayovac 13 Numara Pil (Beşiktaş)', 'Pil', 'Rayovac', 'Active Core 13', 
  'RY-13-BATCH09', 80, 10, 150, 0, 
  '2029-10-30', 'Pil Kutusu B', 'Stokta', 'Gerekli Değil', 
  NULL, '', '', ''
) ON CONFLICT (id) DO NOTHING;

-- 7. Create sales
INSERT INTO sales (id, organization_id, patient_id, date, total, sgk_amount, patient_amount, payment_method, status, audiologist)
VALUES ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '2026-07-01', 1500, 0, 1500, 'Kredi Kartı', 'Tahsil Edildi', 'Dr. Elif Arslan')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sale_items (sale_id, organization_id, name, quantity, price, type)
VALUES ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', 'Rayovac 312 Numara Pil (60 adet)', 10, 150, 'Pil');
INSERT INTO sales (id, organization_id, patient_id, date, total, sgk_amount, patient_amount, payment_method, status, audiologist)
VALUES ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '2023-01-10', 52000, 6200, 45800, 'Taksit', 'Taksitli', 'Dr. Can Yılmaz')
ON CONFLICT (id) DO NOTHING;
INSERT INTO sale_items (sale_id, organization_id, name, quantity, price, type)
VALUES ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', 'Oticon More 1 miniRITE', 1, 52000, 'Cihaz');
INSERT INTO sale_installments (sale_id, organization_id, amount, due_date, paid)
VALUES ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', 15266, '2026-06-10', true);
INSERT INTO sale_installments (sale_id, organization_id, amount, due_date, paid)
VALUES ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', 15267, '2026-07-10', false);
INSERT INTO sale_installments (sale_id, organization_id, amount, due_date, paid)
VALUES ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', 15267, '2026-08-10', false);

-- 8. Create recall items
INSERT INTO recall_items (id, organization_id, patient_id, reason, due_date, status, last_contact, estimated_revenue, probability)
VALUES ('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', 'SGK Yenileme', '2026-06-20', 'Bekliyor', NULL, 75000, 'Yüksek Olasılık')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recall_items (id, organization_id, patient_id, reason, due_date, status, last_contact, estimated_revenue, probability)
VALUES ('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', 'Pil Siparişi', '2026-07-21', 'Bekliyor', NULL, 1200, 'Yüksek Olasılık')
ON CONFLICT (id) DO NOTHING;
INSERT INTO recall_items (id, organization_id, patient_id, reason, due_date, status, last_contact, estimated_revenue, probability)
VALUES ('77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Cihaz Denedi Almadı', '2026-07-05', 'Bekliyor', NULL, 85000, 'Orta Olasılık')
ON CONFLICT (id) DO NOTHING;

-- 9. Create suppliers
INSERT INTO suppliers (id, organization_id, company_name, contact_person, phone, email, address, tax_no, category, status, balance, notes)
VALUES ('88888888-8888-8888-8888-888888888881', '11111111-1111-1111-1111-111111111111', 'Phonak Türkiye A.Ş.', 'Caner Yıldız', '0212 555 01 01', 'caner@phonak.com.tr', 'Maslak, Sarıyer, İstanbul', '1234567890', 'İşitme Cihazı', 'Aktif', -45000, 'Ana cihaz tedarikçisi. Aylık sipariş sözleşmesi mevcut.')
ON CONFLICT (id) DO NOTHING;
INSERT INTO supplier_purchases (id, supplier_id, organization_id, date, invoice_no, total, payment_status, payment_method)
VALUES ('88888888-8888-8888-9999-888888888880', '88888888-8888-8888-8888-888888888881', '11111111-1111-1111-1111-111111111111', '2026-06-20', 'PH-2026-0412', 148000, 'Kısmi Ödendi', 'Havale')
ON CONFLICT (id) DO NOTHING;
INSERT INTO supplier_purchase_items (purchase_id, organization_id, name, quantity, unit_price)
VALUES ('88888888-8888-8888-9999-888888888880', '11111111-1111-1111-1111-111111111111', 'Phonak Audéo L90-R', 3, 28000);
INSERT INTO supplier_purchase_items (purchase_id, organization_id, name, quantity, unit_price)
VALUES ('88888888-8888-8888-9999-888888888880', '11111111-1111-1111-1111-111111111111', 'Phonak Slim L90', 2, 32000);
INSERT INTO suppliers (id, organization_id, company_name, contact_person, phone, email, address, tax_no, category, status, balance, notes)
VALUES ('88888888-8888-8888-8888-888888888882', '11111111-1111-1111-1111-111111111111', 'Rayovac Pil Dağıtım', 'Sevgi Demir', '0216 444 22 33', 'sevgi@rayovac.com.tr', 'Ataşehir, İstanbul', '9876543210', 'Pil & Aksesuar', 'Aktif', 0, '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO supplier_purchases (id, supplier_id, organization_id, date, invoice_no, total, payment_status, payment_method)
VALUES ('88888888-8888-8888-9999-888888888810', '88888888-8888-8888-8888-888888888882', '11111111-1111-1111-1111-111111111111', '2026-07-05', 'RV-2026-0088', 5500, 'Ödendi', 'Nakit')
ON CONFLICT (id) DO NOTHING;
INSERT INTO supplier_purchase_items (purchase_id, organization_id, name, quantity, unit_price)
VALUES ('88888888-8888-8888-9999-888888888810', '11111111-1111-1111-1111-111111111111', 'Rayovac 312 (60lı Paket)', 20, 180);
INSERT INTO supplier_purchase_items (purchase_id, organization_id, name, quantity, unit_price)
VALUES ('88888888-8888-8888-9999-888888888810', '11111111-1111-1111-1111-111111111111', 'Rayovac 13 (60lı Paket)', 10, 190);
INSERT INTO suppliers (id, organization_id, company_name, contact_person, phone, email, address, tax_no, category, status, balance, notes)
VALUES ('88888888-8888-8888-8888-888888888883', '11111111-1111-1111-1111-111111111111', 'Widex İşitme Sistemleri', 'Berk Aydın', '0212 333 44 55', 'berk@widex.com.tr', 'Levent, Beşiktaş, İstanbul', '5678901234', 'İşitme Cihazı', 'Aktif', -12000, '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO suppliers (id, organization_id, company_name, contact_person, phone, email, address, tax_no, category, status, balance, notes)
VALUES ('88888888-8888-8888-8888-888888888884', '11111111-1111-1111-1111-111111111111', 'Kalıp Malzeme San. Tic.', 'Melek Koç', '0312 111 22 33', 'melek@kalipmalzeme.com', 'Yenimahalle, Ankara', '3456789012', 'Kalıp Malzemesi', 'Pasif', 0, 'Sözleşme yenilenmedi — alternatif tedarikçi aranıyor.')
ON CONFLICT (id) DO NOTHING;

-- 10. Create expenses
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999991', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-01', 'Kira', 'Kadıköy Şubesi Temmuz ayı kira ödemesi', 42000, 'Havale', 'Dr. Elif Arslan', 'KR-2026-07', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999992', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2026-07-01', 'Kira', 'Beşiktaş Şubesi Temmuz ayı kira ödemesi', 38000, 'Havale', 'Dr. Elif Arslan', 'KR-2026-07B', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999993', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-03', 'Fatura', 'Kadıköy şube elektrik faturası (Haziran dönemi)', 4200, 'Otomatik Ödeme', 'Dr. Elif Arslan', '', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999994', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-05', 'Maaş', 'Ody. Hasan Kaya — Temmuz maaşı', 52000, 'Havale', 'Dr. Elif Arslan', '', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999995', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-05', 'Maaş', 'Sek. Zeynep Acar — Temmuz maaşı', 32000, 'Havale', 'Dr. Elif Arslan', '', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999996', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-10', 'Reklam & Pazarlama', 'Google Ads Temmuz kampanya ödemesi', 8500, 'Kredi Kartı', 'Dr. Elif Arslan', '', 'İşitme testi kampanyası — hedef: Kadıköy çevresi')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999997', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-12', 'Bakım & Onarım', 'Odyometre cihazı yıllık kalibrasyon ücreti', 3200, 'Nakit', 'Ody. Hasan Kaya', '', '')
ON CONFLICT (id) DO NOTHING;
INSERT INTO expenses (id, organization_id, branch_id, date, category, description, amount, payment_method, created_by, receipt_no, notes)
VALUES ('99999999-9999-9999-9999-999999999998', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', '2026-07-15', 'Malzeme', 'Ofis kırtasiye ve yazıcı toneri', 1400, 'Nakit', 'Sek. Zeynep Acar', '', '')
ON CONFLICT (id) DO NOTHING;
