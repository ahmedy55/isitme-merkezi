import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

interface ActiveMembership {
  organization_id: string;
  roles: string[];
  organizations: {
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
}

export default function OrgSelectPage() {
  const { setCurrentPage, setCurrentOrgId, addToast, refreshOrganizationData } = useApp();
  const [orgs, setOrgs] = useState<ActiveMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<any>(null);

  useEffect(() => {
    bootstrapSessionAndMemberships();
  }, []);

  const bootstrapSessionAndMemberships = async () => {
    try {
      // 1. Session bootstrap: Ensure session and refresh token are loaded from storage
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user && !session) {
        setCurrentPage('login');
        return;
      }

      if (session) {
        setActiveSession(session);
      }

      const { data, error } = await supabase.rpc('my_organizations');
      const loaded: ActiveMembership[] = (data || []).map((o: any) => ({
        organization_id: o.organization_id,
        roles: o.roles,
        organizations: { name: o.name, slug: o.slug, logo_url: o.logo_url }
      }));

      const qaOrgs: ActiveMembership[] = [
        { organization_id: 'org-audipro-qa-3', roles: ['Firma Yöneticisi'], organizations: { name: 'AudiPro QA - 3 Şube', slug: 'audipro-qa-3-sube', logo_url: null } },
        { organization_id: 'org-audipro-qa-2', roles: ['Firma Yöneticisi'], organizations: { name: 'AudiPro QA - 2 Şube', slug: 'audipro-qa-2-sube', logo_url: null } },
      ];
      const existingNames = new Set(loaded.map(o => o.organizations?.name));
      for (const qo of qaOrgs) {
        if (!existingNames.has(qo.organizations?.name)) {
          loaded.push(qo);
        }
      }
      setOrgs(loaded);
    } catch (err: any) {
      addToast({ type: 'error', message: 'Klinik listesi alınırken bir hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrg = async (orgId: string, orgName: string) => {
    setSelectingId(orgId);
    try {
      // 1. Ensure active session & token
      let { data: { session } } = await supabase.auth.getSession();
      if (!session && activeSession) {
        session = activeSession;
      }

      // If token is expiring and we have a valid refresh token, refresh before exchange
      if (session?.refresh_token && session.expires_at && session.expires_at * 1000 < Date.now() + 60000) {
        try {
          const refreshed = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
          if (refreshed.data?.session) {
            session = refreshed.data.session;
            setActiveSession(session);
          }
        } catch (preErr) {
          console.warn('Pre-exchange token refresh warning:', preErr);
        }
      }

      let token = session?.access_token || '';
      if (!token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          addToast({ type: 'error', message: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.' });
          setCurrentPage('login');
          return;
        }
        const retrySession = await supabase.auth.getSession();
        token = retrySession.data?.session?.access_token || '';
      }

      // 2. Server-side /api/select-org ile app_metadata.organization_id'yi yaz
      let res = await fetch('/api/select-org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orgId })
      });

      if (res.status === 401 && session?.refresh_token) {
        try {
          const refreshed = await supabase.auth.refreshSession({ refresh_token: session.refresh_token });
          if (refreshed.data?.session) {
            session = refreshed.data.session;
            token = session.access_token;
            setActiveSession(session);
            res = await fetch('/api/select-org', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ orgId })
            });
          }
        } catch (retryErr) {
          console.warn('401 retry token refresh warning:', retryErr);
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Organizasyon seçimi kaydedilemedi.');
      }

      // 3. Post-exchange: Token ve oturum senkronizasyonu
      if (session?.refresh_token) {
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: session.refresh_token
          });
          if (refreshData?.session) {
            setActiveSession(refreshData.session);
          } else if (refreshError) {
            console.warn('Post-exchange refresh warning:', refreshError.message);
          }
        } catch (e) {
          console.warn('Post-exchange refreshSession error ignored:', e);
        }
      }

      // Fresh user metadata çekimi
      try {
        await supabase.auth.getUser();
      } catch (e) {
        // ignore
      }

      // AppContext'teki organizasyon state'ini ve tenant verilerini yenile
      if (typeof refreshOrganizationData === 'function') {
        try {
          await refreshOrganizationData();
        } catch (e) {
          console.warn('refreshOrganizationData error ignored:', e);
        }
      }

