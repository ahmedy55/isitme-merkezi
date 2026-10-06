-- Fix sale_items serial_no and barcode nullability constraint for non-serialized items.
ALTER TABLE public.sale_items ALTER COLUMN serial_no DROP NOT NULL;
ALTER TABLE public.sale_items ALTER COLUMN serial_no SET DEFAULT '';
ALTER TABLE public.sale_items ALTER COLUMN barcode DROP NOT NULL;
ALTER TABLE public.sale_items ALTER COLUMN barcode SET DEFAULT '';

CREATE OR REPLACE FUNCTION public.snapshot_sale_device() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
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
   NEW.stock_item_id:=device.id;
   NEW.barcode:=coalesce(device.barcode, '');
   NEW.serial_no:=coalesce(device.serial_no, '');
 ELSIF NEW.type='Cihaz' THEN RAISE EXCEPTION 'Select a specific stock device';
 END IF;
 RETURN NEW;
END $$;
