from decimal import Decimal
from datetime import timedelta
from django.db.models import Sum, Count, F, Q, Avg
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from sales.models import Sale
from expenses.models import Expense
from inventory.models import Product
from businesses.models import Store


class OverviewAnalyticsView(BusinessScopedMixin, APIView):
    """
    Computes high-level business intelligence KPIs for the main Overview dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = self.get_business()
        sales_qs = Sale.objects.filter(business=business)
        expenses_qs = Expense.objects.filter(business=business)
        products_qs = Product.objects.filter(business=business)

        store_id = request.query_params.get('store_id')
        if store_id:
            sales_qs = sales_qs.filter(store_id=store_id)
            expenses_qs = expenses_qs.filter(store_id=store_id)
            products_qs = products_qs.filter(store_id=store_id)

        # Revenue and units
        total_revenue = sales_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        total_sales_units = sales_qs.aggregate(total=Sum('quantity_sold'))['total'] or 0
        total_transactions = sales_qs.count()

        # Cost of goods sold and gross profit
        # Gross profit = Revenue - COGS (quantity_sold * product.unit_cost)
        cogs = Decimal('0.00')
        for s in sales_qs.select_related('product'):
            cogs += Decimal(s.quantity_sold) * s.product.unit_cost

        gross_profit = total_revenue - cogs
        gross_margin_pct = round((gross_profit / total_revenue * 100), 1) if total_revenue > 0 else Decimal('0.0')

        # Total OPEX
        total_expenses = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        operating_profit = gross_profit - total_expenses

        # Inventory valuation
        inventory_value = sum((p.current_stock * p.unit_cost for p in products_qs), Decimal('0.00'))
        low_stock_count = products_qs.filter(current_stock__gt=0, current_stock__lte=F('reorder_level')).count()
        out_of_stock_count = products_qs.filter(current_stock__lte=0).count()

        # Recent 5 transactions
        recent_sales = [
            {
                'id': s.id,
                'transaction_id': s.transaction_id,
                'product_name': s.product.name,
                'date': s.date,
                'amount': s.total_amount,
                'payment_method': s.payment_method,
            }
            for s in sales_qs.select_related('product').order_by('-date', '-created_at')[:5]
        ]

        # Top 5 performing products
        top_products = (
            sales_qs.values('product__name', 'product__sku', 'product__category')
            .annotate(revenue=Sum('total_amount'), units=Sum('quantity_sold'))
            .order_by('-revenue')[:5]
        )

        return Response({
            'currency': business.currency,
            'currency_symbol': business.currency_symbol,
            'kpis': {
                'total_revenue': total_revenue,
                'total_units_sold': total_sales_units,
                'total_transactions': total_transactions,
                'total_expenses': total_expenses,
                'cogs': cogs,
                'gross_profit': gross_profit,
                'gross_margin_percentage': gross_margin_pct,
                'operating_profit': operating_profit,
                'inventory_value': inventory_value,
                'low_stock_products': low_stock_count,
                'out_of_stock_products': out_of_stock_count,
            },
            'recent_transactions': recent_sales,
            'top_products': list(top_products),
        }, status=status.HTTP_200_OK)


class StorePerformanceView(BusinessScopedMixin, APIView):
    """
    Returns store-by-store sales, units, and revenue matrix.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = self.get_business()
        stores = Store.objects.filter(business=business)
        total_rev = Sale.objects.filter(business=business).aggregate(total=Sum('total_amount'))['total'] or Decimal('1.00')

        store_stats = []
        for st in stores:
            s_sales = Sale.objects.filter(business=business, store=st)
            rev = s_sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            units = s_sales.aggregate(total=Sum('quantity_sold'))['total'] or 0
            txns = s_sales.count()
            share = round((rev / total_rev * 100), 1) if total_rev > 0 else 0.0

            store_stats.append({
                'store_id': st.id,
                'name': st.name,
                'city': st.city,
                'code': st.code,
                'revenue': rev,
                'units_sold': units,
                'transactions': txns,
                'revenue_share_pct': share,
            })

        return Response(store_stats, status=status.HTTP_200_OK)


class SmartRecommendationsView(BusinessScopedMixin, APIView):
    """
    Phase 9 — Actionable, explainable operational recommendations generated
    strictly from live PostgreSQL inventory, sales, and expense records.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = self.get_business()
        recommendations = []
        rec_id = 1

        # Rule 1: Low stock and stockout detection
        critical_stock = Product.objects.filter(
            business=business,
            current_stock__lte=F('reorder_level')
        ).select_related('supplier')

        for p in critical_stock[:4]:
            shortfall = max(1, p.reorder_level * 2 - p.current_stock)
            est_cost = Decimal(shortfall) * p.unit_cost
            priority = 'CRITICAL' if p.current_stock == 0 else 'HIGH'
            sup_name = p.supplier.name if p.supplier else 'Default Supplier'

            recommendations.append({
                'id': rec_id,
                'priority': priority,
                'category': 'Inventory & Restocking',
                'title': f"Restock {p.name} ({p.sku})",
                'detected': f"Current stock is {p.current_stock} units, below safety threshold of {p.reorder_level} units.",
                'why_it_matters': "Risk of stockout and lost customer sales during upcoming retail demand cycles.",
                'suggested_action': f"Issue Purchase Order for {shortfall} units to {sup_name} (Est. ₹{est_cost:,.2f}).",
                'metric_label': 'Units Needed',
                'metric_value': f"{shortfall} units",
                'created_at': timezone.now().strftime('%d %b %Y'),
                'is_completed': False,
            })
            rec_id += 1

        # Rule 2: Rising expense category detection
        expenses = Expense.objects.filter(business=business)
        cat_spend = (
            expenses.values('category')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )
        if cat_spend.exists():
            top_exp = cat_spend[0]
            recommendations.append({
                'id': rec_id,
                'priority': 'MEDIUM',
                'category': 'Expense Optimization',
                'title': f"Audit High OPEX: {top_exp['category']}",
                'detected': f"Total spend in {top_exp['category']} is ₹{top_exp['total']:,.2f}, representing the largest cost component.",
                'why_it_matters': "Operating profit margins are compressed by high facility and dispatch overheads.",
                'suggested_action': "Consolidate regional vendor contracts and review service level tier agreements.",
                'metric_label': 'Category Total',
                'metric_value': f"₹{top_exp['total']:,.2f}",
                'created_at': timezone.now().strftime('%d %b %Y'),
                'is_completed': False,
            })
            rec_id += 1

        # Rule 3: Top-selling demand velocity
        top_sold = (
            Sale.objects.filter(business=business)
            .values('product__name', 'product__sku')
            .annotate(revenue=Sum('total_amount'), units=Sum('quantity_sold'))
            .order_by('-units')
        )
        if top_sold.exists():
            best = top_sold[0]
            recommendations.append({
                'id': rec_id,
                'priority': 'OPPORTUNITY',
                'category': 'Sales Opportunity',
                'title': f"Capitalize on Demand for {best['product__name']}",
                'detected': f"{best['product__name']} is the #1 volume driver with {best['units']} units sold (₹{best['revenue']:,.2f}).",
                'why_it_matters': "High product affinity and inventory turn presents bundle and margin expansion opportunities.",
                'suggested_action': "Create promotional peripheral bundles and expand display prominence across flagship stores.",
                'metric_label': 'Units Sold',
                'metric_value': f"{best['units']} units",
                'created_at': timezone.now().strftime('%d %b %Y'),
                'is_completed': False,
            })

        return Response(recommendations, status=status.HTTP_200_OK)
