from decimal import Decimal
from django.db.models import Sum, F, Count, Q
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from .models import Product
from .serializers import ProductSerializer, StockAdjustmentSerializer


class ProductListCreateView(BusinessScopedMixin, generics.ListCreateAPIView):
    """
    List and create inventory products for the current business.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer

    def get_queryset(self):
        qs = Product.objects.filter(business=self.get_business())
        category = self.request.query_params.get('category')
        if category and category != 'All':
            qs = qs.filter(category__iexact=category)

        stock_status = self.request.query_params.get('status')
        if stock_status == 'low_stock':
            qs = qs.filter(current_stock__gt=0, current_stock__lte=F('reorder_level'))
        elif stock_status == 'out_of_stock':
            qs = qs.filter(current_stock__lte=0)
        elif stock_status == 'in_stock':
            qs = qs.filter(current_stock__gt=F('reorder_level'))

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))

        return qs.order_by('name')


class ProductDetailView(BusinessScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a product.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer
    queryset = Product.objects.all()


class ProductStockAdjustView(BusinessScopedMixin, APIView):
    """
    Quick stock adjustment (+/- units) with audit history.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, business=self.get_business())
        except Product.DoesNotExist:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = StockAdjustmentSerializer(data=request.data)
        if serializer.is_valid():
            change = serializer.validated_data['quantity_change']
            product.current_stock = max(0, product.current_stock + change)
            product.save(update_fields=['current_stock', 'updated_at'])
            return Response(ProductSerializer(product).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InventorySummaryView(BusinessScopedMixin, APIView):
    """
    Returns inventory KPI scorecard and category distribution.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(business=self.get_business())
        total_products = products.count()

        total_value = sum((p.current_stock * p.unit_cost for p in products), Decimal('0.00'))
        low_stock_count = products.filter(current_stock__gt=0, current_stock__lte=F('reorder_level')).count()
        out_of_stock_count = products.filter(current_stock__lte=0).count()

        # Category distribution
        categories = (
            products.values('category')
            .annotate(count=Count('id'), total_units=Sum('current_stock'))
            .order_by('-total_units')
        )

        return Response({
            'total_products': total_products,
            'total_inventory_value': total_value,
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'category_distribution': list(categories),
        }, status=status.HTTP_200_OK)
