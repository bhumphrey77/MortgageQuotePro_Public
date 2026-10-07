import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageCropper } from './ImageCropper';
import { CropArea } from '@/utils/imageProcessing';

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string | null;
  cropType: 'avatar' | 'logo';
  aspectRatio?: number;
  onCropComplete: (croppedArea: CropArea, rotation: number) => void;
  isProcessing: boolean;
}

export const ImageCropperDialog = ({
  open,
  onOpenChange,
  image,
  cropType,
  aspectRatio,
  onCropComplete,
  isProcessing,
}: ImageCropperDialogProps) => {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {cropType === 'avatar' ? 'Crop Profile Picture' : 'Crop Company Logo'}
          </DialogTitle>
          <DialogDescription>
            Adjust the crop area, zoom, and rotation to get the perfect image.
            {cropType === 'avatar' 
              ? ' Your profile picture will be displayed as a circle.'
              : ' Your logo will be displayed as a square.'}
          </DialogDescription>
        </DialogHeader>
        <ImageCropper
          image={image}
          cropShape={cropType === 'avatar' ? 'round' : 'rect'}
          aspect={aspectRatio || (cropType === 'avatar' ? 1 : 2)}
          onCropComplete={onCropComplete}
          onCancel={() => onOpenChange(false)}
          isProcessing={isProcessing}
        />
      </DialogContent>
    </Dialog>
  );
};
