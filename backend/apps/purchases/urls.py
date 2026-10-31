from django.urls import path
from .views import (
    SupplierListCreateView,
    SupplierDetailView,
    PurchaseOrderListCreateView,
    PurchaseOrderDetailView,
)

urlpatterns = [
    path('suppliers/', SupplierListCreateView.as_view(), name='supplier_list_create'),
    path('suppliers/<int:pk>/', SupplierDetailView.as_view(), name='supplier_detail'),
    path('orders/', PurchaseOrderListCreateView.as_view(), name='po_list_create'),
    path('orders/<int:pk>/', PurchaseOrderDetailView.as_view(), name='po_detail'),
]
