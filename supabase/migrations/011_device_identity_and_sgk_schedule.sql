-- Requires migrations 001–010. No automatic reinterpretation of legacy GLN values.
BEGIN;
ALTER TABLE public.stock_items ADD COLUMN barcode text NOT NULL DEFAULT '';
CREATE INDEX stock_barcode_lookup ON public.stock_items(organization_id,barcode);
CREATE INDEX stock_serial_lookup ON public.stock_items(organization_id,serial_no);
ALTER TABLE public.sale_items ADD COLUMN stock_item_id uuid;
ALTER TABLE public.sale_items ADD COLUMN barcode text NOT NULL DEFAULT '';
ALTER TABLE public.sale_items ADD COLUMN serial_no text NOT NULL DEFAULT '';
ALTER TABLE public.sale_items ADD CONSTRAINT sale_device_tenant_fk FOREIGN KEY(organization_id,stock_item_id) REFERENCES public.stock_items(organization_id,id);
ALTER TABLE public.service_tickets ADD COLUMN barcode text NOT NULL DEFAULT '';
ALTER TABLE public.service_tickets ADD COLUMN stock_item_id uuid;
ALTER TABLE public.service_tickets ADD COLUMN details jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.service_tickets ADD CONSTRAINT service_device_tenant_fk FOREIGN KEY(organization_id,stock_item_id) REFERENCES public.stock_items(organization_id,id);

CREATE TABLE public.sgk_period_invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organization_id uuid NOT NULL REFERENCES public.organizations(id),
 branch_id uuid NOT NULL,
 invoice_month date NOT NULL CHECK (extract(day FROM invoice_month)=1),
 expected_month date GENERATED ALWAYS AS ((invoice_month + interval '2 months')::date) STORED,
 invoice_no text NOT NULL CHECK(length(btrim(invoice_no)) BETWEEN 1 AND 100),
 amount numeric(14,2) NOT NULL CHECK(amount>0),
 notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,invoice_no),
 FOREIGN KEY(organization_id,branch_id) REFERENCES public.branches(organization_id,id)
);
ALTER TABLE public.sgk_period_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_read ON public.sgk_period_invoices FOR SELECT TO authenticated USING(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY invoice_insert ON public.sgk_period_invoices FOR INSERT TO authenticated WITH CHECK(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE POLICY invoice_update ON public.sgk_period_invoices FOR UPDATE TO authenticated USING(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe'])) WITH CHECK(public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Muhasebe']));
CREATE TRIGGER tenant_identity_guard BEFORE UPDATE ON public.sgk_period_invoices FOR EACH ROW EXECUTE FUNCTION public.guard_tenant_identity();
CREATE TRIGGER record_branch_guard BEFORE INSERT OR UPDATE ON public.sgk_period_invoices FOR EACH ROW EXECUTE FUNCTION public.guard_record_branch();
GRANT SELECT,INSERT,UPDATE ON public.sgk_period_invoices TO authenticated;

-- Snapshot identity from the locked stock row, never from client-entered sale text.
CREATE FUNCTION public.snapshot_sale_device() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE sale public.sales; device public.stock_items; device_id uuid;
BEGIN
 SELECT * INTO STRICT sale FROM public.sales WHERE id=NEW.sale_id;
 device_id:=nullif(sale.request_payload->>'stock','')::uuid;
 IF device_id IS NOT NULL THEN
   SELECT * INTO STRICT device FROM public.stock_items WHERE id=device_id AND organization_id=NEW.organization_id FOR UPDATE;
   IF NEW.name<>device.name THEN RAISE EXCEPTION 'Every line must reference the selected device'; END IF;
   IF device.category='Cihaz' AND (NEW.quantity<>1 OR coalesce(nullif(btrim(device.serial_no),''),'—') IN ('—','SN-UNKNOWN') OR btrim(device.barcode)='') THEN
     RAISE EXCEPTION 'Device sale requires one device, barcode and serial number';
   END IF;
   NEW.stock_item_id:=device.id; NEW.barcode:=device.barcode; NEW.serial_no:=device.serial_no;
 ELSIF NEW.type='Cihaz' THEN RAISE EXCEPTION 'Select a specific stock device';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER sale_device_snapshot BEFORE INSERT ON public.sale_items FOR EACH ROW EXECUTE FUNCTION public.snapshot_sale_device();

CREATE FUNCTION public.guard_device_identity() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 NEW.barcode:=btrim(NEW.barcode); NEW.serial_no:=btrim(NEW.serial_no);
 IF NEW.category='Cihaz' AND NEW.serial_no NOT IN ('','—','SN-UNKNOWN') THEN
   PERFORM pg_advisory_xact_lock(hashtextextended(NEW.organization_id::text||NEW.serial_no,0));
   IF NEW.quantity>1 THEN RAISE EXCEPTION 'A serialized device is a single unit'; END IF;
   IF EXISTS(SELECT 1 FROM public.stock_items s WHERE s.organization_id=NEW.organization_id AND s.id<>NEW.id AND s.serial_no=NEW.serial_no AND s.deleted_at IS NULL) THEN
     RAISE EXCEPTION 'Serial number already exists';
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER device_identity_guard BEFORE INSERT OR UPDATE OF serial_no,barcode,quantity ON public.stock_items FOR EACH ROW EXECUTE FUNCTION public.guard_device_identity();
COMMIT;