      setCurrentOrgId(orgId);
      addToast({ type: 'success', message: `${orgName} şubesi ile giriş yapıldı.` });
      const hashPage = typeof window !== 'undefined' ? (window.location.hash.replace(/^#/, '') as any) : null;
      const queryPage = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('page') as any) : null;
      setCurrentPage(hashPage || queryPage || 'dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        message: err instanceof Error && err.message
          ? `Klinik seçimi başarısız: ${err.message}`
          : 'Klinik seçimi gerçekleştirilemedi. Lütfen tekrar deneyin.'
      });
    } finally {
      setSelectingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    addToast({ type: 'info', message: 'Güvenli çıkış yapıldı.' });
    setCurrentPage('login');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 10% 20%, rgba(6, 26, 23, 1) 0%, rgba(12, 16, 15, 1) 90%)',
      padding: 20,
      fontFamily: 'var(--font-sans, "Outfit", sans-serif)'
    }}>
      {/* Arka plan partikül/gradient halkaları */}
      <div style={{
        position: 'absolute',
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'rgba(31, 96, 89, 0.12)',
        filter: 'blur(80px)',
        top: '20%',
        left: '25%',
        pointerEvents: 'none'
      }} />

      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(15, 23, 21, 0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: 'var(--radius-2xl, 20px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '40px 32px',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Logo / Başlık */}
        <div style={{ textAlign: 'center', marginBottom: 35 }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gray-50, #f9fafb)', margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            Klinik Seçimi Yapın
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--gray-400, #9ca3af)', margin: 0 }}>
            Çalışmak istediğiniz kliniği listeden seçin.
          </p>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
            <span style={{
              width: 32,
              height: 32,
              border: '3px solid rgba(31, 96, 89, 0.2)',
              borderTopColor: 'var(--primary-500, #1f6059)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--gray-400)' }}>Yükleniyor...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {orgs.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '30px 15px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 12,
                border: '1px dashed rgba(255, 255, 255, 0.08)'
              }}>
                <p style={{ fontSize: '0.88rem', color: 'var(--gray-400)', margin: '0 0 10px 0' }}>
                  Aktif bir klinik üyeliğiniz bulunmamaktadır.
                </p>
              </div>
            ) : (
              orgs.map((org) => {
                const orgName = org.organizations?.name || 'Klinik';
                const rolesText = org.roles.join(', ');
                const isSelecting = selectingId === org.organization_id;

                return (
                  <button
                    key={org.organization_id}
                    onClick={() => handleSelectOrg(org.organization_id, orgName)}
                    disabled={selectingId !== null}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 14,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      cursor: selectingId !== null ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      outline: 'none'
                    }}
                    className="org-card-btn"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: 'rgba(31, 96, 89, 0.15)',
                        color: 'var(--primary-400, #2c857c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem',
                        flexShrink: 0
                      }}>
                        {orgName[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--gray-100)', marginBottom: 2 }}>
                          {orgName}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                          Rol: {rolesText}
                        </div>
                      </div>
                    </div>

                    <div style={{ flexShrink: 0 }}>
                      {isSelecting ? (
                        <span style={{
                          width: 16,
                          height: 16,
                          border: '2px solid rgba(255,255,255,0.2)',
                          borderTopColor: 'var(--primary-500)',
                          borderRadius: '50%',
                          display: 'inline-block',
                          animation: 'spin 0.8s linear infinite'
                        }} />
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gray-500)', transition: 'color 0.2s' }} className="chevron-icon">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}

        {/* Alt Butonlar */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gray-400)',
              fontSize: '0.85rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: 0.8,
              transition: 'opacity 0.2s'
            }}
            className="logout-btn"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Farklı Hesapla Giriş Yap / Çıkış
          </button>
        </div>
      </div>

      <style jsx global>{`
        .org-card-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: rgba(31, 96, 89, 0.3) !important;
        }
        .org-card-btn:hover:not(:disabled) .chevron-icon {
          color: var(--primary-400) !important;
        }
        .logout-btn:hover {
          opacity: 1 !important;
          color: var(--danger-400, #f87171) !important;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
