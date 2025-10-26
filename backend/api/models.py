from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='userprofile')
    last_active = models.DateTimeField(default=timezone.now)
    rounds_played = models.IntegerField(default=0)
    rounds_won = models.IntegerField(default=0)
    max_conversations = models.IntegerField(default=10)
    
    def __str__(self):
        return f"Profile for {self.user.username}"

class Topic(models.Model): #sub-category
    topic_name = models.CharField(max_length=100)
    related_words = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='topics', null=True, blank=True)
    category = models.CharField(max_length=100, null=True, blank=True)


    def __str__(self):
        return self.topic_name


class Conversation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', null=True, blank=True)
    title = models.CharField(max_length=255)
    is_demo = models.BooleanField(default=False)  # Mark demo conversations
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    score = models.PositiveIntegerField(default=0)
    current_word = models.CharField(max_length=100, default="")
    guesses_remaining = models.PositiveIntegerField(default=4)
    num_rounds = models.PositiveIntegerField(default=5)
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='conversations'
    )
    
    def __str__(self):
        if self.user:
            return f"{self.title} - {self.user.username}"
        else:
            return f"{self.title} - Demo"
            
    def save(self, *args, **kwargs):
        # Mark conversations without users as demos
        if not self.user:
            self.is_demo = True
        super().save(*args, **kwargs)

class Message(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.CharField(max_length=10, choices=[('user', 'User'), ('bot', 'Bot')])
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.sender} - {self.conversation.title[:20]}"
    
    class Meta:
        ordering = ['created_at']

class PromptLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='prompt_logs')
    prompt = models.TextField()
    response = models.TextField()
    tokens_used = models.IntegerField(default=0)
    processing_time = models.FloatField(default=0.0)  # in seconds
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Prompt log {self.id} by {self.user.username if self.user else 'Anonymous'}"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, **kwargs):
    UserProfile.objects.get_or_create(user=instance)