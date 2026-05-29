import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import {
  Menu,
  Search,
  Bell,
  User,
  Settings,
  LogOut,
  Mountain,
  Compass,
  Route,
  MapPin,
  Calendar,
  TrendingUp,
  Trophy,
  Plus,
  Upload,
  Download,
  Check,
  AlertTriangle,
  Star,
  Users,
} from '@/components/icons';

export default function StyleguideNeverDeploy() {
  const colors = [
    { name: 'primary', hex: '#8ED081' },
    { name: 'surface', hex: '#37392E' },
    { name: 'on-surface', hex: '#f9f9f8' },
    { name: 'surface-variant', hex: '#4b4d42' },
    { name: 'surface-dim', hex: '#25261e' },
    { name: 'surface-container', hex: '#41443a' },
    { name: 'surface-container-high', hex: '#4d5045' },
    { name: 'surface-container-low', hex: '#2a2c22' },
    { name: 'surface-container-highest', hex: '#4b4d42' },
    { name: 'primary-container', hex: '#4b4d42' },
    { name: 'on-surface-variant', hex: '#CBD6D2' },
    { name: 'outline', hex: '#8ED081' },
    { name: 'outline-variant', hex: '#5c5e53' },
    { name: 'error', hex: '#ff5252' },
    { name: 'on-error', hex: '#ffffff' },
    { name: 'tertiary-container', hex: '#b63f75' },
  ];

  const buttonVariants = ['primary', 'secondary', 'danger', 'warning', 'outline', 'ghost'] as const;
  const buttonSizes = ['sm', 'md', 'lg', 'icon'] as const;
  const badgeVariants = ['primary', 'secondary', 'success', 'error', 'warning', 'outline'] as const;

  const icons = [
    { name: 'Menu', Component: Menu },
    { name: 'Search', Component: Search },
    { name: 'Bell', Component: Bell },
    { name: 'User', Component: User },
    { name: 'Settings', Component: Settings },
    { name: 'LogOut', Component: LogOut },
    { name: 'Mountain', Component: Mountain },
    { name: 'Compass', Component: Compass },
    { name: 'Route', Component: Route },
    { name: 'MapPin', Component: MapPin },
    { name: 'Calendar', Component: Calendar },
    { name: 'TrendingUp', Component: TrendingUp },
    { name: 'Trophy', Component: Trophy },
    { name: 'Plus', Component: Plus },
    { name: 'Upload', Component: Upload },
    { name: 'Download', Component: Download },
    { name: 'Check', Component: Check },
    { name: 'AlertTriangle', Component: AlertTriangle },
    { name: 'Star', Component: Star },
    { name: 'Users', Component: Users },
  ];

  return (
    <div className="min-h-screen bg-surface text-on-surface p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="font-display text-5xl uppercase tracking-tighter text-primary">TRUP Design System</h1>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colors.map((color) => (
              <div key={color.name} className="flex flex-col gap-2">
                <div
                  className="w-full h-20 border border-outline-variant/30"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {color.name}
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant">{color.hex}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Typography</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-sm text-on-surface-variant uppercase tracking-widest mb-2">
                Display (Bebas Neue)
              </h3>
              <div className="font-display text-5xl uppercase tracking-tighter text-primary mb-2">HEADING EXTRA LARGE</div>
              <div className="font-display text-3xl uppercase tracking-tighter mb-2">Heading Large</div>
              <div className="font-display text-2xl uppercase tracking-tighter mb-2">Heading Medium</div>
              <div className="font-display text-lg uppercase tracking-tighter">Heading Small</div>
            </div>
            <div>
              <h3 className="font-display text-sm text-on-surface-variant uppercase tracking-widest mb-2">
                Body (Inter)
              </h3>
              <div className="text-base font-normal mb-2">Regular body text at base size</div>
              <div className="text-sm mb-2">Small body text for secondary content</div>
              <div className="text-xs mb-2">Tiny body text for captions and labels</div>
              <div className="text-[10px] font-bold uppercase tracking-widest">Label Bold</div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Buttons</h2>

          {buttonVariants.map((variant) => (
            <div key={variant} className="space-y-4">
              <h3 className="font-bold uppercase tracking-widest text-on-surface-variant text-sm">{variant}</h3>
              <div className="flex gap-2 flex-wrap">
                {buttonSizes.map((size) => (
                  <Button key={`${variant}-${size}`} variant={variant as any} size={size as any}>
                    Button
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <div>
                  <Button variant={variant as any} isLoading>
                    Loading
                  </Button>
                </div>
                <div>
                  <Button variant={variant as any} leftIcon={<Plus className="w-4 h-4" />}>
                    With Left Icon
                  </Button>
                </div>
                <div>
                  <Button variant={variant as any} rightIcon={<Download className="w-4 h-4" />}>
                    With Right Icon
                  </Button>
                </div>
                <div>
                  <Button variant={variant as any} fullWidth>
                    Full Width Button
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Badges</h2>
          <div className="space-y-4">
            {badgeVariants.map((variant) => (
              <div key={variant} className="flex gap-2 items-center">
                <span className="text-on-surface-variant text-xs font-bold uppercase tracking-widest w-20">
                  {variant}
                </span>
                <Badge variant={variant as any}>Badge Label</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Cards</h2>
          <Card>
            <CardHeader>
              <CardDescription>Card Label</CardDescription>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>
              This is a card with header, content, and footer. It demonstrates the typical structure used throughout
              the application.
            </CardContent>
            <CardFooter>
              <Button variant="primary" size="sm">
                Action
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Skeletons</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <EmptyState
              icon={<Mountain className="w-12 h-12" />}
              title="No Events Found"
              description="No hiking events match your current filters. Try adjusting your search criteria."
              action={<Button variant="outline">Clear Filters</Button>}
            />
            <ErrorState
              icon={<AlertTriangle className="w-12 h-12" />}
              title="Failed to Load"
              description="Something went wrong while loading the data. Please try again later."
              action={<Button variant="danger">Retry</Button>}
            />
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="font-display text-3xl uppercase tracking-tighter">Icons</h2>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-4">
            {icons.map(({ name, Component }) => (
              <div key={name} className="flex flex-col items-center gap-2 p-2 border border-outline-variant/30">
                <Component className="w-6 h-6 text-primary" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant text-center">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
