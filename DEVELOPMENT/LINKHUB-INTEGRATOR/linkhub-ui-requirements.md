# LinkHub UI Requirements - Sintesi

## 🎨 **Sistema di Design**
- **Framework**: Shadcn/UI (New York style)
- **Icone**: Lucide React
- **CSS Framework**: Tailwind CSS
- **Dark Mode**: Supportato con classe `.dark`
- **Tema**: Light-first (defaultTheme: "light")

## 🎨 **Palette Colori**

### **Colori Principali (HSL)**
```css
--primary: 221 83% 53%          /* Blu primario - #5A85FF */
--primary-foreground: 0 0% 98%  /* Bianco quasi puro */

--destructive: 0 84.2% 60.2%    /* Rosso - #EF4444 */
--destructive-foreground: 0 0% 98%

--background: 0 0% 100%         /* Bianco puro */
--foreground: 0 0% 3.9%         /* Nero quasi puro */

--muted: 0 0% 96.1%             /* Grigio chiarissimo */
--muted-foreground: 0 0% 45.1%  /* Grigio scuro */

--accent: 0 0% 96.1%            /* Grigio chiarissimo */
--accent-foreground: 0 0% 9%    /* Nero quasi puro */

--card: 0 0% 100%               /* Bianco puro */
--card-foreground: 0 0% 3.9%    /* Nero quasi puro */

--border: 0 0% 89.8%            /* Grigio bordi */
--input: 0 0% 89.8%             /* Grigio input */
--ring: 0 0% 3.9%               /* Nero per focus ring */
```

### **Colori Grafici**
```css
--chart-1: 12 76% 61%           /* Verde */
--chart-2: 173 58% 39%          /* Ciano */
--chart-3: 197 37% 24%          /* Blu scuro */
--chart-4: 43 74% 66%           /* Verde acqua */
--chart-5: 27 87% 67%           /* Verde lime */
```

### **Dark Mode**
- Sfondo: `0 0% 9%` (Nero scuro)
- Card: `0 0% 12%` (Nero leggermente più chiaro)
- Hover states più tenui con opacità ridotta

## 🔲 **Border Radius**
```css
--radius: 0.5rem                /* 8px - Radius base */
```
- **Large**: `var(--radius)` = 8px
- **Medium**: `calc(var(--radius) - 2px)` = 6px
- **Small**: `calc(var(--radius) - 4px)` = 4px

## 🔘 **Componenti UI**

### **Button**
```typescript
// Varianti disponibili
variant: {
  default: "bg-primary text-primary-foreground shadow hover:bg-primary/90"
  destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
  outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
  secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
  ghost: "hover:bg-accent hover:text-accent-foreground"
  link: "text-primary underline-offset-4 hover:underline"
}

// Dimensioni
size: {
  default: "h-9 px-4 py-2"
  sm: "h-8 rounded-md px-3 text-xs"
  lg: "h-10 rounded-md px-8"
  icon: "h-9 w-9"
}
```

### **Card**
```typescript
// Struttura
- rounded-xl border bg-card text-card-foreground shadow
- CardHeader: p-6, flex flex-col space-y-1.5
- CardTitle: font-semibold leading-none tracking-tight
- CardDescription: text-sm text-muted-foreground
- CardContent: p-6 pt-0
- CardFooter: flex items-center p-6 pt-0
```

### **Badge**
```typescript
// Varianti
variant: {
  default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80"
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
  destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80"
  outline: "text-foreground"
}

// Stile: rounded-md border px-2.5 py-0.5 text-xs font-semibold
```

## 📱 **Layout e Spaziature**

### **Sidebar**
- **Posizione**: Laterale sinistra
- **Larghezza**: Responsive (mobile: sheet overlay)
- **Colori**: Sfondo personalizzato con colori specifici
- **Icone**: Lucide React (Settings, User, Home, BarChart2, Users, etc.)

### **Dashboard**
- **Layout**: Card-based design
- **Spaziature**: Padding standard 6 (1.5rem)
- **Gap**: space-y-1.5 per header, gap-2 per elementi inline

### **Form Elements**
- **Input**: Border grigio, focus ring blu primario
- **Select**: Dropdown con hover states personalizzati
- **Textarea**: Stessa logica degli input
- **Checkbox/Switch**: Standard shadcn

## 🎯 **Pattern di Design**

### **Hover States**
- **Light Mode**: Opacità 90% per primary, 80% per secondary
- **Dark Mode**: Hover più tenui (20-24% lightness)
- **Select**: Background color specifico per selected/highlighted

### **Loading States**
- **Spinner**: `animate-spin rounded-full border-b-2 border-primary`
- **Skeleton**: Componenti skeleton per loading
- **Disabled**: `disabled:opacity-50 disabled:pointer-events-none`

### **Error States**
- **Alert**: Componente Alert con icone (AlertTriangle)
- **Toast**: Sistema toast con sonner
- **Validation**: Errori inline nei form

### **Navigation**
- **Breadcrumb**: Supportato
- **Tabs**: Componenti tabs standard
- **Pagination**: Controlli di paginazione

## 🔧 **Utilities Personalizzate**

### **Text Truncation**
```css
.line-clamp-2 { /* 2 righe */ }
.line-clamp-3 { /* 3 righe */ }
```

### **Theme Sync**
- **Provider**: EnhancedThemeProvider con sincronizzazione DB
- **Default**: Light mode
- **Force Mode**: Possibilità di forzare light mode

## 📊 **Grafici e Visualizzazioni**
- **Progress**: Barre di progresso
- **Charts**: Palette colori dedicata (5 colori)
- **Impact**: Calcoli e visualizzazioni specifiche per bonus/impact

## 🌍 **Internazionalizzazione**
- **Lingue**: Italiano (🇮🇹) e Inglese (🇬🇧)
- **Selector**: Popover con flag emoji
- **Routing**: Supporto i18n completo

## 🎨 **Stile Generale**
- **Clean**: Design pulito e minimale
- **Consistent**: Sistema coerente di spaziature e colori
- **Accessible**: Focus states e contrasti appropriati
- **Professional**: Look enterprise-grade
- **Modern**: Border radius arrotondati, ombre leggere
- **Responsive**: Mobile-first approach