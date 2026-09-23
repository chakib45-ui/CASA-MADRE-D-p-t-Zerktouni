import React, { useState } from 'react';
import { 
  Users, 
  X, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Mail, 
  Search,
  UserCheck,
  UserX,
  History,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  AlertCircle,
  Sparkles,
  Lock,
  Calendar,
  Check,
  Shield
} from 'lucide-react';
import { UserApprovalRequest, UserRole, AccessLogEntry } from '../types';
import { updateUserApproval, updateSecurityPin } from '../lib/firestoreSync';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: UserApprovalRequest[];
  adminEmail: string;
  onSuccessToast?: (msg: string) => void;
  accessLogs?: AccessLogEntry[];
  currentPin?: string;
  onUpdatePin?: (newPin: string) => Promise<boolean>;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  requests,
  adminEmail,
  onSuccessToast,
  accessLogs = [],
  currentPin = '0045',
  onUpdatePin,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'history' | 'security'>('users');
  
  // Users state
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  // History state
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'login' | 'approval_change' | 'pin'>('all');

  // Security & PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);

  if (!isOpen) return null;

  const handleStatusChange = async (targetUid: string, newStatus: UserRole, targetEmail: string) => {
    try {
      setProcessingUid(targetUid);
      await updateUserApproval(targetUid, newStatus, adminEmail, targetEmail);
      if (onSuccessToast) {
        onSuccessToast(
          newStatus === 'approved'
            ? `Accès validé pour ${targetEmail}`
            : `Accès révoqué pour ${targetEmail}`
        );
      }
    } catch (err) {
      console.error('Error updating user approval status:', err);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    const clean = newPin.trim();
    if (!clean || clean.length < 4 || clean.length > 8 || !/^\d+$/.test(clean)) {
      setPinError('Le code PIN doit comporter entre 4 et 8 chiffres numériques.');
      return;
    }

    if (clean !== confirmPin.trim()) {
      setPinError('Les deux codes PIN saisis ne correspondent pas.');
      return;
    }

    try {
      setIsSavingPin(true);
      if (onUpdatePin) {
        await onUpdatePin(clean);
      } else {
        await updateSecurityPin(clean, adminEmail);
      }
      setPinSuccess('Code PIN d’autorisation modifié avec succès !');
      setNewPin('');
      setConfirmPin('');
      if (onSuccessToast) {
        onSuccessToast('Nouveau code PIN d’autorisation enregistré');
      }
    } catch (err: any) {
      setPinError(err?.message || 'Erreur lors de la mise à jour du code PIN.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Filtered users
  const filteredRequests = requests.filter(req => {
    if (filter !== 'all' && req.status !== filter) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        (req.email || '').toLowerCase().includes(q) ||
        (req.displayName || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  // Filtered logs
  const filteredLogs = accessLogs.filter(log => {
    if (historyFilter === 'login' && log.action !== 'login' && log.action !== 'demo_access') return false;
    if (historyFilter === 'approval_change' && log.action !== 'approval_change') return false;
    if (historyFilter === 'pin' && log.action !== 'pin_unlock' && log.action !== 'pin_change') return false;

    if (historySearch.trim() !== '') {
      const q = historySearch.toLowerCase();
      return (
        (log.email || '').toLowerCase().includes(q) ||
        (log.displayName || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatLogDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-3xl bg-[#241c17] text-[#f7f5f0] border border-[#524133] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* En-tête modal */}
        <div className="px-6 py-4 border-b border-[#3d2f25] flex items-center justify-between bg-[#1f1713]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8c6239]/40 border border-[#a87f54] flex items-center justify-center text-[#ffdca8] shadow-inner">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#faf6f0]">
                Gestion des Utilisateurs & Sécurité
              </h2>
              <p className="text-[11px] text-[#c4b5a5]">
                Comptes autorisés, journal d'accès et code PIN d'autorisation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-md hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation des onglets */}
        <div className="flex border-b border-[#3d2f25] bg-[#1a1410] px-6 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#c4a482] text-[#f0dfcc]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Utilisateurs ({requests.length})</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-bold text-[10px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#c4a482] text-[#f0dfcc]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Historique d'accès ({accessLogs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 px-3 font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#c4a482] text-[#f0dfcc]'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Code PIN & Sécurité</span>
          </button>
        </div>

        {/* CONTENU ONGLET 1: UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filtres et recherche */}
            <div className="p-4 border-b border-[#382a20] bg-[#1d1612] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 bg-[#251d17] p-1 rounded-lg border border-[#44352a] text-xs">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    filter === 'all' ? 'bg-[#8c6239] text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Tous ({requests.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    filter === 'pending' ? 'bg-amber-600 text-white' : 'text-amber-300 hover:text-white'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>En attente ({pendingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('approved')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    filter === 'approved' ? 'bg-emerald-700 text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Approuvés
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('rejected')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    filter === 'rejected' ? 'bg-red-800 text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Refusés
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par email ou nom..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#251d17] text-[#f7f5f0] placeholder-stone-500 text-xs rounded-lg border border-[#44352a] focus:outline-none focus:border-[#8c6239]"
                />
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#2d221a]">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Users className="w-9 h-9 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Aucun utilisateur trouvé pour ce filtre.</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Les utilisateurs connectés avec Google ou email s'affichent automatiquement ici.
                  </p>
                </div>
              ) : (
                filteredRequests.map(req => {
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';
                  const isAdmin = req.status === 'admin' || req.email.toLowerCase() === adminEmail.toLowerCase();
                  const isSelf = req.email.toLowerCase() === adminEmail.toLowerCase();

                  return (
                    <div 
                      key={req.uid} 
                      className="pt-2.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#1d1612] hover:bg-[#261d17] border border-[#382b22] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {req.photoURL ? (
                          <img 
                            src={req.photoURL} 
                            alt="" 
                            className="w-10 h-10 rounded-full border border-[#5a4638] object-cover" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#352820] border border-[#5a4638] flex items-center justify-center font-bold text-xs text-[#d6c5b2]">
                            {req.displayName?.charAt(0) || req.email.charAt(0).toUpperCase()}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-[#faf6f0]">
                              {req.displayName || 'Utilisateur'}
                            </span>
                            {isAdmin && (
                              <span className="px-2 py-0.5 rounded bg-[#8c6239] text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                                👑 Administrateur
                              </span>
                            )}
                            {isPending && (
                              <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-600/60 text-[9px] font-mono font-bold text-amber-300">
                                ⏳ En Attente
                              </span>
                            )}
                            {isApproved && !isAdmin && (
                              <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-600/60 text-[9px] font-mono font-bold text-emerald-300">
                                ✓ Lecteur Approuvé
                              </span>
                            )}
                            {isRejected && (
                              <span className="px-2 py-0.5 rounded bg-red-900/60 border border-red-600/60 text-[9px] font-mono font-bold text-red-300">
                                ✕ Accès Refusé
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#b3a190]">
                            <Mail className="w-3 h-3 text-[#8c6239]" />
                            <span className="font-mono">{req.email}</span>
                            {req.requestedAt && (
                              <span className="text-[10px] text-stone-500">
                                • Inscrit le {new Date(req.requestedAt).toLocaleDateString()}
                              </span>
                            )}
                            {req.lastLoginAt && (
                              <span className="text-[10px] text-stone-500">
                                • Dernière connexion : {formatLogDate(req.lastLoginAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {!isSelf && !isAdmin && (
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={processingUid === req.uid}
                                onClick={() => handleStatusChange(req.uid, 'approved', req.email)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                title="Autoriser l'accès en lecture"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Valider (Lecture)</span>
                              </button>
                              <button
                                type="button"
                                disabled={processingUid === req.uid}
                                onClick={() => handleStatusChange(req.uid, 'rejected', req.email)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-900/70 hover:bg-red-800 text-red-200 font-semibold text-xs flex items-center gap-1 border border-red-700/60 transition-colors cursor-pointer disabled:opacity-50"
                                title="Refuser l'accès"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Refuser</span>
                              </button>
                            </>
                          )}

                          {isApproved && (
                            <button
                              type="button"
                              disabled={processingUid === req.uid}
                              onClick={() => handleStatusChange(req.uid, 'rejected', req.email)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#2e221a] hover:bg-red-950 text-stone-400 hover:text-red-300 font-medium text-[11px] border border-[#443327] transition-colors cursor-pointer disabled:opacity-50"
                              title="Révoquer l'accès"
                            >
                              Révoquer l'accès
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              disabled={processingUid === req.uid}
                              onClick={() => handleStatusChange(req.uid, 'approved', req.email)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Ré-approuver</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2: HISTORIQUE D'ACCÈS */}
        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filtres d'historique */}
            <div className="p-4 border-b border-[#382a20] bg-[#1d1612] flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="flex items-center gap-1.5 bg-[#251d17] p-1 rounded-lg border border-[#44352a] text-xs">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    historyFilter === 'all' ? 'bg-[#8c6239] text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Tous ({accessLogs.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('login')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    historyFilter === 'login' ? 'bg-blue-700 text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Connexions
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('approval_change')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    historyFilter === 'approval_change' ? 'bg-amber-600 text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Statuts
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('pin')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    historyFilter === 'pin' ? 'bg-emerald-700 text-white' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Code PIN
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Rechercher dans le journal..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#251d17] text-[#f7f5f0] placeholder-stone-500 text-xs rounded-lg border border-[#44352a] focus:outline-none focus:border-[#8c6239]"
                />
              </div>
            </div>

            {/* Liste de logs */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <History className="w-9 h-9 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">Aucun événement enregistré dans l'historique.</p>
                  <p className="text-[11px] text-stone-500 mt-1">
                    Les connexions et actions d'accès sont journalisées en continu.
                  </p>
                </div>
              ) : (
                filteredLogs.map(log => {
                  let icon = <LogIn className="w-4 h-4 text-blue-400" />;
                  let label = 'Connexion';
                  let bgBadge = 'bg-blue-950/60 border-blue-700/60 text-blue-300';

                  if (log.action === 'approval_change') {
                    icon = <UserCheck className="w-4 h-4 text-amber-400" />;
                    label = 'Changement de Statut';
                    bgBadge = 'bg-amber-950/60 border-amber-700/60 text-amber-300';
                  } else if (log.action === 'pin_unlock') {
                    icon = <KeyRound className="w-4 h-4 text-emerald-400" />;
                    label = 'Déverrouillage PIN';
                    bgBadge = 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300';
                  } else if (log.action === 'pin_change') {
                    icon = <ShieldCheck className="w-4 h-4 text-purple-400" />;
                    label = 'Code PIN Modifié';
                    bgBadge = 'bg-purple-950/60 border-purple-700/60 text-purple-300';
                  } else if (log.action === 'logout') {
                    icon = <LogOut className="w-4 h-4 text-stone-400" />;
                    label = 'Déconnexion';
                    bgBadge = 'bg-stone-800 border-stone-600 text-stone-300';
                  } else if (log.action === 'demo_access') {
                    icon = <Sparkles className="w-4 h-4 text-cyan-400" />;
                    label = 'Accès Démo';
                    bgBadge = 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300';
                  }

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#1d1612] border border-[#382b22] flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 p-1.5 rounded-lg bg-[#2b211a] border border-[#44352a]">
                          {icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${bgBadge}`}>
                              {label}
                            </span>
                            <span className="font-semibold text-[#faf6f0]">
                              {log.displayName || log.email}
                            </span>
                            <span className="text-stone-400 font-mono text-[11px]">
                              ({log.email})
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-[11px] text-[#c9b9a8] mt-1">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 text-stone-400 text-[10px] font-mono">
                        {formatLogDate(log.timestamp)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 3: SÉCURITÉ & CODE PIN */}
        {activeTab === 'security' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="p-4 rounded-xl bg-[#1d1612] border border-[#3f3024] space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#8c6239]/30 border border-[#a87f54] text-[#ffdca8] flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#faf6f0]">
                    Protection par Code d'Autorisation PIN
                  </h3>
                  <p className="text-xs text-[#b8a694] mt-0.5">
                    Le code PIN permet aux lecteurs approuvés de déverrouiller ponctuellement les droits d'édition, d'ajout ou de suppression d'articles du catalogue, tout en maintenant l'inventaire en sécurité.
                  </p>
                </div>
              </div>

              {/* Statut PIN Actuel (masqué avec bullets) */}
              <div className="mt-4 pt-3 border-t border-[#382a20] flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-stone-400">Code PIN actuel : </span>
                  <span className="font-mono font-bold text-sm text-[#faf6f0] tracking-widest ml-1">
                    {showCurrentPin ? currentPin : currentPin.replace(/./g, '•')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCurrentPin(!showCurrentPin)}
                  className="px-2.5 py-1 rounded bg-[#2b211a] hover:bg-[#3d2f25] text-stone-300 hover:text-white border border-[#4d3d32] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {showCurrentPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showCurrentPin ? 'Masquer' : 'Révéler'}</span>
                </button>
              </div>
            </div>

            {/* Formulaire de changement de PIN */}
            <div className="p-5 rounded-xl bg-[#1a1410] border border-[#3f3024]">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#d4af37] mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                <span>Modifier le Code PIN d'Autorisation</span>
              </h4>

              {pinError && (
                <div className="mb-4 p-2.5 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveNewPin} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Nouveau code PIN (4 à 8 chiffres)
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3 py-2 bg-[#251d17] text-[#faf6f0] tracking-widest font-mono text-base font-bold rounded-lg border border-[#4d3d32] focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Confirmer le nouveau code PIN
                    </label>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={8}
                      value={confirmPin}
                      onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full px-3 py-2 bg-[#251d17] text-[#faf6f0] tracking-widest font-mono text-base font-bold rounded-lg border border-[#4d3d32] focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingPin || !newPin || !confirmPin}
                    className="px-4 py-2 bg-[#8c6239] hover:bg-[#734f2d] text-white font-semibold text-xs rounded-lg border border-[#aa7a4a] transition-all cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSavingPin ? 'Enregistrement...' : 'Enregistrer le nouveau code PIN'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pied de page modal */}
        <div className="px-6 py-3 border-t border-[#3d2f25] bg-[#1f1713] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Les utilisateurs approuvés accèdent en lecture seule. Les modifications nécessitent le code PIN secret d'autorisation.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#3a2e25] hover:bg-[#4d3d32] text-white font-medium rounded-md border border-[#524133] transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
