BEGIN;
-- Only new writes are synchronized: historical entries require reconciliation.
CREATE FUNCTION public.sync_expense_cash() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF TG_OP='INSERT' THEN
   INSERT INTO public.cash_transactions(organization_id,branch_id,cash_register_id,type,amount,category,reference_entity,reference_id,description,performed_by)
   VALUES(NEW.organization_id,NEW.branch_id,'kas-1','EXPENSE',NEW.amount,NEW.category,'expense',NEW.id::text,NEW.description,auth.uid());
 ELSE
   IF (NEW.amount,NEW.deleted_at,NEW.description,NEW.category) IS NOT DISTINCT FROM (OLD.amount,OLD.deleted_at,OLD.description,OLD.category) THEN RETURN NEW; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.cash_transactions WHERE organization_id=NEW.organization_id AND reference_entity='expense' AND reference_id=NEW.id::text) THEN
     RAISE EXCEPTION 'Legacy expense needs ledger reconciliation before editing';
   END IF;
   IF OLD.deleted_at IS NULL AND (NEW.deleted_at IS NOT NULL OR NEW.amount<>OLD.amount) THEN
     INSERT INTO public.cash_transactions(organization_id,branch_id,cash_register_id,type,amount,category,reference_entity,reference_id,description,performed_by)
     VALUES(NEW.organization_id,NEW.branch_id,'kas-1','INCOME',OLD.amount,OLD.category,'expense',NEW.id::text,'Gider düzeltmesi: '||OLD.description,auth.uid());
   END IF;
   IF NEW.deleted_at IS NULL AND (OLD.deleted_at IS NOT NULL OR NEW.amount<>OLD.amount) THEN
     INSERT INTO public.cash_transactions(organization_id,branch_id,cash_register_id,type,amount,category,reference_entity,reference_id,description,performed_by)
     VALUES(NEW.organization_id,NEW.branch_id,'kas-1','EXPENSE',NEW.amount,NEW.category,'expense',NEW.id::text,NEW.description,auth.uid());
   END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER expense_cash_sync AFTER INSERT OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.sync_expense_cash();
COMMIT;
