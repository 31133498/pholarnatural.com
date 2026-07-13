from fastapi import FastAPI
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import admin_auth, orders, products, services, bookings

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development (update for production!)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all headers
)

# Include our routers
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(services.router, prefix="/api/v1/services", tags=["Services"])
app.include_router(bookings.router, prefix="/api/v1/bookings", tags=["Bookings"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(admin_auth.router, prefix="/api/v1/admin", tags=["Admin Auth"])
app.include_router(products.router, prefix="/api/v1/admin/products", tags=["Admin Products"])
app.include_router(orders.router, prefix="/api/v1/admin/orders", tags=["Admin Orders"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Pholar Natural API"}