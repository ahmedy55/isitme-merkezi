BEGIN;
-- Org picker needs only directory fields before an org hint has been chosen.
CREATE OR REPLACE FUNCTION public.my_organizations()
RETURNS TABLE(organization_id uuid,roles text[],name text,slug text,logo_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT m.organization_id,m.roles,o.name,o.slug,o.logo_url FROM public.memberships m
 JOIN public.organizations o ON o.id=m.organization_id
 WHERE m.user_id=auth.uid() AND m.status='active' AND o.subscription_status='active'
$$;
REVOKE ALL ON FUNCTION public.my_organizations() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.my_organizations() TO authenticated;

CREATE OR REPLACE FUNCTION public.provision_member(p_actor uuid,p_org uuid,p_user uuid,p_branch uuid,p_roles text[],p_email text,p_first text,p_last text,p_phone text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE m public.memberships; BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Service role required'; END IF;
 -- Serialize against license and concurrent membership changes, then recheck authorization.
 PERFORM 1 FROM public.organizations WHERE id=p_org AND subscription_status='active'
 AND (plan_type<>'trial' OR trial_ends_at IS NULL OR trial_ends_at>now()) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Inactive organization'; END IF;
 PERFORM 1 FROM public.memberships WHERE user_id=p_actor AND organization_id=p_org
 AND status='active' AND 'Firma Yöneticisi'=ANY(roles) FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Manager permission required'; END IF;
 IF p_branch IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.branches WHERE id=p_branch AND organization_id=p_org AND status='active') THEN RAISE EXCEPTION 'Invalid branch'; END IF;
 INSERT INTO public.profiles(id,first_name,last_name,phone) VALUES(p_user,p_first,p_last,p_phone);
 INSERT INTO public.memberships(user_id,organization_id,branch_id,roles,email,first_name,last_name,phone,status)
 VALUES(p_user,p_org,p_branch,p_roles,p_email,p_first,p_last,p_phone,'active') RETURNING * INTO m;
 RETURN to_jsonb(m);
END $$;
REVOKE ALL ON FUNCTION public.provision_member(uuid,uuid,uuid,uuid,text[],text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_member(uuid,uuid,uuid,uuid,text[],text,text,text,text) TO service_role;
COMMIT;
