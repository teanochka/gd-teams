import uuid
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Project, Team, Node, Tag, DocumentPage, CanvasDraft
from .serializers import (
    ProjectSerializer, TeamSerializer, NodeSerializer, 
    TagSerializer, DocumentPageSerializer, CanvasDraftSerializer
)

def get_query_param(request, *names, default=None):
    for name in names:
        value = request.query_params.get(name)
        if value is not None:
            return value
    return default

def parse_bool_query(value, default=False):
    if value is None:
        return default
    return str(value).lower() in ('1', 'true', 'yes')

def normalize_canvas_data(value):
    if isinstance(value, dict):
        return {
            'elements': value.get('elements') if isinstance(value.get('elements'), list) else [],
            'connections': value.get('connections') if isinstance(value.get('connections'), list) else [],
        }

    if isinstance(value, list):
        return {
            'elements': value,
            'connections': [],
        }

    return {
        'elements': [],
        'connections': [],
    }

def serialize_canvas_draft(draft, node):
    return {
        'id': draft.id,
        'nodeId': draft.node_id,
        'projectId': node.project_id,
        'data': normalize_canvas_data(draft.elements),
        'createdAt': node.created_at,
        'updatedAt': node.updated_at,
    }

# ----------------- Утилиты -----------------
def copy_node_recursive(node_id, new_parent_id, project_id, title_suffix=None):
    """
    Рекурсивно копирует узел и все его дочерние элементы.
    """
    try:
        node = Node.objects.get(id=node_id, project_id=project_id)
    except Node.DoesNotExist:
        return None

    # Копируем саму ноду
    new_node = Node.objects.get(id=node.id)
    new_node.pk = str(uuid.uuid4())
    new_node.id = new_node.pk
    new_node.parent_id = new_parent_id
    if title_suffix:
        new_node.title = f"{new_node.title} {title_suffix}"
    new_node.created_at = timezone.now()
    new_node.updated_at = timezone.now()
    new_node.save()

    # Копируем контент в зависимости от типа
    if new_node.type == 'document':
        try:
            page = DocumentPage.objects.get(node_id=node.id)
            page.pk = str(uuid.uuid4())
            page.id = page.pk
            page.node_id = new_node.id
            page.created_at = timezone.now()
            page.updated_at = timezone.now()
            page.save()
        except DocumentPage.DoesNotExist: pass
    elif new_node.type == 'canvas':
        try:
            draft = CanvasDraft.objects.get(node_id=node.id)
            draft.pk = str(uuid.uuid4())
            draft.id = draft.pk
            draft.node_id = new_node.id
            draft.save()
        except CanvasDraft.DoesNotExist: pass

    # Рекурсивно копируем дочерние элементы
    children = Node.objects.filter(parent_id=node.id)
    for child in children:
        # Для вложенных элементов суффикс "(Copy)" не добавляем
        copy_node_recursive(child.id, new_node.id, project_id)

    return new_node

# ----------------- Представления (Views) -----------------

class CurrentUserView(APIView):
    def get(self, request):
        return Response({
            'name': 'Вы', 'displayName': 'Вы', 'username': 'user',
            'user': {'name': 'Вы', 'displayName': 'Вы', 'username': 'user'}
        })

