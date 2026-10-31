import csv
from decimal import Decimal
from django.http import HttpResponse
from django.db.models import Sum, Count, Q
from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseListCreateView(BusinessScopedMixin, generics.ListCreateAPIView):
    """
    List and record operating expenses.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer

    def get_queryset(self):
        qs = Expense.objects.filter(business=self.get_business()).select_related('store')

        category = self.request.query_params.get('category')
        if category and category != 'All':
            qs = qs.filter(category__iexact=category)

        store_id = self.request.query_params.get('store_id')
        if store_id:
            qs = qs.filter(store_id=store_id)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(vendor__icontains=search) |
                Q(description__icontains=search) |
                Q(category__icontains=search)
            )

        return qs.order_by('-date', '-created_at')


class ExpenseDetailView(BusinessScopedMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ExpenseSerializer
    queryset = Expense.objects.all()


class ExpenseSummaryView(BusinessScopedMixin, APIView):
    """
    Returns monthly expense aggregation, growth, and category breakdown.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        expenses = Expense.objects.filter(business=self.get_business())

        store_id = request.query_params.get('store_id')
        if store_id:
            expenses = expenses.filter(store_id=store_id)

        total_expenses = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Category breakdown
        category_breakdown = (
            expenses.values('category')
            .annotate(amount=Sum('amount'), count=Count('id'))
            .order_by('-amount')
        )

        largest_category = category_breakdown[0]['category'] if category_breakdown.exists() else 'N/A'

        return Response({
            'total_expenses': total_expenses,
            'largest_category': largest_category,
            'category_breakdown': list(category_breakdown),
        }, status=status.HTTP_200_OK)


class ExpenseExportCsvView(BusinessScopedMixin, APIView):
    """
    Export all business expense records to downloadable CSV.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        expenses = Expense.objects.filter(business=self.get_business()).select_related('store').order_by('-date')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="expenses_export.csv"'

        writer = csv.writer(response)
        writer.writerow(['Date', 'Category', 'Amount (INR)', 'Vendor', 'Store', 'Description', 'Receipt Ref'])

        for e in expenses:
            writer.writerow([
                e.date,
                e.category,
                e.amount,
                e.vendor,
                e.store.name if e.store else 'All Stores',
                e.description,
                e.receipt_reference,
            ])

        return response
