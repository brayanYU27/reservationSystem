import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Search,
  MapPin,
  Star,
  Scissors,
  Sparkles,
  SlidersHorizontal,
  Heart,
  Calendar,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { businessService } from '../../services/business.service';
import type { BusinessSearchResult, SearchFilters } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface ExploreViewProps {
  onSelectBusiness?: (id: string) => void;
  onBack?: () => void;
}

export function ExploreView({ }: ExploreViewProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'price' | 'popularity'>('rating');
  const [showFilters, setShowFilters] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const filters: SearchFilters = {};

      if (searchQuery) filters.query = searchQuery;
      if (location) {
        filters.city = location; // Simple mapping for now
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter as any;
      }
      filters.sortBy = sortBy;

      const response = await businessService.search(filters);

      if (response.success && response.data) {
        setBusinesses(response.data.businesses);
      } else {
        setBusinesses([]);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast.error('Error al cargar los negocios');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, location, categoryFilter, sortBy]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchBusinesses]);

  const handleSelectBusiness = (id: string) => {
    navigate(`/business/${id}`); // Assuming we will have a business detail page
  };

  const getCategoryIcon = (category: string) => {
    if (category === 'barbershop') return Scissors;
    return Sparkles;
  };

  const formatPriceRange = (range: { min: number; max: number }) => {
    if (range.min === range.max) return `$${range.min}`;
    return `$${range.min} - $${range.max}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(user ? (user.role === 'CLIENT' ? '/dashboard' : '/admin') : '/')}>
              <ChevronLeft className="size-4 mr-1" />
              Volver
            </Button>
            <h1 className="text-2xl font-semibold">Explorar Negocios</h1>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, servicio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1 md:max-w-xs">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <Input
                placeholder="Ciudad / Ubicación"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="size-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex gap-3 mt-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="barbershop">Barberías</SelectItem>
                <SelectItem value="salon">Salones</SelectItem>
                <SelectItem value="beauty">Belleza</SelectItem>
                <SelectItem value="spa">Spa</SelectItem>
                <SelectItem value="other">Otros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Mejor calificación</SelectItem>
                <SelectItem value="distance">Más cercanos</SelectItem>
                <SelectItem value="price">Precio</SelectItem>
                <SelectItem value="popularity">Populares</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="md:hidden mt-3 space-y-3 pb-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="barbershop">Barberías</SelectItem>
                  <SelectItem value="salon">Salones</SelectItem>
                  <SelectItem value="beauty">Belleza</SelectItem>
                  <SelectItem value="spa">Spa</SelectItem>
                  <SelectItem value="other">Otros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Mejor calificación</SelectItem>
                  <SelectItem value="distance">Más cercanos</SelectItem>
                  <SelectItem value="price">Precio</SelectItem>
                  <SelectItem value="popularity">Populares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4 text-sm text-neutral-600">
          {loading ? 'Buscando...' : `${businesses.length} negocios encontrados`}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => {
              const CategoryIcon = getCategoryIcon(business.category);

              return (
                <Card key={business.id} className="overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer" onClick={() => handleSelectBusiness(business.id)}>
                  <div className="relative h-48 flex-shrink-0">
                    <ImageWithFallback
                      src={business.coverImage || business.logo || 'https://via.placeholder.com/400'}
                      alt={business.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-neutral-900 shadow-sm">
                      <CategoryIcon className="size-3 mr-1" />
                      {business.category}
                    </Badge>
                  </div>

                  <CardContent className="p-4 flex flex-col flex-grow">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg leading-tight mb-1">{business.name}</h3>
                      {business.description && (
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{business.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3 text-sm text-neutral-600">
                      <div className="flex items-center gap-1">
                        <Star className="size-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-neutral-900">{business.rating.toFixed(1)}</span>
                        <span className="text-neutral-500">({business.totalReviews})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        <span>{business.distance ? `${business.distance.toFixed(1)} km` : '2.1 km'}</span>
                      </div>
                    </div>

                    <div className="mb-3 text-sm">
                      <span className="text-neutral-500 block mb-0.5 text-xs">Ubicación:</span>
                      <p className="font-medium text-neutral-800 line-clamp-1">{business.city}, {business.state}</p>
                    </div>

                    {business.isOpenNow ? (
                      <div className="mb-4">
                        <Badge className="bg-neutral-900 text-white hover:bg-neutral-800 font-medium">
                          Abierto ahora
                        </Badge>
                      </div>
                    ) : (
                      <div className="mb-4">
                        <Badge variant="secondary" className="font-medium">
                          Alta disponibilidad
                        </Badge>
                      </div>
                    )}

                    <div className="font-semibold text-neutral-900 mb-4">
                      {formatPriceRange(business.priceRange)}
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-3">
                      <Button
                        variant="default"
                        className="w-full bg-neutral-900 text-white hover:bg-neutral-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBusiness(business.id);
                        }}
                      >
                        <Calendar className="size-4 mr-2" />
                        Agendar
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-neutral-200 hover:bg-neutral-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectBusiness(business.id);
                        }}
                      >
                        Ver Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && businesses.length === 0 && (
          <div className="text-center py-16">
            <Search className="size-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron resultados</h3>
            <p className="text-neutral-600">
              Intenta ajustar tus filtros o buscar con otros términos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
