from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from businesses.utils import BusinessScopedMixin
from .services import AssistantQueryEngine


class AssistantQueryView(BusinessScopedMixin, APIView):
    """
    Handles natural language queries from the AI Business Assistant.
    Answers are computed strictly from real PostgreSQL business records.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '').strip()
        if not query:
            return Response({'error': 'Query text is required.'}, status=status.HTTP_400_BAD_REQUEST)

        business = self.get_business()
        result = AssistantQueryEngine.answer_query(
            business=business,
            user=request.user,
            query_text=query
        )
        return Response(result, status=status.HTTP_200_OK)
