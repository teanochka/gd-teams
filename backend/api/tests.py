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

