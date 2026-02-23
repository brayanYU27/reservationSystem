import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { LoadingButton, SkeletonLoader, useConfirmDialog } from '@/components/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Plus,
    Search,
    Trash2,
    Edit,
    Mail,
    Phone,
    XCircle,
    Users
} from 'lucide-react';
import { employeeService } from '@/services';
import { toast } from 'sonner';
import type { Employee } from '@/types';

export function StaffTab() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deleting, setDeleting] = useState(false);
    const { confirm: confirmDelete, Dialog: DeleteDialog } = useConfirmDialog();

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        bio: '',
        specialties: [] as string[]
    });

    const [specialtyInput, setSpecialtyInput] = useState('');

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const response = await employeeService.getAll();
            if (response.success && response.data) {
                setEmployees(response.data);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            toast.error('Error al cargar empleados');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            position: '',
            bio: '',
            specialties: []
        });
        setSpecialtyInput('');
        setIsAddOpen(true);
    };

    const handleOpenEdit = (employee: Employee) => {
        setSelectedEmployee(employee);
        setFormData({
            firstName: employee.user?.firstName || '',
            lastName: employee.user?.lastName || '',
            email: employee.user?.email || '',
            phone: employee.user?.phone || '',
            position: employee.position || '',
            bio: employee.bio || '',
            specialties: Array.isArray(employee.specialties) ? employee.specialties : []
        });
        setSpecialtyInput('');
        setIsEditOpen(true);
    };

    const handleAddSpecialty = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && specialtyInput.trim()) {
            e.preventDefault();
            if (!formData.specialties.includes(specialtyInput.trim())) {
                setFormData(prev => ({
                    ...prev,
                    specialties: [...prev.specialties, specialtyInput.trim()]
                }));
            }
            setSpecialtyInput('');
        }
    };

    const removeSpecialty = (specialty: string) => {
        setFormData(prev => ({
            ...prev,
            specialties: prev.specialties.filter(s => s !== specialty)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (selectedEmployee) {
                // Edit
                const response = await employeeService.update(selectedEmployee.id, {
                    position: formData.position,
                    bio: formData.bio,
                    specialties: formData.specialties,
                    // Note: Updating user details (name, email) might require different endpoint or permissions logic
                    // For now we only update Employee details
                });

                if (response.success) {
                    toast.success('Empleado actualizado');
                    setIsEditOpen(false);
                    loadEmployees();
                } else {
                    toast.error(response.error?.message || 'Error al actualizar');
                }

            } else {
                // Create
                const response = await employeeService.create(formData);

                if (response.success) {
                    toast.success('Empleado agregado exitosamente');
                    setIsAddOpen(false);
                    loadEmployees();
                } else {
                    toast.error(response.error?.message || 'Error al crear empleado');
                }
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            toast.error('Ocurrió un error inesperado');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = async (id: string) => {
        await confirmDelete({
            title: 'Desactivar Empleado',
            message: '¿Estás seguro de desactivar a este empleado? Podrás reactivarlo más tarde.',
            confirmText: 'Desactivar',
            variant: 'warning',
            onConfirm: async () => {
                try {
                    setDeleting(true);
                    const response = await employeeService.delete(id);
                    if (response.success) {
                        toast.success('Empleado desactivado');
                        loadEmployees();
                    } else {
                        toast.error('Error al eliminar');
                    }
                } catch (error) {
                    toast.error('Error al eliminar');
                } finally {
                    setDeleting(false);
                }
            },
        });
    };

    const filteredEmployees = employees.filter(emp => {
        const search = searchTerm.toLowerCase();
        const fullName = `${emp.user?.firstName} ${emp.user?.lastName}`.toLowerCase();
        const email = emp.user?.email?.toLowerCase() || '';
        const position = emp.position?.toLowerCase() || '';

        return fullName.includes(search) || email.includes(search) || position.includes(search);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold">Gestión de Equipo</h2>
                    <p className="text-neutral-600 mt-1">
                        Administra a tus empleados y sus permisos
                    </p>
                </div>
                <Button onClick={handleOpenAdd} className="w-full sm:w-auto">
                    <Plus className="size-4 mr-2" />
                    Agregar Empleado
                </Button>
            </div>

            {/* Filters */}
            <div className="relative">
                <Search className="absolute left-3 top-3 size-4 text-neutral-400" />
                <Input
                    placeholder="Buscar por nombre, email o cargo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <SkeletonLoader variant="card" count={3} />
                </div>
            ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 border rounded-lg bg-neutral-50">
                    <Users className="size-12 mx-auto text-neutral-400 mb-4" />
                    <h3 className="text-lg font-medium text-neutral-900">No hay empleados</h3>
                    <p className="text-neutral-500 mt-1">
                        {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Comienza agregando a tu primer empleado'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEmployees.map((employee) => (
                        <Card key={employee.id} className="overflow-hidden hover:shadow-lg transition-all group">
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500" />
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-12 border-2 border-white shadow-sm">
                                            <AvatarImage src={employee.user?.avatar || undefined} />
                                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">
                                                {employee.user?.firstName?.[0]}{employee.user?.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {employee.user?.firstName} {employee.user?.lastName}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-1">
                                                {employee.position}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={employee.isActive ? "default" : "secondary"}>
                                        {employee.isActive ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 text-sm text-neutral-600">
                                    <div className="flex items-center gap-2">
                                        <Mail className="size-4 text-neutral-400" />
                                        <span>{employee.user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="size-4 text-neutral-400" />
                                        <span>{employee.user?.phone || 'Sin teléfono'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {(Array.isArray(employee.specialties) ? employee.specialties : []).map((spec: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs bg-neutral-50">
                                            {spec}
                                        </Badge>
                                    ))}
                                </div>

                                <div className="pt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleOpenEdit(employee)}
                                    >
                                        <Edit className="size-3 mr-2" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDeleteClick(employee.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsAddOpen(false);
                    setIsEditOpen(false);
                    setSelectedEmployee(null);
                }
            }}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditOpen ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditOpen
                                ? 'Modifica los detalles del empleado. Los datos de usuario (email) no se pueden cambiar aquí.'
                                : 'Se creará una cuenta de usuario para este empleado automáticamente.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">Nombre *</Label>
                                <Input
                                    id="firstName"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    disabled={isEditOpen} // User details read-only on edit for MVP
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Apellido *</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    disabled={isEditOpen}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                disabled={isEditOpen}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                disabled={isEditOpen}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo / Puesto *</Label>
                            <Input
                                id="position"
                                placeholder="Ej. Barbero Senior"
                                value={formData.position}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Biografía Corta</Label>
                            <Input
                                id="bio"
                                placeholder="Experiencia, certificaciones..."
                                value={formData.bio}
                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Especialidades</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={specialtyInput}
                                    onChange={e => setSpecialtyInput(e.target.value)}
                                    onKeyDown={handleAddSpecialty}
                                    placeholder="Escribe y presiona Enter"
                                />
                                <Button type="button" size="icon" onClick={() => {
                                    if (specialtyInput.trim()) {
                                        setFormData(prev => ({
                                            ...prev,
                                            specialties: [...prev.specialties, specialtyInput.trim()]
                                        }));
                                        setSpecialtyInput('');
                                    }
                                }}>
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                                {formData.specialties.map((spec, i) => (
                                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                                        {spec}
                                        <XCircle
                                            className="size-3 cursor-pointer hover:text-red-500"
                                            onClick={() => removeSpecialty(spec)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => {
                                setIsAddOpen(false);
                                setIsEditOpen(false);
                            }}>
                                Cancelar
                            </Button>
                            <LoadingButton
                                type="submit"
                                loading={isSubmitting}
                                variant="primary"
                            >
                                {isEditOpen ? 'Guardar Cambios' : 'Crear Empleado'}
                            </LoadingButton>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            {DeleteDialog}
        </div>
    );
}
