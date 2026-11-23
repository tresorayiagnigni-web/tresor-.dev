'use client';

import { useEffect, useRef, useState } from 'react';
import { uploadAvatarAction } from '@/lib/actions/userActions';

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface AvatarUploaderProps {
  initialAvatarUrl?: string | null;
  userName?: string | null;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

// Toujours retourner une URL complète
function getFullAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function AvatarUploader({
  initialAvatarUrl,
  userName,
  onAvatarUpdated,
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(
    getFullAvatarUrl(initialAvatarUrl),
  );
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronise quand on revient sur la page
  useEffect(() => {
    setCurrentAvatar(getFullAvatarUrl(initialAvatarUrl));
  }, [initialAvatarUrl]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (f.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Le fichier dépasse 2 Mo.' });
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
      setMessage({
        type: 'error',
        text: 'Format non supporté. Formats acceptés : jpg, png, webp.',
      });
      return;
    }

    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(f));
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadAvatarAction(formData);

      if (!result.success || !result.data) {
        throw new Error(result.message || 'Erreur upload');
      }

      const raw = result.data as any;

      // Extraction robuste de l'URL
      const newAvatarPath =
        raw?.avatarUrl ||
        raw?.avatar ||
        raw?.photo ||
        raw?.data?.avatarUrl ||
        raw?.data?.avatar ||
        raw?.user?.avatarUrl ||
        raw?.user?.avatar ||
        raw?.data?.user?.avatarUrl ||
        null;

      if (!newAvatarPath) {
        console.error('Structure reçue du backend :', raw);
        throw new Error("Impossible de trouver l'URL de l'avatar dans la réponse");
      }

      const newUrl = getFullAvatarUrl(newAvatarPath)!;

      setCurrentAvatar(newUrl);
      setFile(null);
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
      setMessage({ type: 'success', text: 'Photo mise à jour !' });
      onAvatarUpdated?.(newUrl);
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Erreur réseau' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    setMessage(null);
  };

  const initials = userName?.charAt(0).toUpperCase() ?? '?';

  const avatarSrc =
    preview ||
    (currentAvatar
      ? `${currentAvatar}${currentAvatar.includes('?') ? '&' : '?'}t=${Date.now()}`
      : null);

  return (
    <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6 p-6 bg-gray-50 rounded-xl border border-gray-200 mb-6">
      <div
        className="relative group cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="h-24 w-24 rounded-full overflow-hidden bg-[#263A81] border-4 border-white shadow-lg flex items-center justify-center">
          {avatarSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarSrc}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-white">{initials}</span>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-7 w-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.06 4h3.88a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
      </div>

      <div className="flex-1 text-center sm:text-left">
        <h3 className="text-lg font-semibold text-gray-900">Photo de profil</h3>
        <p className="text-sm text-gray-500 mb-3">
          JPG, PNG ou WebP. 2 Mo max. Clique sur la photo pour changer.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex gap-2 justify-center sm:justify-start">
          {file && (
            <>
              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-[#263A81] text-white text-sm font-semibold hover:bg-[#1e2f6a] transition disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition"
              >
                Annuler
              </button>
            </>
          )}
          {!file && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white transition"
            >
              Changer la photo
            </button>
          )}
        </div>

        {message && (
          <div
            className={`mt-3 p-2 rounded-lg text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}