'use client';

import { useApp } from '../context/AppContext';
import { getDisplayName, getUserRole } from '../lib/userHelpers';

export default function ProfilePage() {
  const { currentUser, currentOrg, branchesList, usersList, logout, loggingOut } = useApp();
  const branchId = currentUser?.membership?.branch_id;
  const branch = branchesList.find(item => item.id === branchId);
  const roles: string[] = currentUser?.membership?.roles || [];

  return <div className="page">
    <div className="page-header">
      <div className="page-header-left"><h2>Profilim</h2><p>Hesap ve erişim bilgilerinizi görüntüleyin.</p></div>
    </div>
    <section className="card profile-card" aria-label="Hesap bilgileri">
      <div className="profile-card-avatar" aria-hidden="true">{getDisplayName(currentUser, usersList).split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</div>
      <dl className="profile-details">
        <div><dt>Ad Soyad</dt><dd>{getDisplayName(currentUser, usersList)}</dd></div>
        <div><dt>E-posta</dt><dd>{currentUser?.email || 'Belirtilmemiş'}</dd></div>
        <div><dt>Firma</dt><dd>{currentOrg?.name || currentUser?.app_metadata?.organization_name || 'Firma bilgisi yükleniyor'}</dd></div>
        <div><dt>Rol</dt><dd>{getUserRole(currentUser, usersList)}</dd></div>
        <div><dt>Erişilebilir şube</dt><dd>{branch?.name || (roles.includes('Firma Yöneticisi') ? `${branchesList.filter(item => item.status === 'Aktif').length} aktif şube` : 'Atanmamış')}</dd></div>
      </dl>
      <button type="button" className="btn btn-secondary" disabled={loggingOut} onClick={() => void logout()}>{loggingOut ? 'Çıkış yapılıyor…' : 'Güvenli çıkış yap'}</button>
    </section>
  </div>;
}
