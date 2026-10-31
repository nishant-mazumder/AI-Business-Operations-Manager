from django.urls import path
from .views import (
    ProductListCreateView,
    ProductDetailView,
    ProductStockAdjustView,
    InventorySummaryView,
)

urlpatterns = [
    path('products/', ProductListCreateView.as_view(), name='product_list_create'),
    path('products/<int:pk>/', ProductDetailView.as_view(), name='product_detail'),
    path('products/<int:pk>/adjust-stock/', ProductStockAdjustView.as_view(), name='product_stock_adjust'),
    path('summary/', InventorySummaryView.as_view(), name='inventory_summary'),
]
