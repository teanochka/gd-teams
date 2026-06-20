from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import User, Project, Node, CanvasPage, Tag

class CanvasPageAPITests(APITestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(username='testuser', password='password123')
        # Create a project
        self.project = Project.objects.create(
            id='test-project',
            title='Test Project',
            created_by=self.user
        )
        # Create a canvas node
        self.canvas_node = Node.objects.create(
            id='test-canvas-node',
            project=self.project,
            type='canvas',
            title='My Canvas',
            created_by=self.user
        )
        # Create a canvas page associated with the node
        self.canvas_page = CanvasPage.objects.create(
            id='test-canvas-page',
            node=self.canvas_node,
            project_id=self.project.id,
            data={'elements': [{'id': 'el1', 'type': 'rect', 'x': 10, 'y': 20}], 'connections': []}
        )

    def test_get_canvas_pages_by_node_id(self):
        url = reverse('canvas-page-list-create')
        response = self.client.get(url, {'nodeId': self.canvas_node.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], 'test-canvas-page')
        self.assertEqual(response.data[0]['nodeId'], self.canvas_node.id)

    def test_create_canvas_page(self):
        # Delete existing canvas page first to test POST
        self.canvas_page.delete()
        
        url = reverse('canvas-page-list-create')
        data = {
            'id': 'new-canvas-page',
            'nodeId': self.canvas_node.id,
            'projectId': self.project.id,
            'data': {'elements': [], 'connections': []}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(CanvasPage.objects.count(), 1)
        self.assertEqual(CanvasPage.objects.first().id, 'new-canvas-page')

    def test_create_canvas_page_existing_updates(self):
        # If canvas page already exists, POST should update it (same as DocumentPage)
        url = reverse('canvas-page-list-create')
        data = {
            'id': 'test-canvas-page',
            'nodeId': self.canvas_node.id,
            'projectId': self.project.id,
            'data': {'elements': [{'id': 'el2'}], 'connections': []}
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.canvas_page.refresh_from_db()
        self.assertEqual(self.canvas_page.data['elements'][0]['id'], 'el2')

    def test_patch_canvas_page(self):
        url = reverse('canvas-page-detail', kwargs={'page_id': self.canvas_page.id})
        data = {
            'data': {'elements': [{'id': 'el3'}], 'connections': []}
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.canvas_page.refresh_from_db()
        self.assertEqual(self.canvas_page.data['elements'][0]['id'], 'el3')

    def test_delete_canvas_page(self):
        url = reverse('canvas-page-detail', kwargs={'page_id': self.canvas_page.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CanvasPage.objects.count(), 0)

    def test_get_node_detail(self):
        url = reverse('nodes-compat-detail', kwargs={'node_id': self.canvas_node.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.canvas_node.id)
        self.assertEqual(response.data['title'], self.canvas_node.title)


class TagAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='taguser', password='password123')
        self.project = Project.objects.create(
            id='tag-project',
            title='Tag Project',
            created_by=self.user
        )
        self.tag = Tag.objects.create(
            id='tag-1781960878066',
            project=self.project,
            name='Old tag',
            color={'background': '#ffffff', 'text': '#000000'}
        )

    def test_patch_tag(self):
        url = reverse('global-tag-detail', kwargs={'tag_id': self.tag.id})
        response = self.client.patch(url, {'name': 'New tag'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tag.refresh_from_db()
        self.assertEqual(self.tag.name, 'New tag')
        self.assertEqual(response.data['id'], self.tag.id)
        self.assertEqual(response.data['projectId'], self.project.id)

    def test_delete_tag(self):
        url = reverse('global-tag-detail', kwargs={'tag_id': self.tag.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tag.objects.filter(id=self.tag.id).exists())


class NodeTitleAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='nodeuser', password='password123')
        self.project = Project.objects.create(
            id='node-title-project',
            title='Node Title Project',
            created_by=self.user
        )
        self.root = Node.objects.create(
            id='root-folder',
            project=self.project,
            parent_id=None,
            type='folder',
            title='Root',
            created_by=self.user
        )
        self.other_folder = Node.objects.create(
            id='other-folder',
            project=self.project,
            parent_id=self.root.id,
            type='folder',
            title='Other',
            created_by=self.user
        )

    def create_node(self, node_id, node_type, title, parent_id=None, is_deleted=False):
        return Node.objects.create(
            id=node_id,
            project=self.project,
            parent_id=parent_id if parent_id is not None else self.root.id,
            type=node_type,
            title=title,
            is_deleted=is_deleted,
            created_by=self.user
        )

    def post_node(self, node_id, node_type, title, parent_id=None):
        return self.client.post(
            reverse('nodes-compat-list'),
            {
                'id': node_id,
                'projectId': self.project.id,
                'parentId': parent_id if parent_id is not None else self.root.id,
                'type': node_type,
                'title': title,
                'tagIds': [],
                'isFavorite': False,
                'isDeleted': False,
            },
            format='json'
        )

    def test_create_uses_next_suffix_across_node_types(self):
        self.create_node('folder-docs', 'folder', 'Docs')
        first_response = self.post_node('document-docs', 'document', 'Docs')
        second_response = self.post_node('canvas-docs', 'canvas', 'Docs (1)')

        self.assertEqual(first_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(second_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first_response.data['title'], 'Docs (1)')
        self.assertEqual(second_response.data['title'], 'Docs (2)')

    def test_rename_to_own_title_keeps_title(self):
        node = self.create_node('docs', 'folder', 'Docs')
        response = self.client.patch(
            reverse('nodes-compat-detail', kwargs={'node_id': node.id}),
            {'title': 'Docs'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Docs')

    def test_rename_to_existing_title_adds_suffix(self):
        self.create_node('docs', 'folder', 'Docs')
        node = self.create_node('notes', 'document', 'Notes')
        response = self.client.patch(
            reverse('nodes-compat-detail', kwargs={'node_id': node.id}),
            {'title': 'Docs'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Docs (1)')

    def test_move_to_folder_with_existing_title_adds_suffix(self):
        source = self.create_node('source-docs', 'folder', 'Docs')
        self.create_node('target-docs', 'document', 'Docs', parent_id=self.other_folder.id)
        response = self.client.patch(
            reverse('nodes-compat-detail', kwargs={'node_id': source.id}),
            {'parentId': self.other_folder.id},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['parentId'], self.other_folder.id)
        self.assertEqual(response.data['title'], 'Docs (1)')

    def test_deleted_node_title_does_not_conflict(self):
        self.create_node('deleted-docs', 'folder', 'Docs', is_deleted=True)
        response = self.post_node('active-docs', 'document', 'Docs')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'Docs')

    def test_restore_deleted_node_with_existing_title_adds_suffix(self):
        self.create_node('active-docs', 'folder', 'Docs')
        deleted_node = self.create_node('deleted-docs', 'document', 'Docs', is_deleted=True)
        response = self.client.patch(
            reverse('nodes-compat-detail', kwargs={'node_id': deleted_node.id}),
            {'isDeleted': False},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Docs (1)')
        self.assertFalse(response.data['isDeleted'])

