BEGIN;

-- The application exposes stock and accessory management to accounting staff.
-- Keep database RLS and the atomic stock-adjustment RPC aligned with that UI.
DROP POLICY IF EXISTS scope_read ON public.stock_items;
DROP POLICY IF EXISTS scope_insert ON public.stock_items;
DROP POLICY IF EXISTS scope_update ON public.stock_items;
DROP POLICY IF EXISTS scope_delete ON public.stock_items;

CREATE POLICY scope_read ON public.stock_items FOR SELECT TO authenticated
  USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe']) AND deleted_at IS NULL);
CREATE POLICY scope_insert ON public.stock_items FOR INSERT TO authenticated
  WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe']));
CREATE POLICY scope_update ON public.stock_items FOR UPDATE TO authenticated
  USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe']))
  WITH CHECK (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe']));
CREATE POLICY scope_delete ON public.stock_items FOR DELETE TO authenticated
  USING (public.tenant_access(organization_id,branch_id,ARRAY['Şube Yöneticisi','Odyolog','Odyometrist','Sekreter','Resepsiyon','Muhasebe']));

CREATE OR REPLACE FUNCTION public.adjust_stock_item(
  p_item uuid,
  p_delta integer,
  p_reason text,
  p_notes text DEFAULT '',
  p_is_loss boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE
  org uuid := public.get_user_org_id();
  item public.stock_items;
BEGIN
  IF org IS NULL OR NOT public.has_any_role(ARRAY['Firma Yöneticisi','Şube Yöneticisi','Odyolog','Odyometrist','Muhasebe']) THEN
    RAISE EXCEPTION 'Inventory permission required';
  END IF;
  IF p_delta IS NULL OR p_delta=0 OR length(btrim(coalesce(p_reason,'')))=0 OR length(p_reason)>120 THEN
    RAISE EXCEPTION 'A non-zero quantity and reason are required';
  END IF;
  IF p_is_loss AND p_delta>=0 THEN RAISE EXCEPTION 'A loss must reduce stock'; END IF;
  IF length(coalesce(p_notes,''))>1000 THEN RAISE EXCEPTION 'Notes are too long'; END IF;

  SELECT * INTO item FROM public.stock_items
    WHERE id=p_item AND organization_id=org AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND OR NOT public.tenant_access(item.organization_id,item.branch_id,ARRAY['Firma Yöneticisi','Şube Yöneticisi','Odyolog','Odyometrist','Muhasebe']) THEN
    RAISE EXCEPTION 'Stock item is unavailable in this branch';
  END IF;
  IF item.quantity+p_delta<0 THEN RAISE EXCEPTION 'Insufficient stock'; END IF;

  UPDATE public.stock_items SET quantity=quantity+p_delta
    WHERE id=item.id RETURNING * INTO item;
  INSERT INTO public.stock_movements(organization_id,branch_id,stock_item_id,stock_item_name,type,quantity_change,unit_price,reference_entity,reference_id,performed_by,notes)
  VALUES(org,item.branch_id,item.id,item.name,CASE WHEN p_is_loss THEN 'LOSS' ELSE 'ADJUSTMENT' END,p_delta,item.price,'adjustment',item.id::text,auth.uid(),left(p_reason||CASE WHEN btrim(coalesce(p_notes,''))<>'' THEN ': '||btrim(p_notes) ELSE '' END,1000));
  INSERT INTO public.audit_log(organization_id,user_id,action,module,description)
  VALUES(org,auth.uid(),CASE WHEN p_is_loss THEN 'Stok Zayiatı' ELSE 'Stok Düzeltme' END,'Stok',item.name||': '||p_delta::text||' ('||p_reason||')');
  RETURN to_jsonb(item);
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_stock_item(uuid,integer,text,text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.adjust_stock_item(uuid,integer,text,text,boolean) TO authenticated;

COMMIT;
