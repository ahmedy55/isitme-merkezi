-- READ-ONLY. Run on staging/live separately; export results without patient data.
SELECT version();
SELECT tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename,policyname;
SELECT p.oid::regprocedure AS function,p.prosecdef,p.proconfig,p.proacl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY 1;
SELECT table_name,column_name,data_type,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position;
SELECT roles,count(*) FROM public.memberships GROUP BY roles;
SELECT count(*) AS active_employee_without_branch FROM public.memberships WHERE status='active' AND branch_id IS NULL AND NOT roles && ARRAY['Firma Yöneticisi','admin','firma_yoneticisi'];
SELECT count(*) AS membership_wrong_branch_tenant FROM public.memberships m JOIN public.branches b ON b.id=m.branch_id WHERE m.organization_id<>b.organization_id;
SELECT c.conrelid::regclass AS table_name,c.conname,c.convalidated,pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace WHERE n.nspname='public' ORDER BY 1,2;
-- On databases that already have patients/sales.branch_id:
-- SELECT count(*) FROM patients WHERE branch_id IS NULL;
-- SELECT count(*) FROM sales WHERE branch_id IS NULL;
