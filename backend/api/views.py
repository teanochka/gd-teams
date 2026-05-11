from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Project, Team, Node, Tag, DocumentPage, CanvasDraft
from .serializers import ProjectSerializer, TeamSerializer, NodeSerializer, TagSerializer, DocumentPageSerializer, CanvasDraftSerializer
import datetime

class CurrentUserView(APIView):
    def get(self, request):
        return Response({
            'name': 'Вы',
            'displayName': 'Вы',
            'username': 'user',
            'user': {
                'name': 'Вы',
                'displayName': 'Вы',
                'username': 'user'
            }
        })

class TeamListCreateView(APIView):
    def get(self, request):
        teams = Team.objects.all()
        data = []
        for t in teams:
            t_dict = t.to_mongo().to_dict()
            t_dict['id'] = str(t.id)
            data.append(t_dict)
        return Response(TeamSerializer(data, many=True).data)

    def post(self, request):
        serializer = TeamSerializer(data=request.data)
        if serializer.is_valid():
            team = Team(**serializer.validated_data)
            team.save()
            res_data = team.to_mongo().to_dict()
            res_data['id'] = str(team.id)
            return Response(TeamSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeamDetailView(APIView):
    def get(self, request, team_id):
        try:
            team = Team.objects.get(id=team_id)
            res_data = team.to_mongo().to_dict()
            res_data['id'] = str(team.id)
            return Response(TeamSerializer(res_data).data)
        except Team.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class ProjectListCreateView(APIView):
    def get(self, request):
        projects = Project.objects.all()
        data = []
        for p in projects:
            p_dict = p.to_mongo().to_dict()
            p_dict['id'] = str(p.id)
            data.append(p_dict)
        serializer = ProjectSerializer(data, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProjectSerializer(data=request.data)
        if serializer.is_valid():
            project_data = serializer.validated_data
            project = Project(**project_data)
            project.save()
            res_data = project.to_mongo().to_dict()
            res_data['id'] = str(project.id)
            return Response(ProjectSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ProjectDetailView(APIView):
    def get(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            res_data = project.to_mongo().to_dict()
            res_data['id'] = str(project.id)
            return Response(ProjectSerializer(res_data).data)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = ProjectSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for field_name, value in serializer.validated_data.items():
                setattr(project, field_name, value)
            project.updated_at = datetime.datetime.utcnow()
            project.save()
            res_data = project.to_mongo().to_dict()
            res_data['id'] = str(project.id)
            return Response(ProjectSerializer(res_data).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
            project.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Project.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class GlobalNodeListCreateView(APIView):
    def get(self, request):
        project_id = request.query_params.get('projectId')
        is_deleted = request.query_params.get('is_deleted', 'false').lower() == 'true'
        is_favorite = request.query_params.get('is_favorite')
        
        query = {}
        if project_id: query['project_id'] = project_id
        if is_deleted is not None: query['is_deleted'] = is_deleted
        if is_favorite == 'true': query['is_favorite'] = True
        
        nodes = Node.objects(**query)
        data = []
        for n in nodes:
            n_dict = n.to_mongo().to_dict()
            n_dict['id'] = str(n.id)
            data.append(n_dict)
        return Response(NodeSerializer(data, many=True).data)

    def post(self, request):
        serializer = NodeSerializer(data=request.data)
        if serializer.is_valid():
            node = Node(**serializer.validated_data)
            node.save()
            if node.type == 'document':
                DocumentPage(node_id=str(node.id), project_id=node.project_id, page={'name': node.title, 'blocks': []}).save()
            elif node.type == 'canvas':
                CanvasDraft(node_id=str(node.id)).save()
            
            res_data = node.to_mongo().to_dict()
            res_data['id'] = str(node.id)
            return Response(NodeSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GlobalNodeDetailView(APIView):
    def get(self, request, node_id):
        try:
            node = Node.objects.get(id=node_id)
            res_data = node.to_mongo().to_dict()
            res_data['id'] = str(node.id)
            return Response(NodeSerializer(res_data).data)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, node_id):
        try:
            node = Node.objects.get(id=node_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = NodeSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for attr, value in serializer.validated_data.items():
                setattr(node, attr, value)
            node.updated_at = datetime.datetime.utcnow()
            node.save()
            res_data = node.to_mongo().to_dict()
            res_data['id'] = str(node.id)
            return Response(NodeSerializer(res_data).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, node_id):
        try:
            node = Node.objects.get(id=node_id)
            node.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class DocumentPageListCreateView(APIView):
    def get(self, request):
        node_id = request.query_params.get('nodeId')
        query = {}
        if node_id: query['node_id'] = node_id
        
        pages = DocumentPage.objects(**query)
        data = []
        for p in pages:
            p_dict = p.to_mongo().to_dict()
            p_dict['id'] = str(p.id)
            data.append(p_dict)
        return Response(DocumentPageSerializer(data, many=True).data)

    def post(self, request):
        serializer = DocumentPageSerializer(data=request.data)
        if serializer.is_valid():
            # Check if page already exists for this nodeId
            node_id = serializer.validated_data.get('node_id')
            existing = DocumentPage.objects(node_id=node_id).first()
            if existing:
                for field_name, value in serializer.validated_data.items():
                    setattr(existing, field_name, value)
                existing.updated_at = datetime.datetime.utcnow()
                existing.save()
                res_data = existing.to_mongo().to_dict()
                res_data['id'] = str(existing.id)
                return Response(DocumentPageSerializer(res_data).data)

            page = DocumentPage(**serializer.validated_data)
            page.save()
            res_data = page.to_mongo().to_dict()
            res_data['id'] = str(page.id)
            return Response(DocumentPageSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentPageDetailView(APIView):
    def get(self, request, page_id):
        try:
            page = DocumentPage.objects.get(id=page_id)
            res_data = page.to_mongo().to_dict()
            res_data['id'] = str(page.id)
            return Response(DocumentPageSerializer(res_data).data)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, page_id):
        try:
            page = DocumentPage.objects.get(id=page_id)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = DocumentPageSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for field_name, value in serializer.validated_data.items():
                setattr(page, field_name, value)
            page.updated_at = datetime.datetime.utcnow()
            page.save()
            res_data = page.to_mongo().to_dict()
            res_data['id'] = str(page.id)
            return Response(DocumentPageSerializer(res_data).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, page_id):
        try:
            page = DocumentPage.objects.get(id=page_id)
            page.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class GlobalTagListCreateView(APIView):
    def get(self, request):
        project_id = request.query_params.get('projectId')
        query = {}
        if project_id: query['project_id'] = project_id
        
        tags = Tag.objects(**query)
        data = []
        for t in tags:
            t_dict = t.to_mongo().to_dict()
            t_dict['id'] = str(t.id)
            data.append(t_dict)
        return Response(TagSerializer(data, many=True).data)

    def post(self, request):
        serializer = TagSerializer(data=request.data)
        if serializer.is_valid():
            tag = Tag(**serializer.validated_data)
            tag.save()
            res_data = tag.to_mongo().to_dict()
            res_data['id'] = str(tag.id)
            return Response(TagSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GlobalTagDetailView(APIView):
    def patch(self, request, tag_id):
        try:
            tag = Tag.objects.get(id=tag_id)
        except Tag.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        serializer = TagSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            for attr, value in serializer.validated_data.items():
                setattr(tag, attr, value)
            tag.save()
            res_data = tag.to_mongo().to_dict()
            res_data['id'] = str(tag.id)
            return Response(TagSerializer(res_data).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, tag_id):
        try:
            tag = Tag.objects.get(id=tag_id)
            tag.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Tag.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class NodeListCreateView(APIView):
    def get(self, request, project_id):
        parent_id = request.query_params.get('parent_id', None)
        search = request.query_params.get('search', None)
        sort = request.query_params.get('sort', 'updated_at')
        order = request.query_params.get('order', 'desc')
        is_deleted = request.query_params.get('is_deleted', 'false').lower() == 'true'

        query = {'project_id': project_id, 'is_deleted': is_deleted}
        if parent_id is not None:
            if parent_id == 'root':
                query['parent_id'] = None
            else:
                query['parent_id'] = parent_id
        
        if search:
            nodes = Node.objects(__raw__={'$and': [query, {'title': {'$regex': search, '$options': 'i'}}]})
        else:
            nodes = Node.objects(**query)

        sort_prefix = '-' if order == 'desc' else ''
        if sort == 'updated': sort = 'updated_at'
        if sort == 'created': sort = 'created_at'
        if sort == 'name': sort = 'title'
        
        nodes = nodes.order_by(f"{sort_prefix}{sort}")

        data = []
        for n in nodes:
            n_dict = n.to_mongo().to_dict()
            n_dict['id'] = str(n.id)
            data.append(n_dict)
        
        serializer = NodeSerializer(data, many=True)
        return Response(serializer.data)

    def post(self, request, project_id):
        data = request.data.copy()
        data['project_id'] = project_id
        serializer = NodeSerializer(data=data)
        if serializer.is_valid():
            node = Node(**serializer.validated_data)
            node.save()
            if node.type == 'document':
                DocumentPage(node_id=str(node.id), project_id=node.project_id, page={'name': node.title, 'blocks': []}).save()
            elif node.type == 'canvas':
                CanvasDraft(node_id=str(node.id)).save()
            
            res_data = node.to_mongo().to_dict()
            res_data['id'] = str(node.id)
            return Response(NodeSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class NodeDetailView(APIView):
    def patch(self, request, project_id, node_id):
        try:
            node = Node.objects.get(id=node_id, project_id=project_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        data = request.data
        if 'title' in data:
            node.title = data['title']
        if 'parent_id' in data:
            node.parent_id = data['parent_id']
        if 'is_favorite' in data:
            node.is_favorite = data['is_favorite']
        if 'is_deleted' in data:
            node.is_deleted = data['is_deleted']
            if node.is_deleted:
                node.deleted_at = datetime.datetime.utcnow()
        
        node.updated_at = datetime.datetime.utcnow()
        node.save()
        
        res_data = node.to_mongo().to_dict()
        res_data['id'] = str(node.id)
        return Response(NodeSerializer(res_data).data)

    def delete(self, request, project_id, node_id):
        try:
            node = Node.objects.get(id=node_id, project_id=project_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        node.is_deleted = True
        node.deleted_at = datetime.datetime.utcnow()
        node.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class TagListCreateView(APIView):
    def get(self, request, project_id):
        tags = Tag.objects(project_id=project_id)
        data = []
        for t in tags:
            t_dict = t.to_mongo().to_dict()
            t_dict['id'] = str(t.id)
            data.append(t_dict)
        return Response(TagSerializer(data, many=True).data)

    def post(self, request, project_id):
        data = request.data.copy()
        data['project_id'] = project_id
        serializer = TagSerializer(data=data)
        if serializer.is_valid():
            tag = Tag(**serializer.validated_data)
            tag.save()
            res_data = tag.to_mongo().to_dict()
            res_data['id'] = str(tag.id)
            return Response(TagSerializer(res_data).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DocumentDetailView(APIView):
    def get(self, request, project_id, document_id):
        try:
            page = DocumentPage.objects.get(node_id=document_id)
            data = page.to_mongo().to_dict()
            data['id'] = str(page.id)
            return Response(DocumentPageSerializer(data).data)
        except DocumentPage.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class CanvasDetailView(APIView):
    def get(self, request, project_id, canvas_id):
        try:
            draft = CanvasDraft.objects.get(node_id=canvas_id)
            data = draft.to_mongo().to_dict()
            data['id'] = str(draft.id)
            return Response(CanvasDraftSerializer(data).data)
        except CanvasDraft.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class NodeBulkDeleteView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids', [])
        if not node_ids:
            return Response({'error': 'No node_ids provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        Node.objects(id__in=node_ids, project_id=project_id).update(
            set__is_deleted=True,
            set__deleted_at=datetime.datetime.utcnow()
        )
        return Response(status=status.HTTP_200_OK)

class NodeMoveView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids', [])
        target_parent_id = request.data.get('target_parent_id')
        
        if not node_ids:
            return Response({'error': 'No node_ids provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        if target_parent_id and target_parent_id != 'root':
            try:
                Node.objects.get(id=target_parent_id, project_id=project_id, type='folder')
            except Node.DoesNotExist:
                return Response({'error': 'Target folder not found'}, status=status.HTTP_404_NOT_FOUND)
        
        actual_parent_id = None if target_parent_id == 'root' else target_parent_id
        Node.objects(id__in=node_ids, project_id=project_id).update(
            set__parent_id=actual_parent_id,
            set__updated_at=datetime.datetime.utcnow()
        )
        return Response(status=status.HTTP_200_OK)

class NodeCopyView(APIView):
    def post(self, request, project_id):
        return Response({'message': 'Copy not fully implemented for folders'}, status=status.HTTP_501_NOT_IMPLEMENTED)

class NodeDuplicateView(APIView):
    def post(self, request, project_id):
        node_id = request.data.get('node_id')
        try:
            node = Node.objects.get(id=node_id, project_id=project_id)
        except Node.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        
        new_node = Node(
            project_id=node.project_id,
            parent_id=node.parent_id,
            type=node.type,
            title=f"{node.title} (Copy)",
            icon=node.icon,
            tag_ids=node.tag_ids
        )
        new_node.save()
        
        if node.type == 'document':
            try:
                page = DocumentPage.objects.get(node_id=str(node.id))
                DocumentPage(node_id=str(new_node.id), project_id=new_node.project_id, page=page.page).save()
            except DocumentPage.DoesNotExist: pass
        elif node.type == 'canvas':
            try:
                draft = CanvasDraft.objects.get(node_id=str(node.id))
                CanvasDraft(node_id=str(new_node.id), elements=draft.elements).save()
            except CanvasDraft.DoesNotExist: pass
            
        res_data = new_node.to_mongo().to_dict()
        res_data['id'] = str(new_node.id)
        return Response(NodeSerializer(res_data).data, status=status.HTTP_201_CREATED)

class NodeFavoritesView(APIView):
    def post(self, request, project_id):
        node_ids = request.data.get('node_ids', [])
        is_favorite = request.data.get('is_favorite', True)
        
        Node.objects(id__in=node_ids, project_id=project_id).update(
            set__is_favorite=is_favorite,
            set__updated_at=datetime.datetime.utcnow()
        )
        return Response(status=status.HTTP_200_OK)

class TreeView(APIView):
    def get(self, request, project_id):
        parent_id = request.query_params.get('parent_id', None)
        query = {'project_id': project_id, 'type': 'folder', 'is_deleted': False}
        if parent_id == 'root':
            query['parent_id'] = None
        elif parent_id:
            query['parent_id'] = parent_id
            
        folders = Node.objects(**query).order_by('title')
        data = []
        for f in folders:
            f_dict = f.to_mongo().to_dict()
            f_dict['id'] = str(f.id)
            data.append(f_dict)
            
        return Response(NodeSerializer(data, many=True).data)
