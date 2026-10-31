from django.urls import path
from .views import (
    ExpenseListCreateView,
    ExpenseDetailView,
    ExpenseSummaryView,
    ExpenseExportCsvView,
)

urlpatterns = [
    path('', ExpenseListCreateView.as_view(), name='expense_list_create'),
    path('<int:pk>/', ExpenseDetailView.as_view(), name='expense_detail'),
    path('summary/', ExpenseSummaryView.as_view(), name='expense_summary'),
    path('export/', ExpenseExportCsvView.as_view(), name='expense_export_csv'),
]
