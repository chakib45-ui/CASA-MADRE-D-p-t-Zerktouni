import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Layers,
  Zap,
  ZapOff
} from 'lucide-react';
import { ArticleItem } from '../types';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFolder: string;
  onAddArticle: (article: ArticleItem) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  activeFolder,
  onAddArticle,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [articleName, setArticleName] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const targetFolder = activeFolder === 'all' ? 'Antiquités' : activeFolder;

  // Initialize camera when opened
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setError(null);
      return;
    }

    startCamera(facingMode);

    // Check available video devices
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => setHasMultipleCameras(false));
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
      setIsTorchOn(false);
      setHasTorch(false);
    }
  };

  const startCamera = async (mode: 'environment' | 'user') => {
    stopCamera();
    setError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("L'accès à la caméra n'est pas pris en charge par ce navigateur.");
      return;
    }

    try {
      // First try with requested facingMode and high definition
      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback to basic video constraint
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      setStream(mediaStream);

      // Check for torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities: any = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        }
      }
    } catch (err: any) {
      console.error('Erreur accès caméra:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Accès caméra refusé. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("Aucune caméra détectée sur cet appareil.");
      } else {
        setError("Impossible d'activer la caméra : " + (err.message || 'Erreur inconnue'));
      }
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }],
      });
      setIsTorchOn(nextState);
    } catch (e) {
      console.warn('Torch non supportée:', e);
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsCapturing(false);
      return;
    }

    // High quality draw
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setArticleName(`Article ${targetFolder} #${Math.floor(100 + Math.random() * 900)}`);
    setIsCapturing(false);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  const handleSaveAndAdd = (keepScanning: boolean) => {
    if (!capturedImage) return;

    const newArticle: ArticleItem = {
      id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ref: '',
      name: articleName.trim() || `Article ${targetFolder}`,
      imageUrl: capturedImage,
      imageFit: 'contain',
      folder: targetFolder,
      category: 'Mobilier & Décoration',
      material: '',
      periodOrStyle: '',
      condition: 'Bon état de conservation',
      quantity: quantity || '1',
      dimensions: '',
      notes: 'Ajouté par capture caméra directe',
    };

    onAddArticle(newArticle);

    if (keepScanning) {
      setCapturedImage(null);
      setArticleName('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm no-print">
      <div 
        className="bg-[#1f1915] text-[#f7f5f0] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh] border border-[#52443a]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#3d332c] flex justify-between items-center bg-[#2a221d]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#8c6239] text-[#f7f5f0] flex items-center justify-center shadow-inner">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-cinzel text-sm sm:text-base font-bold text-[#faf6f0]">
                Scanner & Capture Directe
              </h2>
              <p className="text-[11px] text-[#c4b5a5] flex items-center gap-1.5">
                <span>Dossier actif :</span>
                <span className="font-semibold text-[#e89a43] px-1.5 py-0.2 bg-[#8c6239]/20 rounded border border-[#8c6239]/40">
                  {targetFolder}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Fermer le scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col items-center">
          {error ? (
            <div className="w-full py-8 px-4 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-red-900/40 border border-red-700/60 flex items-center justify-center text-red-300">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="font-semibold text-stone-200 text-sm mb-1">Accès à la caméra impossible</h3>
                <p className="text-xs text-stone-400 leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 text-xs font-semibold bg-[#8c6239] hover:bg-[#a67443] text-white rounded-lg transition-colors flex items-center gap-2 shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réessayer</span>
              </button>
            </div>
          ) : capturedImage ? (
            /* Review & Add Form */
            <div className="w-full flex flex-col items-center space-y-4">
              <div className="relative w-full aspect-[4/3] max-h-72 bg-black rounded-lg overflow-hidden border border-[#52443a] shadow-inner flex items-center justify-center">
                <img 
                  src={capturedImage} 
                  alt="Aperçu de la capture" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-2 right-2 bg-emerald-700/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                  <Check className="w-3 h-3" />
                  <span>Photo capturée</span>
                </div>
              </div>

              {/* Quick Article Info Form */}
              <div className="w-full space-y-3 bg-[#2a221d] p-3.5 rounded-lg border border-[#3d332c]">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Nom / Désignation de l'article :
                  </label>
                  <input
                    type="text"
                    value={articleName}
                    onChange={e => setArticleName(e.target.value)}
                    placeholder="Ex: Paire de fauteuils, Lampe en bronze..."
                    className="w-full px-3 py-1.5 bg-[#1a1411] border border-[#52443a] rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#8c6239]"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Quantité :
                    </label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      placeholder="1"
                      className="w-full px-3 py-1.5 bg-[#1a1411] border border-[#52443a] rounded text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#8c6239]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                      Dossier de destination :
                    </label>
                    <div className="px-3 py-1.5 bg-[#1a1411]/60 border border-[#42372f] rounded text-xs text-[#e89a43] truncate font-medium">
                      {targetFolder}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-stone-300 bg-[#352c25] hover:bg-[#43382f] rounded-lg border border-[#52443a] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reprendre</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAndAdd(true)}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-[#f5ebd9] bg-[#5c4430] hover:bg-[#6e523a] rounded-lg border border-[#8c6239] flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-[#e89a43]" />
                  <span>Ajouter & Continuer</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAndAdd(false)}
                  className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-[#8c6239] hover:bg-[#a67443] rounded-lg border border-[#c4a482] flex items-center justify-center gap-1.5 transition-colors shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Ajouter & Fermer</span>
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera View */
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border border-[#52443a] shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Viewfinder overlay */}
                <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-md">
                  {/* Corner marks */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#e89a43]" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-[#e89a43]" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-[#e89a43]" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#e89a43]" />
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#e89a43]/70" />
                    </div>
                  </div>
                </div>

                {/* Top Controls Overlay */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-2">
                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                        isTorchOn 
                          ? 'bg-amber-500 text-black' 
                          : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title={isTorchOn ? 'Éteindre la torche' : 'Allumer la torche'}
                    >
                      {isTorchOn ? <Zap className="w-4 h-4" /> : <ZapOff className="w-4 h-4" />}
                    </button>
                  )}
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md transition-colors"
                      title="Changer de caméra (avant / arrière)"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-stone-300">
                  Cadrez l'objet d'antiquité
                </div>
              </div>

              {/* Shutter Button */}
              <div className="pt-2 flex flex-col items-center">
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={isCapturing || !stream}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#8c6239] to-[#c4a482] p-1 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-50"
                  title="Capturer la photo de l'article"
                >
                  <div className="w-full h-full rounded-full border-2 border-white/80 bg-white/20 flex items-center justify-center">
                    <div className="w-11 h-11 rounded-full bg-white shadow" />
                  </div>
                </button>
                <span className="text-[11px] text-stone-400 mt-2">
                  Appuyez pour photographier et ajouter à « {targetFolder} »
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
