# 🏥 Dashboard de Salud Ecuatorial

Sistema completo de gestión sanitaria para Guinea Ecuatorial que incluye gestión de profesionales de la salud, generación de carnets profesionales, análisis de estadísticas sanitarias y administración de centros de salud.

## 🚀 Características Principales

- 👥 **Gestión de Profesionales**: Registro, búsqueda y administración de profesionales de la salud
- 🎫 **Generación de Carnets**: Sistema automatizado de generación de carnets profesionales
- 📊 **Analytics Avanzados**: Dashboard con estadísticas sanitarias en tiempo real
- 🏥 **Gestión de Centros**: Administración de centros de salud y hospitales
- 📱 **Notificaciones SMS**: Sistema de notificaciones automáticas
- 🤖 **IA Integrada**: Chat con IA para análisis y consultas
- 🗺️ **Mapas Interactivos**: Visualización geográfica de datos sanitarios
- 🔐 **Sistema de Roles**: Control de acceso basado en roles

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/ui + Radix UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estado**: React Query + Context API
- **Navegación**: React Router DOM
- **Gráficos**: D3.js + Recharts
- **Mapas**: D3 Geo + React Simple Maps
- **Formularios**: React Hook Form + Zod

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd ecuatorial-health-dashboard
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp env.example .env.local
   # Editar .env.local con tus credenciales de Supabase
   ```

4. **Configurar MCP (opcional)**
   ```bash
   npm run setup-mcp
   ```

5. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

## 🌐 Despliegue

### Vercel (Recomendado)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Subir la carpeta dist/ a Netlify
```

### GitHub Pages
```bash
npm run build
npm run deploy
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes React
│   ├── dashboard/      # Componentes del dashboard
│   ├── registration/   # Componentes de registro
│   └── ui/            # Componentes base (Shadcn/ui)
├── hooks/             # Hooks personalizados
├── pages/             # Páginas principales
├── contexts/          # Contextos de React
├── integrations/      # Integraciones externas
├── types/             # Tipos de TypeScript
├── utils/             # Utilidades
└── lib/               # Librerías y configuraciones
```

## 🔧 Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run preview` - Vista previa de producción
- `npm run lint` - Linting del código
- `npm run setup-mcp` - Configuración del MCP

## 🗄️ Base de Datos

El proyecto utiliza Supabase con las siguientes tablas principales:

- `profesionales` - Información de profesionales
- `centros_salud` - Centros de salud
- `distritos_sanitarios` - Distritos sanitarios
- `solicitudes` - Solicitudes de carnet
- `documentos` - Documentos adjuntos
- `usuarios` - Usuarios del sistema
- `roles` - Roles y permisos

## 🔐 Autenticación

El sistema incluye un sistema de roles robusto:

- **SUPER_ADMINISTRADOR**: Acceso completo
- **ADMINISTRADOR**: Gestión de profesionales y centros
- **PROFESIONAL**: Acceso a su información personal
- **PUBLICO**: Búsqueda pública de profesionales

## 📊 Funcionalidades Principales

### Dashboard Administrativo
- Estadísticas en tiempo real
- Gráficos interactivos
- Gestión de usuarios
- Monitoreo de sistema

### Registro de Profesionales
- Formulario multi-paso
- Validación en tiempo real
- Subida de documentos
- Generación automática de carnets

### Búsqueda Pública
- Búsqueda por nombre, especialidad, centro
- Filtros avanzados
- Visualización en mapas
- Información detallada

### Analytics Avanzados
- Análisis por distrito
- Tendencias temporales
- Reportes ejecutivos
- Exportación de datos

## 🚨 Solución de Problemas

### Error de Puerto
Si el servidor no inicia, verifica que el puerto 5173 esté disponible:
```bash
# Cambiar puerto en vite.config.ts si es necesario
port: 5173
```

### Error de PowerShell
Si tienes problemas con npm en PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error de Conexión a Supabase
Verifica las variables de entorno en `.env.local`:
```bash
VITE_SUPABASE_URL=tu_url
VITE_SUPABASE_ANON_KEY=tu_clave
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al equipo de desarrollo
- Consultar la documentación de Supabase

## 🎯 Roadmap

- [ ] Implementación de testing completo
- [ ] Optimización de performance
- [ ] App móvil nativa
- [ ] Integración con sistemas externos
- [ ] Analytics más avanzados
- [ ] Sistema de notificaciones push

---

**Desarrollado con ❤️ para el sistema de salud de Guinea Ecuatorial** 