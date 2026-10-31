from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from inventory.models import Product
from businesses.models import Store
from .models import ForecastRun
from .services import ForecastingEngine


class GenerateForecastView(BusinessScopedMixin, APIView):
    """
    Generate sales demand forecasts using the pre-trained XGBoost regression model.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        business = self.get_business()
        product_id = request.data.get('product_id')
        store_id = request.data.get('store_id')
        horizon_days = int(request.data.get('horizon_days', 7))

        if not product_id:
            # Fallback to the first available product in the business
            first_product = Product.objects.filter(business=business).first()
            if not first_product:
                return Response(
                    {'error': 'No products found. Please add or import inventory first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            product = first_product
        else:
            try:
                product = Product.objects.get(pk=product_id, business=business)
            except Product.DoesNotExist:
                return Response({'error': 'Product not found in this business.'}, status=status.HTTP_404_NOT_FOUND)

        store = None
        if store_id:
            store = Store.objects.filter(pk=store_id, business=business).first()

        try:
            engine = ForecastingEngine.get_engine()
            forecast_data = engine.forecast_demand(
                business=business,
                product=product,
                store=store,
                user=request.user,
                horizon_days=horizon_days,
            )
            return Response(forecast_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f"Forecasting failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ForecastHistoryView(BusinessScopedMixin, APIView):
    """
    Retrieve historical forecast execution runs.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        runs = (
            ForecastRun.objects.filter(business=self.get_business())
            .select_related('product', 'store')
            .order_by('-created_at')[:20]
        )

        history = [
            {
                'id': str(r.id),
                'product_name': r.product.name,
                'product_sku': r.product.sku,
                'store_name': r.store.name if r.store else 'All Stores',
                'horizon_days': r.horizon_days,
                'mae': r.mae,
                'rmse': r.rmse,
                'created_at': r.created_at,
            }
            for r in runs
        ]

        return Response(history, status=status.HTTP_200_OK)
