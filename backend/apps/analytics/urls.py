from django.urls import path
from .views import (
    OverviewAnalyticsView,
    StorePerformanceView,
    SmartRecommendationsView,
)

urlpatterns = [
    path('overview/', OverviewAnalyticsView.as_view(), name='analytics_overview'),
    path('store-performance/', StorePerformanceView.as_view(), name='analytics_stores'),
    path('recommendations/', SmartRecommendationsView.as_view(), name='analytics_recommendations'),
]
