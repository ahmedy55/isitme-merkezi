BEGIN;
ALTER TABLE public.sales ADD COLUMN request_payload jsonb;
-- Invoker security preserves all tenant/branch/role policies inside the transaction.
CREATE OR REPLACE FUNCTION public.complete_sale(p_sale jsonb,p_key uuid,p_stock uuid DEFAULT NULL,p_register text DEFAULT 'kas-1')
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
DECLARE org uuid:=public.get_user_org_id(); pat public.patients; st public.stock_items;
 s public.sales; item jsonb; inst jsonb; total_amount numeric:=0; qty int; stock_qty int:=0;
 request jsonb:=jsonb_build_object('sale',p_sale,'stock',p_stock,'register',p_register);
BEGIN
 IF org IS NULL OR NOT public.has_any_role(ARRAY['Şube Yöneticisi','Muhasebe']) THEN RAISE EXCEPTION 'Finance permission required'; END IF;
 IF p_key IS NULL THEN RAISE EXCEPTION 'Idempotency key required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(org::text||p_key::text,0));
 SELECT * INTO s FROM public.sales WHERE organization_id=org AND idempotency_key=p_key;
 IF FOUND THEN
   IF s.request_payload IS DISTINCT FROM request THEN RAISE EXCEPTION 'Idempotency payload mismatch'; END IF;
   RETURN to_jsonb(s);
 END IF;
 SELECT * INTO pat FROM public.patients WHERE id=(p_sale->>'patient_id')::uuid AND organization_id=org FOR SHARE;
 IF NOT FOUND OR pat.branch_id IS NULL THEN RAISE EXCEPTION 'Accessible patient and branch required'; END IF;
 IF jsonb_typeof(p_sale->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(p_sale->'items')=0 THEN RAISE EXCEPTION 'Sale items required'; END IF;
 IF p_stock IS NOT NULL THEN
   SELECT * INTO st FROM public.stock_items WHERE id=p_stock AND organization_id=org AND branch_id=pat.branch_id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Accessible stock required'; END IF;
 END IF;
 FOR item IN SELECT * FROM jsonb_array_elements(p_sale->'items') LOOP
   qty=(item->>'quantity')::int;
   IF qty IS NULL OR qty<=0 OR (item->>'price')::numeric IS NULL OR (item->>'price')::numeric<0 THEN RAISE EXCEPTION 'Invalid item'; END IF;
   total_amount=total_amount+qty*(item->>'price')::numeric;
   IF p_stock IS NOT NULL AND item->>'name'=st.name THEN stock_qty=stock_qty+qty; END IF;
 END LOOP;
 IF total_amount IS DISTINCT FROM (p_sale->>'total')::numeric OR
 coalesce((p_sale->>'sgk_amount')::numeric,0)+coalesce((p_sale->>'patient_amount')::numeric,total_amount)<>total_amount THEN RAISE EXCEPTION 'Invalid sale totals'; END IF;
 IF p_stock IS NOT NULL AND (stock_qty<=0 OR st.quantity<stock_qty) THEN RAISE EXCEPTION 'Insufficient/mismatched stock'; END IF;
 INSERT INTO public.sales(organization_id,branch_id,patient_id,date,total,sgk_amount,patient_amount,payment_method,status,audiologist,idempotency_key,request_payload)
 VALUES(org,pat.branch_id,pat.id,(p_sale->>'date')::date,total_amount,coalesce((p_sale->>'sgk_amount')::numeric,0),coalesce((p_sale->>'patient_amount')::numeric,total_amount),p_sale->>'payment_method',p_sale->>'status',p_sale->>'audiologist',p_key,request) RETURNING * INTO s;
 FOR item IN SELECT * FROM jsonb_array_elements(p_sale->'items') LOOP
   INSERT INTO public.sale_items(sale_id,organization_id,name,quantity,price,type) VALUES(s.id,org,item->>'name',(item->>'quantity')::int,(item->>'price')::numeric,item->>'type');
 END LOOP;
 FOR inst IN SELECT * FROM jsonb_array_elements(coalesce(p_sale->'installments','[]'::jsonb)) LOOP
   IF (inst->>'amount')::numeric<=0 THEN RAISE EXCEPTION 'Invalid installment'; END IF;
   INSERT INTO public.sale_installments(sale_id,organization_id,amount,due_date,paid) VALUES(s.id,org,(inst->>'amount')::numeric,(inst->>'due_date')::date,coalesce((inst->>'paid')::boolean,false));
 END LOOP;
 IF p_stock IS NOT NULL THEN
   UPDATE public.stock_items SET quantity=quantity-stock_qty,status=CASE WHEN quantity-stock_qty=0 THEN 'Satıldı' ELSE status END WHERE id=p_stock;
   INSERT INTO public.stock_movements(organization_id,branch_id,stock_item_id,stock_item_name,type,quantity_change,unit_price,reference_entity,reference_id,performed_by)
   VALUES(org,pat.branch_id,p_stock,st.name,'SALE',-stock_qty,total_amount,'sale',s.id::text,auth.uid());
 END IF;
 -- An unpaid receivable is not cash. SGK receivables are not patient cash either.
 IF s.status='Tahsil Edildi' AND s.patient_amount>0 THEN
   INSERT INTO public.cash_transactions(organization_id,branch_id,cash_register_id,type,amount,category,reference_entity,reference_id,performed_by,idempotency_key)
   VALUES(org,pat.branch_id,p_register,'INCOME',s.patient_amount,'Cihaz Satışı','sale',s.id::text,auth.uid(),p_key);
 END IF;
 INSERT INTO public.audit_log(organization_id,user_id,action,module,description) VALUES(org,auth.uid(),'Satış Ekleme','Kasa','Satış: '||s.id::text);
 RETURN to_jsonb(s);
END $$;
REVOKE ALL ON FUNCTION public.complete_sale(jsonb,uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_sale(jsonb,uuid,uuid,text) TO authenticated;
COMMIT;
