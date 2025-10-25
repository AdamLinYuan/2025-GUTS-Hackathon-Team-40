from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token
from . import views

urlpatterns = [
    path('auth/token/', obtain_auth_token, name='api_token_auth'),
    path('auth/register/', views.register_user, name='register'),
    path('auth/user/', views.user_info, name='user_info'),
    path('auth/logout/', views.logout_view, name='logout'),

    path('chat-stream/<str:topic_name>/', views.chat_stream, name='chat_stream'),
    path('chat-demo/', views.chat_demo, name='chat_demo'),
    path('topic-list/', views.topic_list, name='topic_list'),
    path('set-topic/', views.set_topic, name='set_topic'),
    path('upload-terms/', views.upload_terms, name='upload_terms'),
    path('conversations/', views.conversation_list, name='conversation_list'),
    path('conversations/<int:conversation_id>/', views.conversation_detail, name='conversation_detail'),
    path('conversations/<int:conversation_id>/reset-round/', views.reset_round, name='reset_round'),
    path('topics/<str:topic_name>/random-subject/', views.random_avatar_subject, name='random_avatar_subject'),
]