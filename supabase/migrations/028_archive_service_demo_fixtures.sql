-- Hide only the 15 synthetic records from ServicePage's original hard-coded fixture.
-- Keep ticket history archived and remove their demo-only ledger/movement effects.
BEGIN;

ALTER TABLE public.service_tickets
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

DROP POLICY IF EXISTS service_tickets_select ON public.service_tickets;
DROP POLICY IF EXISTS scope_read ON public.service_tickets;
CREATE POLICY scope_read ON public.service_tickets
  FOR SELECT TO authenticated
  USING (
    public.tenant_access(organization_id, branch_id,
      ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon'])
    AND deleted_at IS NULL
  );

CREATE TEMP TABLE service_demo_fixture_to_archive ON COMMIT DROP AS
WITH fixture(patient_name, device_name, device_serial, barcode, received_date, complaint) AS (
  VALUES
    ('Test Hasta Üç', 'Oticon More 1', '1234567890', 'OT-001', DATE '2026-09-29', 'Ses kesilmesi'),
    ('Ayşe Yılmaz', 'Phonak Audeo L', '9876543210', 'PH-002', DATE '2026-09-28', 'Cihaz açılmıyor'),
    ('Mehmet Kaya', 'Widex Moment', '4567891234', 'WD-003', DATE '2026-09-26', 'Ses cızırtısı'),
    ('Elif Demir', 'Signia Pure 312', '3216549870', 'SG-004', DATE '2026-09-24', 'Pil problemi'),
    ('Ahmet Yılmaz', 'Resound Nexia', '1597534862', 'RS-005', DATE '2026-09-22', 'Temizlik bakımı'),
    ('Zeynep Güneş', 'Starkey Evolv', '7539514563', 'ST-006', DATE '2026-09-20', 'Mikrofon sorunu'),
    ('Cem Doğan', 'Unitron Moxi', '9513571598', 'UN-007', DATE '2026-09-18', 'Parça değişimi'),
    ('Seda Yıldız', 'Bernafon Alpha', '6549873210', 'BE-008', DATE '2026-09-15', 'Su teması'),
    ('Fatma Kaya', 'Oticon Real 1', '8529637410', 'OT-009', DATE '2026-09-12', 'Hoparlör arızası'),
    ('Ali Öztürk', 'Phonak Lumity 90', '7418529630', 'PH-010', DATE '2026-09-10', 'Şarj olmuyor'),
    ('Burak Akın', 'Widex Magnify', '9638527410', 'WD-011', DATE '2026-09-08', 'Filtre tıkanıklığı'),
    ('Ece Çelik', 'Signia Styletto', '1472583690', 'SG-012', DATE '2026-09-06', 'Kalıp uyumsuzluğu'),
    ('Mustafa Arslan', 'Resound Key 4', '3692581470', 'RS-013', DATE '2026-09-04', 'Genel revizyon'),
    ('Selin Kurt', 'Oticon Zircon 2', '2581473690', 'OT-014', DATE '2026-09-02', 'Bluetooth kesintisi'),
    ('Hakan Yıldırım', 'Phonak Terra+', '7894561230', 'PH-015', DATE '2026-09-01', 'Ses distorsiyonu')
)
SELECT ticket.id, ticket.organization_id, ticket.branch_id
FROM public.service_tickets AS ticket
JOIN fixture AS f
  ON ticket.patient_name = f.patient_name
 AND ticket.device_name = f.device_name
 AND ticket.device_serial = f.device_serial
 AND ticket.barcode = f.barcode
 AND ticket.received_date = f.received_date
 AND ticket.complaint = f.complaint
WHERE ticket.deleted_at IS NULL;

UPDATE public.service_tickets AS ticket
SET deleted_at = now()
FROM service_demo_fixture_to_archive AS fixture
WHERE ticket.id = fixture.id
  AND ticket.organization_id = fixture.organization_id;

DELETE FROM public.cash_transactions AS transaction
USING service_demo_fixture_to_archive AS fixture
WHERE transaction.organization_id = fixture.organization_id
  AND transaction.branch_id = fixture.branch_id
  AND transaction.reference_entity = 'service'
  AND transaction.reference_id = fixture.id::text;

DELETE FROM public.stock_movements AS movement
USING service_demo_fixture_to_archive AS fixture
WHERE movement.organization_id = fixture.organization_id
  AND movement.branch_id = fixture.branch_id
  AND movement.reference_entity = 'service'
  AND movement.reference_id = fixture.id::text;

COMMIT;
