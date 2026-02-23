import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';
import { serviceService } from '@/services';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { LoadingButton, ConfirmDialog, useConfirmDialog, SkeletonLoader, ErrorMessage } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, Edit, Trash2, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Service {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  duration: number;
  price: number;
  image?: string | null;
  isActive: boolean;
  order: number;
}

const SERVICE_CATEGORIES = [
  'Corte',
  'Barba',
  'Afeitado',
  'Color',
  'Tratamiento',
  'Peinado',
  'Masaje',
  'Facial',
  'Paquete',
  'Otro',
];

export function ServicesTab() {
  const { user } = useAuth();
  const { business, isLoading: businessLoading } = useBusiness();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(true);
  const { isOpen: confirmOpen, openDialog: openConfirm, closeDialog: closeConfirm, confirm } = useConfirmDialog();
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    duration: '',
    price: '',
    image: '',
  });

  // Cargar servicios al montar
  useEffect(() => {
    setIsMounted(true);

    if (business?.id && isMounted) {
      loadServices();
    } else if (!businessLoading && isMounted) {
      // Si no está cargando y no hay negocio, terminar el loading
      setLoading(false);
    }

    return () => {
      setIsMounted(false);
    };
  }, [business?.id, businessLoading]);

  const loadServices = async () => {
    if (!business?.id || !isMounted) return;

    try {
      setLoading(true);
      const response = await serviceService.getByBusiness(business.id);
      if (response.success && response.data && isMounted) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
      if (isMounted) {
        toast.error('Error al cargar los servicios');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        category: service.category || '',
        duration: service.duration.toString(),
        price: service.price.toString(),
        image: service.image || '',
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        duration: '',
        price: '',
        image: '',
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      category: '',
      duration: '',
      price: '',
      image: '',
    });
  };

  const handleSaveService = async () => {
    if (!formData.name || !formData.duration || !formData.price) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    if (!business?.id) {
      setError('No se encontró el negocio');
      return;
    }

    if (!isMounted) return;

    try {
      setSaving(true);
      setError(null);

      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category || null,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        image: formData.image || null,
      };

      if (editingService) {
        // Actualizar servicio existente
        const response = await serviceService.update(editingService.id, serviceData);
        if (response.success && response.data && isMounted) {
          setServices(prev =>
            prev.map(s => s.id === editingService.id ? response.data! : s)
          );
          toast.success('Servicio actualizado correctamente');
        }
      } else {
        // Crear nuevo servicio
        const response = await serviceService.create(business.id, serviceData);
        if (response.success && response.data && isMounted) {
          setServices(prev => [...prev, response.data!]);
          toast.success('Servicio agregado correctamente');
        }
      }

      if (isMounted) {
        handleCloseDialog();
      }
    } catch (error: any) {
      console.error('Error guardando servicio:', error);
      if (isMounted) {
        setError(error.message || 'Error al guardar el servicio');
      }
    } finally {
      if (isMounted) {
        setSaving(false);
      }
    }
  };

  const handleDeleteClick = (id: string) => {
    setServiceToDelete(id);
    openConfirm();
  };

  const handleDeleteService = async () => {
    if (!serviceToDelete || !isMounted) return;

    try {
      setDeleting(true);
      const response = await serviceService.delete(serviceToDelete);
      if (response.success && isMounted) {
        setServices(prev => prev.filter(s => s.id !== serviceToDelete));
        toast.success('Servicio eliminado correctamente');
        closeConfirm();
        setServiceToDelete(null);
      }
    } catch (error: any) {
      console.error('Error eliminando servicio:', error);
      if (isMounted) {
        toast.error(error.message || 'Error al eliminar el servicio');
      }
    } finally {
      if (isMounted) {
        setDeleting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <SkeletonLoader variant="text" className="h-7 w-48" />
                <SkeletonLoader variant="text" className="h-4 w-64 mt-2" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <SkeletonLoader variant="list" count={3} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-neutral-500 text-lg">No tienes un negocio registrado</p>
        <p className="text-sm text-neutral-400 mt-2">
          Necesitas registrar un negocio para administrar servicios
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Servicios y Precios</CardTitle>
              <CardDescription>
                Administra los servicios disponibles y sus precios
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="size-4 mr-2" />
              Nuevo Servicio
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <p>No tienes servicios registrados</p>
              <p className="text-sm mt-2">Agrega tu primer servicio para comenzar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-neutral-500 mt-1">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {service.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-xs font-medium">
                            {service.category}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Clock className="size-4 text-neutral-500" />
                          {service.duration} min
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 font-semibold">
                          <DollarSign className="size-4" />
                          ${service.price} MXN
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(service)}
                          >
                            <Edit className="size-4" />
                            <span className="hidden sm:inline ml-1">Editar</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(service.id)}
                          >
                            <Trash2 className="size-4" />
                            <span className="hidden sm:inline ml-1">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Service Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription>
              {editingService
                ? 'Modifica la información del servicio'
                : 'Agrega un nuevo servicio a tu catálogo'}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <ErrorMessage
              title="Error"
              message={error}
              variant="error"
            />
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="service-name">
                  Nombre del servicio <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service-name"
                  placeholder="Ej: Corte Premium"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="service-description">Descripción</Label>
                <Textarea
                  id="service-description"
                  placeholder="Describe el servicio..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="service-category">Categoría</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="service-category">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="service-duration">
                  Duración (minutos) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service-duration"
                  type="number"
                  placeholder="30"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="service-price">
                  Precio (MXN) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="service-price"
                  type="number"
                  placeholder="250"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="service-image">URL de imagen</Label>
                <Input
                  id="service-image"
                  type="url"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              Cancelar
            </Button>
            <LoadingButton
              onClick={handleSaveService}
              loading={saving}
              variant="primary"
            >
              {editingService ? 'Actualizar' : 'Agregar'}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={closeConfirm}
        onConfirm={handleDeleteService}
        title="Eliminar Servicio"
        description="¿Estás seguro de que deseas eliminar este servicio? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
