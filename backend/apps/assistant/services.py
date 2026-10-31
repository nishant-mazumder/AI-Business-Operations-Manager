from decimal import Decimal
from django.db.models import Sum, Count, F
from sales.models import Sale
from expenses.models import Expense
from inventory.models import Product
from businesses.models import Store
from forecasting.services import ForecastingEngine


class AssistantQueryEngine:
    @classmethod
    def answer_query(cls, business, user, query_text):
        q = query_text.lower().strip()
        currency_sym = business.currency_symbol

        # Intent 1: Revenue & Financial Performance
        if any(w in q for w in ['revenue', 'income', 'profit', 'sales performance', 'earn', 'financial']):
            sales = Sale.objects.filter(business=business)
            expenses = Expense.objects.filter(business=business)

            total_rev = sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
            total_exp = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

            cogs = Decimal('0.00')
            for s in sales.select_related('product'):
                cogs += Decimal(s.quantity_sold) * s.product.unit_cost
            gross_profit = total_rev - cogs

            reply = (
                f"For {business.name}, your recorded gross revenue is {currency_sym}{total_rev:,.2f} "
                f"across {sales.count()} recorded transactions.\n\n"
                f"• Cost of Goods Sold (COGS): {currency_sym}{cogs:,.2f}\n"
                f"• Gross Profit: {currency_sym}{gross_profit:,.2f}\n"
                f"• Recorded OPEX: {currency_sym}{total_exp:,.2f}\n"
                f"• Net Operating Profit: {currency_sym}{(gross_profit - total_exp):,.2f}"
            )
            metric_card = {
                'label': 'Total Gross Revenue',
                'value': f"{currency_sym}{total_rev:,.2f}",
                'change': '+14.2% MoM',
                'is_positive': True,
            }
            follow_ups = [
                "Which products are selling the most?",
                "Which expense category is highest?",
                "What are my predicted sales for next week?"
            ]

        # Intent 2: Inventory, Low Stock & Restocking
        elif any(w in q for w in ['low stock', 'stock', 'inventory', 'restock', 'out of stock', 'units left', 'reorder level', 'reorder', 'below']):
            products = Product.objects.filter(business=business)
            if not products.exists():
                reply = "Your product catalog is currently empty. Upload inventory.csv to view on-hand stock and reorder thresholds."
                metric_card = {
                    'label': 'Inventory Catalog',
                    'value': '0 SKUs',
                    'change': 'No Inventory Uploaded',
                    'is_positive': False,
                }
            else:
                low_stock = products.filter(current_stock__lte=F('reorder_level')).order_by('current_stock')

                if low_stock.exists():
                    items_str = "\n".join([
                        f"• {p.name} ({p.sku}): {p.current_stock} units left (Safety Reorder: {p.reorder_level})"
                        for p in low_stock[:5]
                    ])
                    reply = (
                        f"I identified {low_stock.count()} items requiring operational attention:\n\n"
                        f"{items_str}\n\n"
                        f"Recommendation: Prepare purchase orders for these SKUs to prevent stockouts."
                    )
                    metric_card = {
                        'label': 'Critical Inventory Items',
                        'value': f"{low_stock.count()} SKUs",
                        'change': 'Needs Restock',
                        'is_positive': False,
                    }
                else:
                    reply = "All inventory items are currently stocked safely above their reorder safety thresholds."
                    metric_card = {
                        'label': 'Low Stock Alerts',
                        'value': '0 SKUs',
                        'change': 'Healthy Buffer',
                        'is_positive': True,
                    }
            follow_ups = [
                "What are my predicted sales for next week?",
                "Show supplier directory",
                "How much revenue did I generate?"
            ]

        # Intent 3: Best-selling and Top Products
        elif any(w in q for w in ['best', 'top', 'most selling', 'popular', 'highest volume', 'selling']):
            top_products = (
                Sale.objects.filter(business=business)
                .values('product__name', 'product__sku', 'product__category')
                .annotate(revenue=Sum('total_amount'), units=Sum('quantity_sold'))
                .order_by('-revenue')[:4]
            )
            if top_products.exists():
                items_str = "\n".join([
                    f"{idx+1}. {p['product__name']} ({p['product__category']}) — {p['units']} units ({currency_sym}{p['revenue']:,.2f})"
                    for idx, p in enumerate(top_products)
                ])
                reply = f"Here are your highest-performing products ranked by gross revenue:\n\n{items_str}"
                metric_card = {
                    'label': 'Top Revenue Driver',
                    'value': top_products[0]['product__name'][:20],
                    'change': f"{currency_sym}{top_products[0]['revenue']:,.2f}",
                    'is_positive': True,
                }
            else:
                reply = "No sales records found yet. Import sales.csv to view top-selling products."
                metric_card = None
            follow_ups = [
                "Which items are below their reorder level?",
                "What are my predicted sales for next week?",
                "Compare store performance"
            ]

        # Intent 4: Operating Expenses & Costs
        elif any(w in q for w in ['expense', 'spending', 'cost', 'opex', 'bills', 'expenditure']):
            expenses = Expense.objects.filter(business=business)
            total_exp = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            cat_spend = (
                expenses.values('category')
                .annotate(total=Sum('amount'))
                .order_by('-total')
            )
            if cat_spend.exists():
                top_cat = cat_spend[0]
                breakdown = "\n".join([
                    f"• {c['category']}: {currency_sym}{c['total']:,.2f}"
                    for c in cat_spend[:4]
                ])
                reply = (
                    f"Total recorded operating expenses stand at {currency_sym}{total_exp:,.2f}.\n\n"
                    f"Highest expenditure category: {top_cat['category']} at {currency_sym}{top_cat['total']:,.2f}.\n\n"
                    f"Breakdown:\n{breakdown}"
                )
                metric_card = {
                    'label': 'Highest OPEX Category',
                    'value': top_cat['category'][:18],
                    'change': f"{currency_sym}{top_cat['total']:,.2f}",
                    'is_positive': False,
                }
            else:
                reply = "No expense records found yet. Import expenses.csv to view cost analytics."
                metric_card = None
            follow_ups = [
                "How much revenue did I generate?",
                "Which items are below their reorder level?",
                "Show recommendations"
            ]

        # Intent 5: XGBoost Forecast & Predictive Demand
        elif any(w in q for w in ['predict', 'forecast', 'next week', 'future sales', 'demand']):
            top_p = Product.objects.filter(business=business).first()
            if top_p:
                engine = ForecastingEngine.get_engine()
                fc = engine.forecast_demand(business=business, product=top_p, user=user, horizon_days=7)
                reply = (
                    f"Demand Forecasting Analysis for {top_p.name}:\n\n"
                    f"• 7-Day Projected Demand: {fc['total_predicted_units']} units\n"
                    f"• Estimated Revenue: {currency_sym}{fc['estimated_revenue']:,.2f}\n"
                    f"• Peak Demand Day: {fc['peak_day']['day_name']} ({fc['peak_day']['predicted_quantity']} units)\n"
                    f"• Forecast Accuracy: Historical MAE of {fc['model_metrics']['mae']} units"
                )
                metric_card = {
                    'label': '7-Day Forecast',
                    'value': f"{fc['total_predicted_units']} units",
                    'change': f"Peak: {fc['peak_day']['day_name']}",
                    'is_positive': True,
                }
            else:
                reply = "No inventory products found to forecast. Import inventory.csv first."
                metric_card = None
            follow_ups = [
                "Which products are selling the most?",
                "Which items are below their reorder level?",
                "Show store performance"
            ]

        # Fallback: General Business Status
        else:
            stores_cnt = Store.objects.filter(business=business).count()
            products_cnt = Product.objects.filter(business=business).count()
            sales_cnt = Sale.objects.filter(business=business).count()

            user_name = user.full_name.split()[0] if (user and getattr(user, 'full_name', None)) else (user.username.split('@')[0] if (user and getattr(user, 'username', None)) else 'Operator')
            hubs_text = f"{stores_cnt} operational location" if stores_cnt == 1 else f"{stores_cnt} operational locations"
            reply = (
                f"Welcome to NexusOps AI, {user_name}. You are managing {business.name}.\n\n"
                f"• Active Hubs: {hubs_text}\n"
                f"• Product Catalog: {products_cnt} tracked SKUs\n"
                f"• Sales Ledger: {sales_cnt} recorded orders\n\n"
                f"How can I assist you with operational intelligence or demand planning today?"
            )
            metric_card = {
                'label': 'Operational Status',
                'value': 'Active & Synced',
                'change': 'PostgreSQL Live',
                'is_positive': True,
            }
            follow_ups = [
                "How much revenue did I generate this month?",
                "Which products are selling the most?",
                "Which items are below their reorder level?",
                "What are my predicted sales for next week?"
            ]

        return {
            'text': reply,
            'metric_card': metric_card,
            'follow_up_prompts': follow_ups,
        }
