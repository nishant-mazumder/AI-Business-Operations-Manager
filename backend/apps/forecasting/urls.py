from django.urls import path
from .views import GenerateForecastView, ForecastHistoryView

urlpatterns = [
    path('generate/', GenerateForecastView.as_view(), name='forecasting_generate'),
    path('history/', ForecastHistoryView.as_view(), name='forecasting_history'),
]