class TeamListCreateView(APIView):
    def get(self, request):
        teams = Team.objects.all()
        return Response(TeamSerializer(teams, many=True).data)

    def post(self, request):
        serializer = TeamSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeamDetailView(APIView):
    def get(self, request, team_id):
        try:
            team = Team.objects.get(id=team_id)
            return Response(TeamSerializer(team).data)
        except Team.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class ProjectListCreateView(APIView):
    def get(self, request):
        projects = Project.objects.all()
        return Response(ProjectSerializer(projects, many=True).data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectDetailView(APIView):
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            return Response(ProjectSerializer(project).data)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProjectSerializer(project, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, project_id):
        Project.objects.filter(id=project_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class GlobalNodeListCreateView(APIView):
    def get(self, request):
        project_id = get_query_param(request, 'projectId', 'project_id')
        is_deleted = parse_bool_query(
            get_query_param(request, 'isDeleted', 'is_deleted'),
            default=False,
        )
        is_favorite = get_query_param(request, 'isFavorite', 'is_favorite')
        
        query = {}
        if project_id: query['project_id'] = project_id
        query['is_deleted'] = is_deleted
        if parse_bool_query(is_favorite): query['is_favorite'] = True
        
        nodes = Node.objects.filter(**query)
        return Response(NodeSerializer(nodes, many=True).data)

    def post(self, request):
        serializer = NodeSerializer(data=request.data)
        if serializer.is_valid():
            node = serializer.save()
            if node.type == 'document':
                DocumentPage.objects.create(node_id=node.id, project_id=node.project_id, page={'name': node.title, 'blocks':[]})
            elif node.type == 'canvas':
                CanvasDraft.objects.create(node_id=node.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GlobalNodeDetailView(APIView):
    def get(self, request, node_id):
        try:
            node = Node.objects.get(id=node_id)
            return Response(NodeSerializer(node).data)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, node_id):
        try:
            node = Node.objects.get(id=node_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = NodeSerializer(node, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_at=timezone.now())
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, node_id):
        Node.objects.filter(id=node_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class DocumentPageListCreateView(APIView):
    def get(self, request):
        node_id = request.query_params.get('nodeId')
        query = {}
        if node_id: query['node_id'] = node_id
        
        pages = DocumentPage.objects.filter(**query)
        return Response(DocumentPageSerializer(pages, many=True).data)

    def post(self, request):
        serializer = DocumentPageSerializer(data=request.data)
        if serializer.is_valid():
            node_id = serializer.validated_data.get('node_id')
            existing = DocumentPage.objects.filter(node_id=node_id).first()
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
    def get(self, request):
        project_id = request.query_params.get('projectId')
        query = {}
        if project_id: query['project_id'] = project_id
        tags = Tag.objects.filter(**query)
        return Response(TagSerializer(tags, many=True).data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GlobalTagDetailView(APIView):
    def patch(self, request, tag_id):
        try:
            tag = Tag.objects.get(id=tag_id)
        except Tag.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = TagSerializer(tag, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, tag_id):
        Tag.objects.filter(id=tag_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class NodeListCreateView(APIView):
    def get(self, request, project_id):
        parent_id = get_query_param(request, 'parentId', 'parent_id')
        search = request.query_params.get('search')
        sort = request.query_params.get('sort', 'updated_at')
        order = request.query_params.get('order', 'desc')
        is_deleted = parse_bool_query(
            get_query_param(request, 'isDeleted', 'is_deleted'),
            default=False,
        )

        query = {'project_id': project_id, 'is_deleted': is_deleted}
        
        if parent_id is not None:
            if parent_id == 'root': query['parent_id__isnull'] = True
            else: query['parent_id'] = parent_id
        
        if search:
            query['title__icontains'] = search
            
        nodes = Node.objects.filter(**query)

        sort_prefix = '-' if order == 'desc' else ''
        if sort == 'updated': sort = 'updated_at'
        if sort == 'created': sort = 'created_at'
        if sort == 'name': sort = 'title'
        
        nodes = nodes.order_by(f"{sort_prefix}{sort}")
        return Response(NodeSerializer(nodes, many=True).data)

    def post(self, request, project_id):
        data = request.data.copy()
        data['projectId'] = project_id
        serializer = NodeSerializer(data=data)
        if serializer.is_valid():
            node = serializer.save()
            if node.type == 'document':
                DocumentPage.objects.create(node_id=node.id, project_id=node.project_id, page={'name': node.title, 'blocks':[]})
            elif node.type == 'canvas':
                CanvasDraft.objects.create(node_id=node.id)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NodeDetailView(APIView):
    def patch(self, request, project_id, node_id):
        try:
            node = Node.objects.get(id=node_id, project_id=project_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = NodeSerializer(node, data=request.data, partial=True)
        if serializer.is_valid():
            updated_node = serializer.save(updated_at=timezone.now())
            if serializer.validated_data.get('is_deleted', False):
                updated_node.deleted_at = timezone.now()
                updated_node.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, project_id, node_id):
        try:
            node = Node.objects.get(id=node_id, project_id=project_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        node.is_deleted = True
        node.deleted_at = timezone.now()
        node.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TagListCreateView(APIView):
    def get(self, request, project_id):
        tags = Tag.objects.filter(project_id=project_id)
        return Response(TagSerializer(tags, many=True).data)

    def post(self, request, project_id):
        data = request.data.copy()
        data['projectId'] = project_id
        serializer = TagSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentDetailView(APIView):
    def get(self, request, project_id, document_id):
        try:
            page = DocumentPage.objects.get(node_id=document_id)
            return Response(DocumentPageSerializer(page).data)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class CanvasDetailView(APIView):
    def get(self, request, project_id, canvas_id):
        try:
            node = Node.objects.get(id=canvas_id, project_id=project_id, type='canvas')
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        draft, _ = CanvasDraft.objects.get_or_create(node_id=canvas_id)
        return Response(serialize_canvas_draft(draft, node))

    def patch(self, request, project_id, canvas_id):
        try:
            node = Node.objects.get(id=canvas_id, project_id=project_id, type='canvas')
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        next_data = request.data.get('data', request.data)
        draft, _ = CanvasDraft.objects.get_or_create(node_id=canvas_id)
        draft.elements = normalize_canvas_data(next_data)
        draft.save()

        node.updated_at = timezone.now()
        node.updated_by = request.data.get('updatedBy', 'user')
        node.save()

        return Response(serialize_canvas_draft(draft, node))

class NodeBulkDeleteView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids',[])
        if not node_ids:
            return Response({'error': 'No node_ids provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        Node.objects.filter(id__in=node_ids, project_id=project_id).update(
            is_deleted=True, deleted_at=timezone.now()
        )
        return Response(status=status.HTTP_200_OK)

class NodeMoveView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids',[])
        target_parent_id = request.data.get('target_parent_id')
        
        if not node_ids:
            return Response({'error': 'No node_ids provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if target_parent_id and target_parent_id != 'root':
            if not Node.objects.filter(id=target_parent_id, project_id=project_id, type='folder').exists():
                return Response({'error': 'Target folder not found'}, status=status.HTTP_404_NOT_FOUND)
        
        actual_parent_id = None if target_parent_id == 'root' else target_parent_id
        Node.objects.filter(id__in=node_ids, project_id=project_id).update(
            parent_id=actual_parent_id, updated_at=timezone.now()
        )
        return Response(status=status.HTTP_200_OK)

class NodeCopyView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids',[])
        target_parent_id = request.data.get('target_parent_id')

        if not node_ids:
            return Response({'error': 'No node_ids provided'}, status=status.HTTP_400_BAD_REQUEST)

        actual_parent_id = None if target_parent_id == 'root' else target_parent_id
        if actual_parent_id:
            if not Node.objects.filter(id=actual_parent_id, project_id=project_id, type='folder').exists():
                return Response({'error': 'Target folder not found'}, status=status.HTTP_404_NOT_FOUND)

        copied_nodes =[]
        for nid in node_ids:
            # Вызываем рекурсивное копирование (прикрепляем "Copy" только к корню)
            node = copy_node_recursive(nid, actual_parent_id, project_id, title_suffix="(Copy)")
            if node:
                copied_nodes.append(node)

        return Response(NodeSerializer(copied_nodes, many=True).data, status=status.HTTP_201_CREATED)

class NodeDuplicateView(APIView):
    def post(self, request, project_id):
        node_id = request.data.get('node_id')
        original_node = Node.objects.filter(id=node_id, project_id=project_id).first()
        if not original_node:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        # Используем ту же функцию рекурсивного копирования
        copied_node = copy_node_recursive(node_id, original_node.parent_id, project_id, title_suffix="(Copy)")
        return Response(NodeSerializer(copied_node).data, status=status.HTTP_201_CREATED)

class NodeFavoritesView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids',[])
        is_favorite = request.data.get('is_favorite', True)
        
        Node.objects.filter(id__in=node_ids, project_id=project_id).update(
            is_favorite=is_favorite, updated_at=timezone.now()
        )
        return Response(status=status.HTTP_200_OK)

class TreeView(APIView):
    def get(self, request, project_id):
        parent_id = request.query_params.get('parent_id')
        query = {'project_id': project_id, 'type': 'folder', 'is_deleted': False}
        
        if parent_id == 'root':
            query['parent_id__isnull'] = True
        elif parent_id:
            query['parent_id'] = parent_id
            
        folders = Node.objects.filter(**query).order_by('title')
        return Response(NodeSerializer(folders, many=True).data)
