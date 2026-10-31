from decimal import Decimal
from django.db.models import Sum, Count, F, Q
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from .models import Sale
from .serializers import SaleSerializer, RecordSaleSerializer


class SaleListCreateView(BusinessScopedMixin, generics.ListCreateAPIView):
    """
    List and record sales transactions for the business.
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RecordSaleSerializer
        return SaleSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['business'] = self.get_business()
        return context

    def get_queryset(self):
        qs = Sale.objects.filter(business=self.get_business()).select_related('product', 'store')

        store_id = self.request.query_params.get('store_id')
        if store_id:
            qs = qs.filter(store_id=store_id)

        category = self.request.query_params.get('category')
        if category and category != 'All':
            qs = qs.filter(product__category__iexact=category)

        start_date = self.request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(date__gte=start_date)

        end_date = self.request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(date__lte=end_date)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(transaction_id__icontains=search) |
                Q(product__name__icontains=search) |
                Q(product__sku__icontains=search)
            )

        return qs.order_by('-date', '-created_at')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            sale = serializer.save()
            return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SaleDetailView(BusinessScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a transaction receipt.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SaleSerializer
    queryset = Sale.objects.all()


class SalesSummaryView(BusinessScopedMixin, APIView):
    """
    Returns aggregated revenue, volume, and category metrics for the Sales page.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sales = Sale.objects.filter(business=self.get_business())

        store_id = request.query_params.get('store_id')
        if store_id:
            sales = sales.filter(store_id=store_id)

        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        total_units = sales.aggregate(total=Sum('quantity_sold'))['total'] or 0
        total_transactions = sales.count()
        avg_order_value = total_revenue / total_transactions if total_transactions > 0 else Decimal('0.00')

        # Sales by category
        category_breakdown = (
            sales.values('product__category')
            .annotate(revenue=Sum('total_amount'), units=Sum('quantity_sold'))
            .order_by('-revenue')
        )

        return Response({
            'total_revenue': total_revenue,
            'total_units_sold': total_units,
            'total_transactions': total_transactions,
            'average_order_value': round(avg_order_value, 2),
            'category_breakdown': list(category_breakdown),
        }, status=status.HTTP_200_OK)
