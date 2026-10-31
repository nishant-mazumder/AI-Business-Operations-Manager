"""
Main URL Configuration for NexusOps AI Business Operations Manager.
Versioned API namespace: /api/v1/
"""

from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # OpenAPI 3 Schema & Interactive Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # API v1 Namespaces
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/business/', include('businesses.urls')),
    path('api/v1/imports/', include('imports.urls')),
    path('api/v1/inventory/', include('inventory.urls')),
    path('api/v1/sales/', include('sales.urls')),
    path('api/v1/purchases/', include('purchases.urls')),
    path('api/v1/expenses/', include('expenses.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/forecasting/', include('forecasting.urls')),
    path('api/v1/assistant/', include('assistant.urls')),
]
