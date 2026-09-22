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
  AlertCircle
} from 'lucide-react';
import { UserApprovalRequest, UserRole } from '../types';
import { updateUserApproval } from '../lib/firestoreSync';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: UserApprovalRequest[];
  adminEmail: string;
  onSuccessToast?: (msg: string) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  requests,
  adminEmail,
  onSuccessToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStatusChange = async (targetUid: string, newStatus: UserRole, targetEmail: string) => {
    try {
      setProcessingUid(targetUid);
      await updateUserApproval(targetUid, newStatus, adminEmail);
      if (onSuccessToast) {
        onSuccessToast(
          newStatus === 'approved'
            ? `Accès validé pour ${targetEmail}`
            : `Accès refusé pour ${targetEmail}`
        );
      }
    } catch (err) {
      console.error('Error updating user approval status:', err);
    } finally {
      setProcessingUid(null);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div 
        className="w-full max-w-2xl bg-[#241c17] text-[#f7f5f0] border border-[#524133] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* En-tête modal */}
        <div className="px-6 py-4 border-b border-[#3d2f25] flex items-center justify-between bg-[#1f1713]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#8c6239]/40 border border-[#a87f54] flex items-center justify-center text-[#ffdca8]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel text-base sm:text-lg font-bold text-[#faf6f0]">
                Gestion des Utilisateurs & Accès
              </h2>
              <p className="text-[11px] text-[#c4b5a5]">
                Validez ou refusez les demandes d'accès des utilisateurs Google
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

        {/* Filtres et recherche */}
        <div className="p-4 border-b border-[#382a20] bg-[#1a1410] flex flex-col sm:flex-row gap-3 items-center justify-between">
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
              placeholder="Rechercher un email..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#251d17] text-[#f7f5f0] placeholder-stone-500 text-xs rounded-lg border border-[#44352a] focus:outline-none focus:border-[#8c6239]"
            />
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#2d221a]">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Aucun utilisateur trouvé pour ce filtre.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isPending = req.status === 'pending';
              const isApproved = req.status === 'approved';
              const isRejected = req.status === 'rejected';
              const isAdmin = req.status === 'admin';
              const isSelf = req.email.toLowerCase() === adminEmail.toLowerCase();

              return (
                <div 
                  key={req.uid} 
                  className="pt-2.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#1d1612] hover:bg-[#261d17] border border-[#382b22] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {req.photoURL ? (
                      <img 
                        src={req.photoURL} 
                        alt="" 
                        className="w-9 h-9 rounded-full border border-[#5a4638] object-cover" 
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#352820] border border-[#5a4638] flex items-center justify-center font-bold text-xs text-[#d6c5b2]">
                        {req.displayName?.charAt(0) || req.email.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#faf6f0]">
                          {req.displayName || 'Utilisateur Google'}
                        </span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.5 rounded bg-[#8c6239] text-[9px] font-mono font-bold text-white uppercase">
                            Admin Principal
                          </span>
                        )}
                        {isPending && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-900/60 border border-amber-600/60 text-[9px] font-mono font-bold text-amber-300">
                            En Attente
                          </span>
                        )}
                        {isApproved && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-900/60 border border-emerald-600/60 text-[9px] font-mono font-bold text-emerald-300">
                            Lecteur Approuvé
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-1.5 py-0.5 rounded bg-red-900/60 border border-red-600/60 text-[9px] font-mono font-bold text-red-300">
                            Refusé
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#b3a190]">
                        <Mail className="w-3 h-3 text-[#8c6239]" />
                        <span className="font-mono">{req.email}</span>
                        {req.requestedAt && (
                          <span className="text-[10px] text-stone-500">
                            • {new Date(req.requestedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions de validation / refus */}
                  {!isSelf && !isAdmin && (
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={processingUid === req.uid}
                            onClick={() => handleStatusChange(req.uid, 'approved', req.email)}
                            className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                            title="Autoriser cet utilisateur en mode lecture seule"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Valider (Lecture)</span>
                          </button>
                          <button
                            type="button"
                            disabled={processingUid === req.uid}
                            onClick={() => handleStatusChange(req.uid, 'rejected', req.email)}
                            className="px-2.5 py-1 rounded bg-red-900/70 hover:bg-red-800 text-red-200 font-semibold text-xs flex items-center gap-1 border border-red-700/60 transition-colors cursor-pointer disabled:opacity-50"
                            title="Refuser l'accès à cet utilisateur"
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
                          className="px-2 py-1 rounded bg-[#2e221a] hover:bg-red-950 text-stone-400 hover:text-red-300 font-medium text-[11px] border border-[#443327] transition-colors cursor-pointer disabled:opacity-50"
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
                          className="px-2.5 py-1 rounded bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <UserCheck className="w-3 h-3" />
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

        {/* Pied de page modal */}
        <div className="px-6 py-3 border-t border-[#3d2f25] bg-[#1f1713] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#c4a482]" />
            <span>Les utilisateurs approuvés accèdent en lecture seule. Les modifications nécessitent le code PIN (0045).</span>
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
