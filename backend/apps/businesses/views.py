from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Business, Store
from .serializers import BusinessSerializer, StoreSerializer
from .utils import get_user_business, BusinessScopedMixin


class CurrentBusinessView(APIView):
    """
    Retrieve and update the profile and operational settings of the current user's business.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        business = get_user_business(request.user)
        serializer = BusinessSerializer(business, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        business = get_user_business(request.user)
        serializer = BusinessSerializer(business, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        return self.patch(request)


class StoreListCreateView(BusinessScopedMixin, generics.ListCreateAPIView):
    """
    List and create physical stores for the active business.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StoreSerializer
    queryset = Store.objects.all()

    def perform_create(self, serializer):
        business = self.get_business()
        serializer.save(business=business)
