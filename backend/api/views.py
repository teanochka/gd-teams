import uuid
from django.utils import timezone
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets, permissions
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User, Project, Team, Node, Tag, DocumentPage, CanvasDraft, ProjectRole, ProjectMember, KanbanBoard
from .serializers import (
    UserSerializer, ProjectSerializer, TeamSerializer, NodeSerializer, 
    TagSerializer, DocumentPageSerializer, CanvasDraftSerializer,
    ProjectRoleSerializer, ProjectMemberSerializer, KanbanBoardSerializer
)
from .permissions import check_permission, IsProjectMember

# ----------------- Auth -----------------

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        display_name = request.data.get('displayName', username)
        secret_word = request.data.get('secretWord')

        if not username or not password or not email:
            return Response({'error': 'Username, email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            display_name=display_name,
            secret_word=secret_word
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]

class UserSearchView(APIView):
    permission_classes = [permissions.AllowAny] # Временно для демо

    def get(self, request):
        query = request.query_params.get('query', '')
        if len(query) < 2:
            return Response([])
        
        users = User.objects.filter(
            Q(username__icontains=query) | Q(display_name__icontains=query)
        )[:10]
        return Response(UserSerializer(users, many=True).data)

class CurrentUserView(APIView):
    permission_classes = [permissions.AllowAny] # Для совместимости с анонимным фронтом

    def get(self, request):
        if not request.user.is_authenticated:
            # Возвращаем анонимного пользователя для фронтенда
            return Response({
                'id': 'anonymous',
                'username': 'anonymous',
                'display_name': 'Guest',
                'displayName': 'Guest',
                'name': 'Guest',
                'user': {'username': 'anonymous', 'display_name': 'Guest'}
            })
        serializer = UserSerializer(request.user)
        data = serializer.data
        # Совместимость с фронтендом: некоторые части ожидают вложенный объект user
        return Response({
            **data,
            'user': data,
            'displayName': data.get('display_name'),
            'name': data.get('display_name') or data.get('username')
        })

class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        secret_word = request.data.get('secretWord')
        new_password = request.data.get('newPassword')

        if not username or not secret_word or not new_password:
            return Response({'error': 'Username, secret word and new password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=username)
            if user.secret_word == secret_word: 
                user.set_password(new_password)
                user.save()
                return Response({'message': 'Password reset successful'})
            else:
                return Response({'error': 'Invalid secret word'}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

# ----------------- Projects & Members -----------------

class ProjectListCreateView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def get(self, request):
        if not request.user.is_authenticated:
            # Для анонимов (если разрешено) показываем всё
            return Response(ProjectSerializer(Project.objects.all(), many=True).data)
        
        # Только проекты пользователя
        memberships = ProjectMember.objects.filter(user=request.user)
        projects = [m.project for m in memberships]
        
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request):
        # Обработка legacy /teams POST (фронтенд сначала создает команду)
        if request.path.endswith('/teams'):
            # Просто возвращаем данные "команды", которые фронт хочет использовать
            return Response(request.data, status=status.HTTP_201_CREATED)

        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            owner = request.user if request.user.is_authenticated else None
            project = serializer.save(created_by=owner)
            if owner:
                ProjectMember.objects.create(user=owner, project=project, is_owner=True)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectDetailView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            return Response(ProjectSerializer(project).data)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            if request.user.is_authenticated and not check_permission(request.user, project, 'edit'):
                return Response(status=status.HTTP_403_FORBIDDEN)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            if request.user.is_authenticated and not check_permission(request.user, project, 'delete'):
                return Response(status=status.HTTP_403_FORBIDDEN)
            project.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class ProjectMemberListView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def get(self, request, project_id):
        members = ProjectMember.objects.filter(project_id=project_id)
        return Response(ProjectMemberSerializer(members, many=True).data)

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            if request.user.is_authenticated and not check_permission(request.user, project, 'manage_members'):
                return Response(status=status.HTTP_403_FORBIDDEN)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = ProjectMemberSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project=project)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectRoleViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectRoleSerializer
    permission_classes = [permissions.AllowAny] # Временно

    def get_queryset(self):
        return ProjectRole.objects.filter(project_id=self.kwargs['project_id'])

    def perform_create(self, serializer):
        project = Project.objects.get(id=self.kwargs['project_id'])
        if self.request.user.is_authenticated and not check_permission(self.request.user, project, 'manage_roles'):
            raise permissions.PermissionDenied()
        serializer.save(project=project)

# ----------------- Nodes -----------------

class NodeListCreateView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def get(self, request, project_id=None):
        parent_id = request.query_params.get('parentId')
        is_deleted = request.query_params.get('isDeleted') == 'true'

        # Если project_id не в URL, берем из query params
        actual_project_id = project_id or request.query_params.get('projectId')

        query = {'is_deleted': is_deleted}
        if actual_project_id:
            query['project_id'] = actual_project_id
        if parent_id:
            query['parent_id'] = parent_id

        nodes = Node.objects.filter(**query)
        return Response(NodeSerializer(nodes, many=True).data)

    def post(self, request, project_id=None):
        actual_project_id = project_id or request.data.get('projectId')
        try:
            project = Project.objects.get(id=actual_project_id)
            parent_id = request.data.get('parentId')
            if request.user.is_authenticated and not check_permission(request.user, project, 'create', node_id=parent_id):
                return Response(status=status.HTTP_403_FORBIDDEN)
        except Project.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        data['projectId'] = actual_project_id
        serializer = NodeSerializer(data=data)
        if serializer.is_valid():
            owner = request.user if request.user.is_authenticated else None
            node = serializer.save(created_by=owner, updated_by=owner)
            if node.type == 'document':
                DocumentPage.objects.create(node=node, project_id=node.project_id, page={'name': node.title, 'blocks':[]})
            elif node.type == 'canvas':
                CanvasDraft.objects.create(node=node)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentPageListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        node_id = request.query_params.get('nodeId')
        query = {}
        if node_id: query['node'] = node_id
        
        pages = DocumentPage.objects.filter(**query)
        return Response(DocumentPageSerializer(pages, many=True).data)

    def post(self, request):
        serializer = DocumentPageSerializer(data=request.data)
        if serializer.is_valid():
            node = serializer.validated_data.get('node')
            existing = DocumentPage.objects.filter(node=node).first()
            if existing:
                for field_name, value in serializer.validated_data.items():
                    setattr(existing, field_name, value)
                existing.updated_at = timezone.now()
                existing.save()
                return Response(DocumentPageSerializer(existing).data)

            page = serializer.save()
            return Response(DocumentPageSerializer(page).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentPageDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, page_id):
        try:
            page = DocumentPage.objects.get(id=page_id)
            return Response(DocumentPageSerializer(page).data)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, page_id):
        try:
            page = DocumentPage.objects.get(id=page_id)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = DocumentPageSerializer(page, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, page_id):
        DocumentPage.objects.filter(id=page_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class GlobalTagListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        project_id = request.query_params.get('projectId')
        query = {}
        if project_id: query['project'] = project_id
        tags = Tag.objects.filter(**query)
        return Response(TagSerializer(tags, many=True).data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TreeView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, project_id):
        parent_id = request.query_params.get('parent_id')
        query = {'project_id': project_id, 'type': 'folder', 'is_deleted': False}
        
        if parent_id == 'root':
            query['parent_id__isnull'] = True
        elif parent_id:
            query['parent_id'] = parent_id
            
        folders = Node.objects.filter(**query).order_by('title')
        return Response(NodeSerializer(folders, many=True).data)

class NodeDetailView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def patch(self, request, node_id, project_id=None):
        try:
            # Ищем узел только по ID, так как project_id может не быть в URL
            node = Node.objects.get(id=node_id)
            if request.user.is_authenticated and not check_permission(request.user, node.project, 'edit', node_id=node.id):
                return Response(status=status.HTTP_403_FORBIDDEN)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = NodeSerializer(node, data=request.data, partial=True)
        if serializer.is_valid():
            owner = request.user if request.user.is_authenticated else None
            serializer.save(updated_at=timezone.now(), updated_by=owner)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, node_id, project_id=None):
        try:
            node = Node.objects.get(id=node_id)
            if request.user.is_authenticated and not check_permission(request.user, node.project, 'delete', node_id=node.id):
                return Response(status=status.HTTP_403_FORBIDDEN)
            node.is_deleted = True
            node.deleted_at = timezone.now()
            node.save()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# ----------------- Document & Canvas -----------------

class DocumentDetailView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def get(self, request, project_id, document_id):
        try:
            node = Node.objects.get(id=document_id, project_id=project_id)
            page = DocumentPage.objects.get(node=node)
            return Response(DocumentPageSerializer(page).data)
        except (Node.DoesNotExist, DocumentPage.DoesNotExist):
            return Response(status=status.HTTP_404_NOT_FOUND)

class CanvasDetailView(APIView):
    permission_classes = [permissions.AllowAny] # Временно

    def get(self, request, project_id, canvas_id):
        try:
            node = Node.objects.get(id=canvas_id, project_id=project_id, type='canvas')
            draft, _ = CanvasDraft.objects.get_or_create(node=node)
            return Response(CanvasDraftSerializer(draft).data)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, project_id, canvas_id):
        try:
            node = Node.objects.get(id=canvas_id, project_id=project_id, type='canvas')
            if request.user.is_authenticated and not check_permission(request.user, node.project, 'edit', node_id=node.id):
                return Response(status=status.HTTP_403_FORBIDDEN)
            
            draft, _ = CanvasDraft.objects.get_or_create(node=node)
            serializer = CanvasDraftSerializer(draft, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                node.updated_at = timezone.now()
                owner = request.user if request.user.is_authenticated else None
                node.updated_by = owner
                node.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

# ----------------- Kanban Views -----------------

class KanbanBoardListCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        project_id = request.query_params.get('projectId')
        query = {}
        if project_id: query['project_id'] = project_id
        
        boards = KanbanBoard.objects.filter(**query)
        return Response(KanbanBoardSerializer(boards, many=True).data)

    def post(self, request):
        serializer = KanbanBoardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class KanbanBoardDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def patch(self, request, pk):
        try:
            board = KanbanBoard.objects.get(id=pk)
        except KanbanBoard.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = KanbanBoardSerializer(board, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
