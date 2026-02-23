import { useState, useEffect, useRef } from 'react';
import { useBusiness } from '@/contexts/BusinessContext';
import { businessService, employeeService, serviceService } from '@/services';
import { galleryService, type GalleryImage } from '@/services/gallery.service';
import { uploadImage } from '@/services/upload.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Upload, 
  X, 
  Plus, 
  Edit2, 
  Save, 
  Store,
  Users,
  Scissors,
  Clock,
  Image as ImageIcon,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import type { Service as ServiceType, Employee } from '@/types';

interface BusinessProfileProps {
  onBack: () => void;
}

export function BusinessProfile({ onBack }: BusinessProfileProps) {
  const { business, refreshBusiness } = useBusiness();
  const isMountedRef = useRef(true);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(true);

  // Business Info (from context)
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState('');
  
  // Services (from API)
  const [services, setServices] = useState<ServiceType[]>([]);
  const [newService, setNewService] = useState({ 
    name: '', 
    duration: 30, 
    price: 0, 
    description: '' 
  });
  const [showAddService, setShowAddService] = useState(false);
  const [savingService, setSavingService] = useState(false);

  // Employees (from API)
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  // Gallery (from API)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  // Load data from business context
  useEffect(() => {
    isMountedRef.current = true;

    if (business) {
      if (isMountedRef.current) {
        setBusinessName(business.name || '');
        setDescription(business.description || '');
        setCategory(business.category || '');
        setAddress(business.address || '');
        setCity(business.city || '');
        setPhone(business.phone || '');
        setEmail(business.email || '');
        setLogo(business.logo || '');
      }
    }

    return () => { isMountedRef.current = false; };
  }, [business]);

  // Load services
  useEffect(() => {
    const loadServices = async () => {
      if (!business?.id) return;

      if (isMountedRef.current) setLoadingServices(true);
      try {
			const response = await serviceService.getByBusiness(business.id);
        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          setServices(response.data);
        }
      } catch (error) {
        console.error('Error loading services:', error);
        if (isMountedRef.current) {
          toast.error('Error al cargar servicios');
        }
      } finally {
        if (isMountedRef.current) setLoadingServices(false);
      }
    };

    loadServices();
  }, [business?.id]);

  // Load employees
  useEffect(() => {
    const loadEmployees = async () => {
      if (!business?.id) return;

      if (isMountedRef.current) setLoadingEmployees(true);
      try {
        const response = await employeeService.getByBusiness(business.id);
        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          setEmployees(response.data);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
        if (isMountedRef.current) {
          toast.error('Error al cargar equipo');
        }
      } finally {
        if (isMountedRef.current) setLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [business?.id]);

  // Load gallery
  useEffect(() => {
    const loadGallery = async () => {
      if (!business?.id) return;

      if (isMountedRef.current) setLoadingGallery(true);
      try {
			const response = await galleryService.getBusinessGallery(business.id);
        if (!isMountedRef.current) return;

        if (response.success && response.data) {
          setGalleryImages(response.data);
        }
      } catch (error) {
        console.error('Error loading gallery:', error);
      } finally {
        if (isMountedRef.current) setLoadingGallery(false);
      }
    };

    loadGallery();
  }, [business?.id]);

  const handleSaveBasicInfo = async () => {
    if (!business?.id) return;

    if (isMountedRef.current) setSaving(true);
    try {
      const response = await businessService.update(business.id, {
        name: businessName,
        description,
        address,
        city,
        phone,
        email,
      });

      if (!isMountedRef.current) return;

      if (response.success) {
        await refreshBusiness();
        setIsEditing(false);
        toast.success('Información actualizada exitosamente');
      } else {
        toast.error(response.error || 'Error al actualizar información');
      }
    } catch (error) {
      console.error('Error saving business info:', error);
      if (isMountedRef.current) {
        toast.error('Error al actualizar información');
      }
    } finally {
      if (isMountedRef.current) setSaving(false);
    }
  };

  const handleAddService = async () => {
    if (!business?.id) return;
    if (!newService.name || !newService.duration || !newService.price) {
      toast.error('Completa todos los campos del servicio');
      return;
    }
    
    if (isMountedRef.current) setSavingService(true);
    try {
      const response = await serviceService.create(business.id, {
        ...newService,
        isActive: true,
      });

      if (!isMountedRef.current) return;

      if (response.success && response.data) {
        setServices([...services, response.data]);
        setNewService({ name: '', duration: 30, price: 0, description: '' });
        setShowAddService(false);
        toast.success('Servicio agregado exitosamente');
      } else {
        toast.error(response.error || 'Error al agregar servicio');
      }
    } catch (error) {
      console.error('Error adding service:', error);
      if (isMountedRef.current) {
        toast.error('Error al agregar servicio');
      }
    } finally {
      if (isMountedRef.current) setSavingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!business?.id) return;

    try {
			const response = await serviceService.delete(id);
      
      if (!isMountedRef.current) return;

      if (response.success) {
        setServices(services.filter(s => s.id !== id));
        toast.success('Servicio eliminado');
      } else {
        toast.error(response.error || 'Error al eliminar servicio');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      if (isMountedRef.current) {
        toast.error('Error al eliminar servicio');
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !business?.id) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    if (isMountedRef.current) setUploadingImage(true);
    try {
      const response = await uploadImage(file);
      if (!isMountedRef.current) return;

      if (!response) {
        toast.error('Error al subir imagen');
        return;
      }

      const imageUrl = `http://localhost:3000${response.url}`;
      const galleryResponse = await galleryService.createGalleryImage(business.id, {
        url: imageUrl,
        title: file.name,
        isFeatured: false,
        order: galleryImages.length,
      });

      if (galleryResponse.success && galleryResponse.data) {
        setGalleryImages([...galleryImages, galleryResponse.data]);
        toast.success('Imagen agregada exitosamente');
      } else {
        toast.error('Error al guardar imagen en la galería');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      if (isMountedRef.current) {
        toast.error('Error al subir imagen');
      }
    } finally {
      if (isMountedRef.current) setUploadingImage(false);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!business?.id) return;

    try {
			const response = await galleryService.deleteGalleryImage(business.id, id);
      
      if (!isMountedRef.current) return;

      if (response.success) {
        setGalleryImages(galleryImages.filter(img => img.id !== id));
        toast.success('Imagen eliminada');
      } else {
        toast.error(response.error || 'Error al eliminar imagen');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      if (isMountedRef.current) {
        toast.error('Error al eliminar imagen');
      }
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="size-4 mr-1" />
              Volver
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Perfil del Negocio</h1>
              <p className="text-sm text-neutral-600">Personaliza y gestiona tu perfil público</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="basic">
              <Store className="size-4 mr-2" />
              Información
            </TabsTrigger>
            <TabsTrigger value="services">
              <Scissors className="size-4 mr-2" />
              Servicios
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="size-4 mr-2" />
              Equipo
            </TabsTrigger>
            <TabsTrigger value="gallery">
              <ImageIcon className="size-4 mr-2" />
              Galería
            </TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Información Básica</CardTitle>
                    <CardDescription>Datos principales de tu negocio</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit2 className="size-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setIsEditing(false)} 
                        variant="outline"
                        disabled={saving}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveBasicInfo} disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <Save className="size-4 mr-2" />
                            Guardar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div>
                  <Label>Logo del Negocio</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Avatar className="size-24">
                      <AvatarImage src={logo || 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300'} />
                      <AvatarFallback>{businessName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm" disabled>
                        <Upload className="size-4 mr-2" />
                        Cambiar Logo
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessName">Nombre del Negocio</Label>
                    <Input
                      id="businessName"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={category}
                      disabled
                      className="bg-neutral-100"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-semibold">Ubicación y Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Servicios</CardTitle>
                    <CardDescription>Gestiona los servicios que ofreces</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddService(true)} disabled={showAddService}>
                    <Plus className="size-4 mr-2" />
                    Agregar Servicio
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingServices ? (
                  <div className="text-center py-12">
                    <Loader2 className="size-8 mx-auto animate-spin text-neutral-400 mb-3" />
                    <p className="text-neutral-600">Cargando servicios...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <Card key={service.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg mb-1">{service.name}</h4>
                              <p className="text-sm text-neutral-600 mb-2">{service.description}</p>
                              <div className="flex gap-4 text-sm">
                                <Badge variant="outline">
                                  <Clock className="size-3 mr-1" />
                                  {service.duration} min
                                </Badge>
                                <span className="font-semibold text-green-600">
                                  ${service.price} MXN
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <X className="size-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {showAddService && (
                      <Card className="border-2 border-dashed">
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="serviceName">Nombre del Servicio</Label>
                                <Input
                                  id="serviceName"
                                  placeholder="Ej: Corte Clásico"
                                  value={newService.name}
                                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="serviceDuration">Duración (minutos)</Label>
                                <Input
                                  id="serviceDuration"
                                  type="number"
                                  placeholder="30"
                                  value={newService.duration || ''}
                                  onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="servicePrice">Precio (MXN)</Label>
                              <Input
                                id="servicePrice"
                                type="number"
                                placeholder="250"
                                value={newService.price || ''}
                                onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="serviceDescription">Descripción</Label>
                              <Textarea
                                id="serviceDescription"
                                placeholder="Describe el servicio..."
                                value={newService.description}
                                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleAddService} disabled={savingService}>
                                {savingService ? (
                                  <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Guardando...
                                  </>
                                ) : (
                                  <>
                                    <Save className="size-4 mr-2" />
                                    Guardar Servicio
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowAddService(false);
                                  setNewService({ name: '', duration: 30, price: 0, description: '' });
                                }}
                                disabled={savingService}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {services.length === 0 && !showAddService && (
                      <div className="text-center py-12 text-neutral-500">
                        <Scissors className="size-12 mx-auto mb-3 text-neutral-300" />
                        <p>No hay servicios agregados aún</p>
                        <p className="text-sm">Agrega tu primer servicio para comenzar</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Equipo</CardTitle>
                    <CardDescription>Profesionales que trabajan en tu negocio</CardDescription>
                  </div>
                  <Button onClick={() => setShowAddEmployee(true)} disabled={showAddEmployee}>
                    <Plus className="size-4 mr-2" />
                    Agregar Profesional
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingEmployees ? (
                  <div className="text-center py-12">
                    <Loader2 className="size-8 mx-auto animate-spin text-neutral-400 mb-3" />
                    <p className="text-neutral-600">Cargando equipo...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <Card key={employee.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="size-16">
                              <AvatarImage src={employee.user?.avatar || undefined} />
                              <AvatarFallback>
                                {employee.user?.firstName?.[0]}{employee.user?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">
                                {employee.user?.firstName} {employee.user?.lastName}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                {employee.specialties?.join(', ') || 'Sin especialidad'}
                              </p>
                              {employee.user?.bio && (
                                <p className="text-xs text-neutral-500 mt-1">{employee.user.bio}</p>
                              )}
                              <Badge variant="secondary" className="mt-2">
                                Empleado
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {showAddEmployee && (
                      <Card className="border-2 border-dashed">
                        <CardContent className="pt-6">
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Nota:</strong> Para agregar nuevos empleados, ve a la sección de "Equipo" en el dashboard principal o contacta al empleado para que se registre e ingrese el código de tu negocio.
                            </p>
                          </div>
                          <div className="mt-4">
                            <Button
                              variant="outline"
                              onClick={() => setShowAddEmployee(false)}
                            >
                              Cerrar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {employees.length === 0 && !showAddEmployee && (
                      <div className="text-center py-12 text-neutral-500">
                        <Users className="size-12 mx-auto mb-3 text-neutral-300" />
                        <p>No hay profesionales agregados aún</p>
                        <p className="text-sm">Agrega a tu equipo para que los clientes puedan elegir</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Galería</CardTitle>
                    <CardDescription>Fotos de tu negocio y trabajos realizados</CardDescription>
                  </div>
                  <label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <Button disabled={uploadingImage} asChild>
                      <span>
                        {uploadingImage ? (
                          <>
                            <Loader2 className="size-4 mr-2 animate-spin" />
                            Subiendo...
                          </>
                        ) : (
                          <>
                            <Plus className="size-4 mr-2" />
                            Agregar Foto
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                {loadingGallery ? (
                  <div className="text-center py-12">
                    <Loader2 className="size-8 mx-auto animate-spin text-neutral-400 mb-3" />
                    <p className="text-neutral-600">Cargando galería...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-neutral-100">
                          <img
								src={image.url}
								alt={image.title || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteGalleryImage(image.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                    
                    {/* Upload placeholder */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      <div className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 hover:border-neutral-400 flex items-center justify-center text-neutral-400 hover:text-neutral-600 transition-colors">
                        <div className="text-center">
                          {uploadingImage ? (
                            <Loader2 className="size-8 mx-auto mb-2 animate-spin" />
                          ) : (
                            <Upload className="size-8 mx-auto mb-2" />
                          )}
                          <p className="text-sm">{uploadingImage ? 'Subiendo...' : 'Agregar'}</p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}

                {galleryImages.length === 0 && !loadingGallery && (
                  <div className="text-center py-12 text-neutral-500">
                    <ImageIcon className="size-12 mx-auto mb-3 text-neutral-300" />
                    <p>No hay fotos en la galería</p>
                    <p className="text-sm">Sube fotos para mostrar tu trabajo</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
