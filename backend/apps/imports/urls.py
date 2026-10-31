from django.urls import path
from .views import (
    MultiFilePreviewView,
    MultiFileCommitView,
    ImportHistoryView,
    TemplateDownloadView,
    SyncLocalDatasetsView,
    DatasetsStatusView,
    PurgeDatasetsView,
)

urlpatterns = [
    path('preview/', MultiFilePreviewView.as_view(), name='import_preview'),
    path('commit/', MultiFileCommitView.as_view(), name='import_commit'),
    path('history/', ImportHistoryView.as_view(), name='import_history'),
    path('templates/<str:dataset_type>/', TemplateDownloadView.as_view(), name='import_template'),
    path('sync-local/', SyncLocalDatasetsView.as_view(), name='import_sync_local'),
    path('status/', DatasetsStatusView.as_view(), name='import_status'),
    path('purge/', PurgeDatasetsView.as_view(), name='import_purge'),
]
