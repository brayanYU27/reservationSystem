import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { LoadingButton, SkeletonLoader, useConfirmDialog } from '@/components/ui';
import {
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Trash2,
  Eye,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useBusiness } from '../../../contexts/BusinessContext';
import { galleryService, type GalleryImage } from '../../../services/gallery.service';
import { uploadImage } from '../../../services/upload.service';

export function GalleryTab() {
  const { business } = useBusiness();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [isMounted, setIsMounted] = useState(true);
  const { confirm: confirmDelete, Dialog: DeleteDialog } = useConfirmDialog();

  useEffect(() => {
    setIsMounted(true);

    const load = async () => {
      if (business?.id && isMounted) {
        await loadGallery();
      }
    };

    load();

    return () => {
      setIsMounted(false);
    };
  }, [business?.id]);

  const loadGallery = async () => {
    if (!business?.id || !isMounted) return;

    try {
      setLoading(true);
      const response = await galleryService.getBusinessGallery(business.id);

      if (response.success && isMounted) {
        setImages(response.data);
      }
    } catch (error) {
      console.error('Error loading gallery:', error);
      if (isMounted) {
        toast.error('Error al cargar la galería');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validar tamaño (5MB máx)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setNewImageFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImage = async () => {
    if (!business?.id) return;
    if (!newImageFile) {
      toast.error('Selecciona una imagen');
      return;
    }

    try {
      setUploading(true);

      // 1. Subir la imagen al servidor
      const uploadResponse = await uploadImage(newImageFile);

      if (!uploadResponse) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // 2. Guardar la referencia en la galería con la URL del servidor
      const imageUrl = `http://localhost:3000${uploadResponse.url}`;

      const response = await galleryService.createGalleryImage(business.id, {
        url: imageUrl,
        title: newImageTitle || undefined,
        isFeatured: false,
        order: images.length,
      });

      if (response.success) {
        setImages(prev => [...prev, response.data]);
        setNewImageFile(null);
        setNewImagePreview('');
        setNewImageTitle('');
        toast.success('Imagen agregada correctamente');
      } else {
        throw new Error(response.error?.message || 'Error al crear la imagen en la galería');
      }
    } catch (error) {
      console.error('Error adding image:', error);
      toast.error(error instanceof Error ? error.message : 'Error al agregar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    await confirmDelete({
      title: 'Eliminar Imagen',
      message: '¿Estás seguro de eliminar esta imagen de la galería? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger',
      onConfirm: async () => {
        if (!business?.id) return;

        try {
          setDeleting(true);
          await galleryService.deleteGalleryImage(business.id, id);
          setImages(prev => prev.filter(img => img.id !== id));
          toast.success('Imagen eliminada');
        } catch (error) {
          console.error('Error deleting image:', error);
          toast.error('Error al eliminar la imagen');
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  const handleToggleFeatured = async (id: string, currentValue: boolean) => {
    if (!business?.id) return;

    try {
      await galleryService.updateGalleryImage(business.id, id, {
        isFeatured: !currentValue,
      });

      setImages(prev =>
        prev.map(img =>
          img.id === id ? { ...img, isFeatured: !currentValue } : img
        )
      );
      toast.success('Imagen actualizada');
    } catch (error) {
      console.error('Error updating image:', error);
      toast.error('Error al actualizar la imagen');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader variant="text" className="h-12 w-full" />
        <SkeletonLoader variant="card" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <SkeletonLoader variant="card" count={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Galería de Fotos</h3>
          <p className="text-neutral-600">Muestra tu trabajo y atrae más clientes</p>
        </div>
      </div>

      {/* Add Image Form */}
      <Card>
        <CardHeader>
          <CardTitle>Agregar Nueva Foto</CardTitle>
          <CardDescription>
            Sube una imagen desde tu computadora (JPG, PNG, GIF o WebP, máx 5MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {/* File Input */}
            <div className="space-y-2">
              <Label htmlFor="imageFile">Seleccionar Imagen *</Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="cursor-pointer"
              />
            </div>

            {/* Preview */}
            {newImagePreview && (
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border-2 border-neutral-200">
                  <img
                    src={newImagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Esta es la imagen que se agregará a tu galería
                </p>
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="imageTitle">Título (opcional)</Label>
              <Input
                id="imageTitle"
                type="text"
                placeholder="Ej: Corte Clásico"
                value={newImageTitle}
                onChange={(e) => setNewImageTitle(e.target.value)}
                disabled={uploading}
              />
            </div>
          </div>

          <LoadingButton
            onClick={handleAddImage}
            loading={uploading}
            disabled={!newImageFile}
            variant="primary"
          >
            <Upload className="size-4 mr-2" />
            Agregar Foto
          </LoadingButton>
        </CardContent>
      </Card>

      {/* Cover Image - Muestra la coverImage del negocio */}
      {business?.coverImage && (
        <Card>
          <CardHeader>
            <CardTitle>Imagen de Portada</CardTitle>
            <CardDescription>
              Esta imagen aparece en la parte superior de tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative rounded-lg overflow-hidden aspect-[21/9] bg-neutral-100">
              <img
                src={business.coverImage}
                alt="Portada"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-neutral-600 mt-2">
              Puedes actualizar la imagen de portada desde el perfil del negocio
            </p>
          </CardContent>
        </Card>
      )}


      {/* Gallery Grid */}
      <div>
        <h4 className="text-lg font-semibold mb-4">
          Galería ({images.length} {images.length === 1 ? 'foto' : 'fotos'})
        </h4>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square">
                <Skeleton className="w-full h-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : images.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="size-12 text-neutral-400 mb-3" />
              <p className="text-neutral-600 text-center">
                No hay fotos en tu galería. Agrega la primera para mostrar tu trabajo.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt={image.title || 'Foto de galería'}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedImage(image)}
                    />

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                        }}
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFeatured(image.id, image.isFeatured);
                        }}
                      >
                        <Star className={`size-4 ${image.isFeatured ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(image.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {/* Featured Badge */}
                    {image.isFeatured && (
                      <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                        <Star className="size-3 fill-black" />
                        Destacada
                      </div>
                    )}

                    {/* Title Overlay */}
                    {image.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <p className="text-white text-sm font-medium truncate">
                          {image.title}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900 text-base">
            💡 Tips para tu Galería
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Sube fotos de alta calidad de tus trabajos más recientes</p>
          <p>• Muestra diferentes estilos y servicios que ofreces</p>
          <p>• Incluye fotos del ambiente y tu equipo de trabajo</p>
          <p>• Actualiza tu galería regularmente con nuevos trabajos</p>
          <p>• Marca como "Destacadas" tus mejores fotos</p>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="size-6" />
            </Button>
            <img
              src={selectedImage.url}
              alt={selectedImage.title || 'Imagen'}
              className="w-full rounded-lg"
            />
            {selectedImage.title && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 rounded-lg p-4">
                <p className="text-white font-semibold">{selectedImage.title}</p>
                {selectedImage.description && (
                  <p className="text-neutral-300 text-sm mt-1">{selectedImage.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {DeleteDialog}
    </div>
  );
}

