from django.urls import path
from .views import CurrentBusinessView, StoreListCreateView

urlpatterns = [
    path('', CurrentBusinessView.as_view(), name='current_business'),
    path('stores/', StoreListCreateView.as_view(), name='business_stores'),
]
