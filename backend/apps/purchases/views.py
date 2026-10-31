from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from .models import Supplier, PurchaseOrder
from .serializers import SupplierSerializer, PurchaseOrderSerializer


class SupplierListCreateView(BusinessScopedMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()


class SupplierDetailView(BusinessScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = SupplierSerializer
    queryset = Supplier.objects.all()


class PurchaseOrderListCreateView(BusinessScopedMixin, generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PurchaseOrderSerializer

    def get_queryset(self):
        qs = PurchaseOrder.objects.filter(business=self.get_business()).select_related('supplier').prefetch_related('items__product')
        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'All':
            qs = qs.filter(status__iexact=status_filter)
        return qs.order_by('-date', '-created_at')


class PurchaseOrderDetailView(BusinessScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PurchaseOrderSerializer
    queryset = PurchaseOrder.objects.all()
