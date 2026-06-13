from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from .views import (
    RegisterView, LoginView, CurrentUserView, PasswordResetView, UserSearchView,
    ProjectListCreateView, ProjectDetailView, ProjectMemberListView, ProjectRoleViewSet,
    NodeListCreateView, NodeDetailView, DocumentDetailView, CanvasDetailView,
    DocumentPageListCreateView, DocumentPageDetailView, GlobalTagListCreateView, TreeView,
    KanbanBoardListCreateView, KanbanBoardDetailView
)

router = DefaultRouter()

urlpatterns = [
    # Auth & Identity Aliases for compatibility
    path('auth/register', RegisterView.as_view(), name='register'),
    path('auth/login', LoginView.as_view(), name='login'),
    path('auth/password-reset', PasswordResetView.as_view(), name='password-reset'),
    path('auth/me', CurrentUserView.as_view(), name='me-auth'),
    path('me', CurrentUserView.as_view(), name='me'),
    path('currentUser', CurrentUserView.as_view(), name='current-user'),
    path('users/search', UserSearchView.as_view(), name='user-search'),

    # Schema & Documentation
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Global Resources (for compatibility)
    path('teams', ProjectListCreateView.as_view(), name='teams-compat'),
    path('nodes', NodeListCreateView.as_view(), name='nodes-compat-list'),
    path('nodes/<str:node_id>', NodeDetailView.as_view(), name='nodes-compat-detail'),
    path('documentPages', DocumentPageListCreateView.as_view(), name='document-page-list-create'),
    path('documentPages/<str:page_id>', DocumentPageDetailView.as_view(), name='document-page-detail'),
    path('tags', GlobalTagListCreateView.as_view(), name='global-tag-list-create'),
    path('kanbanBoards', KanbanBoardListCreateView.as_view(), name='kanban-board-list-create'),
    path('kanbanBoards/<str:pk>', KanbanBoardDetailView.as_view(), name='kanban-board-detail'),

    # Projects
    path('projects', ProjectListCreateView.as_view(), name='project-list-create'),
    path('projects/<str:project_id>', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/<str:project_id>/members', ProjectMemberListView.as_view(), name='project-members'),
    path('projects/<str:project_id>/tree', TreeView.as_view(), name='tree'),
    
    # Roles (viewset)
    path('projects/<str:project_id>/roles', ProjectRoleViewSet.as_view({'get': 'list', 'post': 'create'}), name='project-roles'),
    path('projects/<str:project_id>/roles/<str:pk>', ProjectRoleViewSet.as_view({'get': 'retrieve', 'patch': 'partial_update', 'delete': 'destroy'}), name='project-role-detail'),

    # Nodes (nested in projects)
    path('projects/<str:project_id>/nodes', NodeListCreateView.as_view(), name='node-list-create'),
    path('projects/<str:project_id>/nodes/<str:node_id>', NodeDetailView.as_view(), name='node-detail'),
    
    # Content
    path('projects/<str:project_id>/documents/<str:document_id>', DocumentDetailView.as_view(), name='document-detail'),
    path('projects/<str:project_id>/canvases/<str:canvas_id>', CanvasDetailView.as_view(), name='canvas-detail'),
]
