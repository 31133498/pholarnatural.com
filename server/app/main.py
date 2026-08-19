from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes import admin_auth, orders, products, services, bookings, admin_bookings, admin_orders, admin_products, admin_services, admin_discounts, admin_variants, stripe_webhook

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development (update for production!)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Include our routers
app.include_router(stripe_webhook.router, prefix="/api/v1/webhooks/payments", tags=["Webhooks"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(services.router, prefix="/api/v1/services", tags=["Services"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(admin_auth.router, prefix="/api/v1/admin", tags=["Admin Auth"])
app.include_router(admin_products.router, prefix="/api/v1/admin/products", tags=["Admin Products"])
app.include_router(admin_orders.router, prefix="/api/v1/admin/orders", tags=["Admin Orders"])
app.include_router(admin_bookings.router, prefix="/api/v1/admin/bookings", tags=["Admin Bookings"])
app.include_router(admin_services.router, prefix="/api/v1/admin/services", tags=["Admin Services"])
app.include_router(admin_variants.router, prefix="/api/v1/admin/variants", tags=["Admin Variants"])
app.include_router(admin_discounts.router, prefix="/api/v1/admin/discounts", tags=["Admin Discounts"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Pholar Natural API"}