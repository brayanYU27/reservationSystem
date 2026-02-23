# Visual Feedback Components - Usage Examples

This guide shows how to use the new visual feedback components in your application.

## LoadingButton

Replace standard buttons with `LoadingButton` for better UX during async operations.

### Basic Usage

```tsx
import { LoadingButton } from '@/components/ui';
import { useState } from 'react';

function MyForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await saveData();
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      loading={loading}
      onClick={handleSubmit}
      variant="primary"
    >
      Guardar
    </LoadingButton>
  );
}
```

### Variants

```tsx
<LoadingButton variant="primary">Primary</LoadingButton>
<LoadingButton variant="secondary">Secondary</LoadingButton>
<LoadingButton variant="danger">Delete</LoadingButton>
<LoadingButton variant="success">Success</LoadingButton>
<LoadingButton variant="outline">Outline</LoadingButton>
```

### Sizes

```tsx
<LoadingButton size="sm">Small</LoadingButton>
<LoadingButton size="md">Medium</LoadingButton>
<LoadingButton size="lg">Large</LoadingButton>
```

---

## ConfirmDialog

Use `ConfirmDialog` for destructive actions like delete, cancel, or remove.

### With Hook (Recommended)

```tsx
import { useConfirmDialog } from '@/components/ui';

function MyComponent() {
  const { confirm, Dialog } = useConfirmDialog();

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '¿Eliminar servicio?',
      message: 'Esta acción no se puede deshacer. El servicio será eliminado permanentemente.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        await deleteService();
      }
    });

    if (confirmed) {
      toast.success('Servicio eliminado');
    }
  };

  return (
    <>
      <button onClick={handleDelete}>Eliminar</button>
      {Dialog}
    </>
  );
}
```

### Direct Component Usage

```tsx
import { ConfirmDialog } from '@/components/ui';
import { useState } from 'react';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <button onClick={() => setShowDialog(true)}>Delete</button>
      
      <ConfirmDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        onConfirm={async () => {
          await deleteItem();
        }}
        title="¿Eliminar elemento?"
        message="Esta acción no se puede deshacer."
        variant="danger"
      />
    </>
  );
}
```

---

## ErrorMessage

Display user-friendly error messages with optional retry functionality.

### Basic Error

```tsx
import { ErrorMessage } from '@/components/ui';

function MyComponent() {
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <ErrorMessage
        title="Error al cargar datos"
        message={error}
        variant="error"
      />
    );
  }

  return <div>Content</div>;
}
```

### With Retry Button

```tsx
<ErrorMessage
  title="Error de conexión"
  message="No se pudo conectar al servidor. Por favor, intenta de nuevo."
  variant="error"
  onRetry={() => loadData()}
/>
```

### Variants

```tsx
<ErrorMessage variant="error" message="Error crítico" />
<ErrorMessage variant="warning" message="Advertencia importante" />
<ErrorMessage variant="info" message="Información relevante" />
```

---

## SkeletonLoader

Show loading placeholders while fetching data.

### Text Skeleton

```tsx
import { SkeletonLoader } from '@/components/ui';

function MyComponent() {
  const [loading, setLoading] = useState(true);

  if (loading) {
    return <SkeletonLoader variant="text" count={3} />;
  }

  return <div>Content</div>;
}
```

### Card Skeleton

```tsx
{loading ? (
  <SkeletonLoader variant="card" />
) : (
  <Card>...</Card>
)}
```

### Business Card Skeleton

```tsx
{loading ? (
  <div className="grid md:grid-cols-3 gap-4">
    <SkeletonLoader variant="business-card" />
    <SkeletonLoader variant="business-card" />
    <SkeletonLoader variant="business-card" />
  </div>
) : (
  businesses.map(b => <BusinessCard key={b.id} {...b} />)
)}
```

### List Skeleton

```tsx
{loading ? (
  <SkeletonLoader variant="list" count={5} />
) : (
  <ul>{items.map(item => <li key={item.id}>{item.name}</li>)}</ul>
)}
```

### Stats Cards Skeleton

```tsx
{loading ? (
  <SkeletonLoader variant="stats" count={3} />
) : (
  <div className="grid md:grid-cols-3 gap-4">
    <StatsCard title="Total" value={100} />
    <StatsCard title="Active" value={75} />
    <StatsCard title="Pending" value={25} />
  </div>
)}
```

### Avatar Skeleton

```tsx
{loading ? (
  <SkeletonLoader variant="avatar" />
) : (
  <div className="flex items-center gap-3">
    <img src={user.avatar} className="w-12 h-12 rounded-full" />
    <div>
      <p>{user.name}</p>
      <p className="text-sm text-gray-500">{user.email}</p>
    </div>
  </div>
)}
```

---

## Complete Example: Form with All Components

```tsx
import { useState } from 'react';
import { LoadingButton, ErrorMessage, useConfirmDialog } from '@/components/ui';
import { toast } from 'sonner';

function ServiceForm({ serviceId }: { serviceId?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { confirm, Dialog } = useConfirmDialog();

  const handleSubmit = async (data: ServiceData) => {
    setLoading(true);
    setError(null);
    
    try {
      await saveService(data);
      toast.success('Servicio guardado');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    await confirm({
      title: '¿Eliminar servicio?',
      message: 'Esta acción no se puede deshacer.',
      variant: 'danger',
      onConfirm: async () => {
        await deleteService(serviceId);
        toast.success('Servicio eliminado');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <ErrorMessage
          title="Error al guardar"
          message={error}
          variant="error"
          onRetry={() => handleSubmit(formData)}
        />
      )}

      {/* Form fields */}
      
      <div className="flex gap-2">
        <LoadingButton
          type="submit"
          loading={loading}
          variant="primary"
        >
          Guardar
        </LoadingButton>

        {serviceId && (
          <LoadingButton
            type="button"
            onClick={handleDelete}
            variant="danger"
          >
            Eliminar
          </LoadingButton>
        )}
      </div>

      {Dialog}
    </form>
  );
}
```

---

## Best Practices

1. **Always show loading states** for async operations
2. **Use confirmations** for destructive actions (delete, cancel, remove)
3. **Show skeleton loaders** instead of spinners for better perceived performance
4. **Provide retry options** for network errors
5. **Keep error messages** user-friendly and actionable
