# 06 — Componentes compartidos
Layouts: PublicHeader, PublicFooter, RoleSidebar, RoleHeader, MobileNavigation, PageContainer, Breadcrumbs.  
UI: Button, Input, Select, Textarea, Checkbox, Badge, Card, Dialog, Drawer, Tabs, Table, Pagination.  
Commerce: ProductCard, ProductGrid, ProductGallery, PriceDisplay, QuantityInput, CartItem, OrderSummary.  
Feedback: Toast, Alert, Skeleton, EmptyState, ErrorState, LoadingState, ConfirmDialog.

Los componentes reciben props tipadas y callbacks; no conocen endpoints ni contienen reglas de negocio. Extraer abstracciones cuando exista repetición real.
