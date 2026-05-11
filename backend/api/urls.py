from django.urls import path
from .views import (
    CurrentUserView,
    TeamListCreateView,
    TeamDetailView,
    ProjectListCreateView,
    ProjectDetailView,
    GlobalNodeListCreateView,
    GlobalNodeDetailView,
    GlobalTagListCreateView,
    GlobalTagDetailView,
    NodeListCreateView,
    NodeDetailView,
    TagListCreateView,
    DocumentDetailView,
    CanvasDetailView,
    DocumentPageListCreateView,
    DocumentPageDetailView,
    NodeBulkDeleteView,
    NodeMoveView,
    NodeCopyView,
    NodeDuplicateView,
    NodeFavoritesView,
    TreeView
)

urlpatterns = [
    # Auth & Identity
    path('currentUser', CurrentUserView.as_view(), name='current-user'),
    path('me', CurrentUserView.as_view(), name='me'),

    # Teams
    path('teams', TeamListCreateView.as_view(), name='team-list-create'),
    path('teams/<str:team_id>', TeamDetailView.as_view(), name='team-detail'),

    # Projects
    path('projects', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<str:project_id>', ProjectDetailView.as_view(), name='project-detail'),

    # Global Resources (Compatibility with frontend)
    path('nodes', GlobalNodeListCreateView.as_view(), name='global-node-list-create'),
    path('nodes/<str:node_id>', GlobalNodeDetailView.as_view(), name='global-node-detail'),
    path('tags', GlobalTagListCreateView.as_view(), name='global-tag-list-create'),
    path('tags/<str:tag_id>', GlobalTagDetailView.as_view(), name='global-tag-detail'),
    path('documentPages', DocumentPageListCreateView.as_view(), name='document-page-list-create'),
    path('documentPages/<str:page_id>', DocumentPageDetailView.as_view(), name='document-page-detail'),

    # Nested Resources (As per spec.txt)
    path('projects/<str:project_id>/nodes', NodeListCreateView.as_view(), name='node-list-create'),
    path('projects/<str:project_id>/nodes/bulk-delete', NodeBulkDeleteView.as_view(), name='node-bulk-delete'),
    path('projects/<str:project_id>/nodes/move', NodeMoveView.as_view(), name='node-move'),
    path('projects/<str:project_id>/nodes/copy', NodeCopyView.as_view(), name='node-copy'),
    path('projects/<str:project_id>/nodes/duplicate', NodeDuplicateView.as_view(), name='node-duplicate'),
    path('projects/<str:project_id>/nodes/favorites', NodeFavoritesView.as_view(), name='node-favorites'),
    path('projects/<str:project_id>/nodes/<str:node_id>', NodeDetailView.as_view(), name='node-detail'),
    path('projects/<str:project_id>/tree', TreeView.as_view(), name='tree'),
    path('projects/<str:project_id>/tags', TagListCreateView.as_view(), name='tag-list-create'),
    path('projects/<str:project_id>/documents/<str:document_id>', DocumentDetailView.as_view(), name='document-detail'),
    path('projects/<str:project_id>/canvases/<str:canvas_id>', CanvasDetailView.as_view(), name='canvas-detail'),
]
