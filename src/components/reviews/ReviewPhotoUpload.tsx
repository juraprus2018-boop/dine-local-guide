import { useState, useRef } from 'react';
import { Camera, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReviewPhotoUploadProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export function ReviewPhotoUpload({ 
  photos, 
  onPhotosChange, 
  maxPhotos = 4,
  disabled = false 
}: ReviewPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = maxPhotos - photos.length;
    const filesToAdd = files.slice(0, remainingSlots);

    // Validate files
    const validFiles = filesToAdd.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        return false;
      }
      if (!file.type.startsWith('image/')) {
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    onPhotosChange([...photos, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onPhotosChange(newPhotos);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const canAddMore = photos.length < maxPhotos;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {previews.map((preview, index) => (
          <div key={index} className="relative">
            <img
              src={preview}
              alt={`Preview ${index + 1}`}
              className="h-20 w-20 object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6"
              onClick={() => removePhoto(index)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              'h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
              disabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:border-primary/50 cursor-pointer'
            )}
          >
            <Camera className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {photos.length === 0 ? 'Foto' : '+'}
            </span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <p className="text-xs text-muted-foreground">
        {photos.length}/{maxPhotos} foto's (max 5MB per foto)
      </p>
    </div>
  );
}
