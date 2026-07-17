// src/components/AvatarUpload.tsx
import { useRef } from 'react';
import { toast } from 'sonner';

interface AvatarUploadProps {
  previewUrl: string;
  onFileSelect: (file: File) => void;
}

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const AvatarUpload = ({ previewUrl, onFileSelect }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Unsupported file type. Use JPG, PNG, or WEBP.');
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error('File is too large. Max size is 2 MB.');
      return;
    }
    onFileSelect(file);
  };

  const triggerSelect = () => {
    inputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 cursor-pointer border-2 border-gray-300 hover:border-primary-600 transition"
        onClick={triggerSelect}
        aria-label="Upload avatar"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar preview" loading="lazy" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">No avatar</div>
        )}
      </div>
      <button
        type="button"
        className="text-sm text-primary-600 hover:underline"
        onClick={triggerSelect}
      >
        Change Photo
      </button>
      <input
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        ref={inputRef}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};

export default AvatarUpload;
