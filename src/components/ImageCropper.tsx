import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RotateCcw, RotateCw, ZoomIn } from 'lucide-react';
import { CropArea } from '@/utils/imageProcessing';

interface ImageCropperProps {
  image: string;
  cropShape: 'rect' | 'round';
  aspect?: number;
  onCropComplete: (croppedArea: CropArea, rotation: number) => void;
  onCancel: () => void;
  isProcessing: boolean;
}

export const ImageCropper = ({
  image,
  cropShape,
  aspect = 1,
  onCropComplete,
  onCancel,
  isProcessing,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: any, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleRotateLeft = () => {
    setRotation((prev) => prev - 90);
  };

  const handleRotateRight = () => {
    setRotation((prev) => prev + 90);
  };

  const handleSave = () => {
    if (croppedAreaPixels) {
      onCropComplete(croppedAreaPixels, rotation);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 bg-muted/10 min-h-[400px]">
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={aspect}
          cropShape={cropShape}
          showGrid={true}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={onCropCompleteCallback}
        />
      </div>

      <div className="space-y-6 pt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <ZoomIn className="h-4 w-4" />
              Zoom
            </Label>
            <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
          </div>
          <Slider
            min={1}
            max={3}
            step={0.1}
            value={[zoom]}
            onValueChange={(value) => setZoom(value[0])}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label>Rotate</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotateLeft}
              className="flex-1"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Rotate Left
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRotateRight}
              className="flex-1"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate Right
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isProcessing || !croppedAreaPixels}
            className="flex-1"
          >
            {isProcessing ? 'Processing...' : 'Save & Upload'}
          </Button>
        </div>
      </div>
    </div>
  );
};
