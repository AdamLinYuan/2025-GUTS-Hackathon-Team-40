from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.http import StreamingHttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django.urls import reverse
from rest_framework.response import Response
from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import logout
from rest_framework.authtoken.models import Token
import json
import time
from django.db import transaction
import random
import os
import re
import difflib

from .models import Conversation, Message, PromptLog, UserProfile, Topic
from chatbot.gemini_interface import (
    get_gemini_response,
    get_gemini_response_stream,
    extract_terms_from_pdf,
    get_word_description,
)

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'score', 'current_word', 'word_description', 'guesses_remaining', 'num_rounds']

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['rounds_played', 'rounds_won']

@api_view(['POST'])
@permission_classes([IsAuthenticated])

def chat_stream(request, topic_name):
    """Full chatbot with history - requires authentication"""
    try:
        conversation_id = request.data.get('conversation_id')
        if conversation_id and conversation_id != "null" and conversation_id.strip():
            try:
                conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
                print(f"Retrieved existing conversation: {conversation.id}")
            except Exception as e:
                print(f"Error retrieving conversation {conversation_id}: {str(e)}")
                conversation_id = None
        if not conversation_id or conversation_id == "null" or not conversation_id.strip():
            title_preview = ' '.join(request.data.get('prompt', '').split()[:5])
            if len(title_preview) > 0:
                title = f"Chat about {title_preview}..."
            else:
                topic = "ANCIENT HISTORY"

                title = f"TOPIC: {topic}"
            
            # Use the topic_name from URL parameter or default
            if not topic_name:
                topic_name = "ancient_history"
            
            print(f"Using topic: {topic_name}")
                
            try:
                conversation = Conversation.objects.create(
                    user=request.user,
                    title=title,

                    current_word=get_word(topic_name),

                )
                print(f"Created conversation {conversation.id} for user {request.user.username}")
            except Exception as e:
                print(f"Error creating conversation: {str(e)}")
                return Response({"error": f"Could not create conversation: {str(e)}"}, status=500)

        user_prompt = request.data.get('prompt', '')
        try:
            Message.objects.create(
                conversation=conversation,
                sender='user',
                content=user_prompt
            )
        except Exception as e:
            print(f"Error creating message: {str(e)}")
            return Response({"error": f"Could not save message: {str(e)}"}, status=500)

        def format_conversation_for_llama(messages):
            formatted_context = ""
            
            for msg in messages:
                if msg.sender == "user":
                    formatted_context += f"[INST] {msg.content} [/INST]\n"
                else:
                    formatted_context += f"{msg.content}\n\n"
            return formatted_context

        history = list(conversation.messages.order_by('-created_at')[:10])
        history.reverse()
        context = format_conversation_for_llama(history)
        full_prompt = context + user_prompt

        start_time = time.time()

        class ResponseHolder:
            def __init__(self):
                self.text = ""
                self.is_complete = False
                self.bot_message = None
            
            def add_text(self, text):
                self.text += text
            
            def mark_complete(self):
                self.is_complete = True
            
            def save_message(self):
                if not self.is_complete:
                    return
                try:
                    self.bot_message = Message.objects.create(
                        conversation=conversation,
                        sender='bot',
                        content=self.text
                    )
                    print(f"Saved bot message with ID: {self.bot_message.id}, length: {len(self.text)}")

                    # fuzzy / near-match helper
                    def _normalize(s):
                        return re.sub(r'[^a-z0-9\s]', '', (s or "").lower()).strip()
                    
                    def is_near_match(text, target, token_subset=True, ratio_threshold=0.7):
                        if not target:
                            return False
                        text_n = _normalize(text)
                        target_n = _normalize(target)
                        # exact substring
                        if target_n and target_n in text_n:
                            return True
                        # all target tokens appear somewhere in text (e.g., "empire state" in "empire state building")
                        if token_subset:
                            t_tokens = [t for t in target_n.split() if t]
                            txt_tokens = [t for t in text_n.split() if t]
                            if t_tokens and set(t_tokens).issubset(set(txt_tokens)):
                                return True
                        # fuzzy ratio against entire text
                        if difflib.SequenceMatcher(None, target_n, text_n).ratio() >= ratio_threshold:
                            return True
                                                # fuzzy ratio against sliding windows of text tokens (catch shorter matches)
                        tlen = len(target_n.split())
                        txt_tokens = text_n.split()
                        if tlen > 0 and len(txt_tokens) >= 1:
                            # check window sizes around target length
                            for w in range(max(1, tlen), min(len(txt_tokens), tlen + 3) + 1):
                                for i in range(0, len(txt_tokens) - w + 1):
                                    window = " ".join(txt_tokens[i:i+w])
                                    if difflib.SequenceMatcher(None, target_n, window).ratio() >= ratio_threshold:
                                        return True
                        return False
                    
                    # Check for timeout signal first - don't decrement guesses for timeout
                    if "__TIMEOUT__" in user_prompt:
                        # Timer ran out - generate description of the missed word
                        old_word = conversation.current_word
                        conversation.word_description = get_word_description(old_word, topic_name)
                        conversation.num_rounds -= 1
                        conversation.current_word = get_word(topic_name)
                        conversation.guesses_remaining = 3
                        request.user.userprofile.rounds_played += 1
                        request.user.userprofile.save()
                    else:
                        # Normal guess logic
                        conversation.guesses_remaining -= 1
                        
                        # Check if AI guessed the word OR if user used the backdoor "ORAN"
                        if (is_near_match(conversation.current_word,self.text) or "ORAN" in user_prompt):
                            # AI guessed correctly - generate description of the guessed word
                            old_word = conversation.current_word
                            conversation.word_description = get_word_description(old_word, topic_name)
                            conversation.score += 1
                            conversation.num_rounds -= 1
                            conversation.current_word = get_word(topic_name)
                            conversation.guesses_remaining = 3
                            request.user.userprofile.rounds_won += 1
                            request.user.userprofile.rounds_played += 1
                            request.user.userprofile.save()
                        elif (conversation.guesses_remaining == 0):
                            # Out of guesses - generate description of the missed word
                            old_word = conversation.current_word
                            conversation.word_description = get_word_description(old_word, topic_name)
                            conversation.num_rounds -= 1
                            conversation.current_word = get_word(topic_name)
                            conversation.guesses_remaining = 3
                            request.user.userprofile.rounds_played += 1
                            request.user.userprofile.save()
                    
                    conversation.save()
                    processing_time = time.time() - start_time
                    PromptLog.objects.create(
                        user=request.user,
                        prompt=user_prompt,
                        response=self.text,
                        processing_time=processing_time,
                        tokens_used=len(user_prompt.split()) + len(self.text.split())
                    )
                except Exception as e:
                    print(f"Error saving bot message: {str(e)}")
        
        response_holder = ResponseHolder()
        
        def event_stream():
            for chunk in get_gemini_response_stream(full_prompt):
                response_holder.add_text(chunk)
                data = json.dumps({
                    "chunk": chunk, 
                    "done": False,
                    "conversation_id": None
                })
                yield f"data: {data}\n\n"
            response_holder.mark_complete()
            response_holder.save_message()
            data = json.dumps({
                "chunk": "", 
                "done": True,
                "conversation_id": str(conversation.id)
            })
            yield f"data: {data}\n\n"
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        return response

    except Exception as e:
        print(f"Unexpected error in chat_stream: {str(e)}")
        return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def chat_demo(request):
    user_prompt = request.data.get('prompt', '')
    
    if not user_prompt:
        return Response({"error": "Prompt is required"}, status=400)
    
    try:
        title_preview = ' '.join(user_prompt.split()[:5])
        conversation = Conversation.objects.create(
            user=None,
            title=f"Demo: {title_preview}",
            is_demo=True
        )
        PromptLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            prompt=user_prompt,
            response="[Demo response]",
            tokens_used=len(user_prompt.split()),
            processing_time=0.0
        )
        start_time = time.time()
        response_text = get_gemini_response(user_prompt)
        processing_time = time.time() - start_time
        prompt_log = PromptLog.objects.filter(
            prompt=user_prompt, 
            user=request.user if request.user.is_authenticated else None
        ).order_by('-created_at').first()

        if prompt_log:
            prompt_log.response = response_text
            prompt_log.processing_time = processing_time
            prompt_log.tokens_used = len(user_prompt.split()) + len(response_text.split())
            prompt_log.save()
        
        return Response({
            "response": response_text,
            "demo_mode": True,
            "message": "Sign in to save chat history and access the full chatbot."
        })
    
    except Exception as e:
        return Response(
            {"error": f"An error occurred: {str(e)}", "demo_mode": True}, 
            status=500
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_list(request):
    conversations = Conversation.objects.filter(user=request.user).order_by('-updated_at')
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_detail(request, conversation_id):
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        conversation_data = ConversationSerializer(conversation).data
        messages = conversation.messages.all().order_by('created_at')
        messages_data = MessageSerializer(messages, many=True).data
        user_msgs = sum(1 for m in messages if m.sender == 'user')
        bot_msgs = sum(1 for m in messages if m.sender == 'bot')
        print(f"Returning {len(messages_data)} messages for conversation {conversation_id}")
        print(f"User messages: {user_msgs}, Bot messages: {bot_msgs}")
        result = {
            **conversation_data,
            "messages": messages_data
        }
        return Response(result)
    except Exception as e:
        print(f"Error in conversation_detail: {str(e)}")
        return Response({"error": str(e)}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    # Validate required fields
    if not (username and email and password):
        return Response({'error': 'Please provide username, email and password'}, status=400)
    
    # Validate username
    if User.objects.filter(username=username).exists():
        return Response({'username': 'Username already exists'}, status=400)
    
    # Validate email
    if User.objects.filter(email=email).exists():
        return Response({'email': 'Email already exists'}, status=400)
    
    # Validate password
    if len(password) < 6:
        return Response({'password': 'Password must be at least 6 characters long'}, status=400)
    
    try:
        # Use Django's transaction to ensure atomicity
        with transaction.atomic():
            # Create user - this will automatically trigger the signal to create UserProfile
            user = User.objects.create_user(username=username, email=email, password=password)
            
            # Create token
            token, _ = Token.objects.get_or_create(user=user)
        
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email
        }, status=201)
    
    except Exception as e:
        # Log the error for debugging
        print(f"Registration error: {str(e)}")
        return Response({'error': 'An unexpected error occurred during registration'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    user = request.user
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'date_joined': user.date_joined
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    logout(request)
    return Response({"success": "Successfully logged out"})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_message(request, message_id):
    try:
        message = get_object_or_404(Message, id=message_id, sender='user')
        if message.conversation.user != request.user:
            return Response({"error": "Not authorized to edit this message"}, status=403)
        message.content = request.data.get('content', '')
        message.save()
        message_time = message.created_at
        Message.objects.filter(
            conversation=message.conversation,
            created_at__gt=message_time
        ).delete()
        return Response({
            "id": message.id,
            "content": message.content,
            "sender": message.sender,
            "created_at": message.created_at
        })
    
    except Exception as e:
        return Response({"error": f"Error editing message: {str(e)}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reset_round(request, conversation_id):
    """Reset guesses_remaining for a new round"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        conversation.guesses_remaining = 3
        conversation.save()
        
        return Response({
            "success": True,
            "guesses_remaining": conversation.guesses_remaining,
            "message": "Round reset successfully"
        })
    except Exception as e:
        return Response({"error": f"Error resetting round: {str(e)}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def custom_topic_list(request):
    names = list(Topic.objects.filter(user=request.user).order_by('topic_name').values_list('topic_name', flat=True))
    return Response({"topics": names})

def get_word(topic):
    base_dir = os.path.join(os.path.dirname(__file__), 'topics')
    custom_dir = os.path.join(os.path.dirname(__file__), 'custom_topics')
    filepath = os.path.join(base_dir, f"{topic}.txt")
    
    # Check if the topic file exists in topics folder
    if not os.path.exists(filepath):
        # Try custom_topics folder
        custom_filepath = os.path.join(custom_dir, f"{topic}.txt")
        if os.path.exists(custom_filepath):
            filepath = custom_filepath
            print(f"Using custom topic file: {topic}.txt")
        else:
            print(f"Topic file '{topic}.txt' not found in topics or custom_topics, defaulting to ancient_history")
            topic = "ancient_history"
            filepath = os.path.join(base_dir, f"{topic}.txt")
    
    try:
        with open(filepath, "r") as f:
            words = [line.strip() for line in f if line.strip()]  # Filter out empty lines
        
        if not words:
            print(f"Topic file '{topic}.txt' is empty, defaulting to ancient_history")
            filepath = os.path.join(base_dir, "ancient_history.txt")
            with open(filepath, "r") as f:
                words = [line.strip() for line in f if line.strip()]
        
        word = random.choice(words)
        print(f"Selected word: {word} from topic: {topic}")
        return word
    except Exception as e:
        print(f"Error reading topic file: {str(e)}, defaulting to ancient_history")
        filepath = os.path.join(base_dir, "ancient_history.txt")
        with open(filepath, "r") as f:
            words = [line.strip() for line in f if line.strip()]
        word = random.choice(words)
        print(f"Selected word: {word} from default topic: ancient_history")
        return word


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_details(request):
    """Get details for a specific user"""
    try:
        user_profile = get_object_or_404(UserProfile, user=request.user)
        
        
        # Combine data
        result = {
            "username": request.user.username,
            "account_created": request.user.date_joined,
            "rounds_played" : user_profile.rounds_played,
            "rounds_won" : user_profile.rounds_won
        }
        
        return Response(result)
    except Exception as e:
        print(f"Error in conversation_detail: {str(e)}")
        return Response({"error": str(e)}, status=500)

# @api_view(['PUT'])
# @permission_classes([AllowAny])
# def file_upload(filename):
#     filepath = pathlib.Path(filename)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    profile = request.user.userprofile
    serializer = UserProfileSerializer(profile)
    print(f"User profile data: {serializer.data}")
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def upload_terms(request):
    try:
        upload = request.FILES.get('file')
        topic_name = request.POST.get('topic_name') or request.query_params.get('topic_name')
        if not upload:
            return Response({"error": "Missing file"}, status=400)

        if upload.content_type not in ("application/pdf", "application/x-pdf") and not upload.name.lower().endswith('.pdf'):
            return Response({"error": "Only PDF files are supported"}, status=400)

        max_terms = request.POST.get('max_terms') or request.query_params.get('max_terms')
        try:
            max_terms = int(max_terms) if max_terms is not None else 50
        except ValueError:
            max_terms = 50

        pdf_bytes = upload.read()
        terms = extract_terms_from_pdf(pdf_bytes, max_terms=max_terms)
        
        # Log the number of terms extracted
        print(f"Extracted {len(terms)} terms from PDF")
        
        # Check if we got any terms
        if not terms:
            return Response({"error": "No terms could be extracted from the PDF. Please ensure the PDF contains readable text."}, status=400)
        
        if topic_name:
            topic_name = topic_name.strip()
            # Use authenticated user if available, else leave user null
            user = request.user if request.user.is_authenticated else None
            topic, created = Topic.objects.get_or_create(
                user=user,
                topic_name=topic_name,
                defaults={'related_words': terms}
            )
            if not created:
                # Update related_words if topic already exists
                topic.related_words = terms
                topic.save()
            
            # Save terms to a txt file in custom_topics folder
            custom_topics_dir = os.path.join(os.path.dirname(__file__), 'custom_topics')
            # Create directory if it doesn't exist
            os.makedirs(custom_topics_dir, exist_ok=True)
            
            # Create filename (use topic_name with underscores, lowercase)
            safe_filename = topic_name.lower().replace(' ', '_')
            filepath = os.path.join(custom_topics_dir, f"{safe_filename}.txt")
            
            # Write terms to file (one per line)
            with open(filepath, 'w') as f:
                for term in terms:
                    f.write(f"{term}\n")
            
            print(f"Saved {len(terms)} terms to {filepath}")

        all_topics = Topic.objects.all().order_by('topic_name').values_list('topic_name', flat=True)
        print("All topic names:", list(all_topics))

        return Response({"terms": terms, "topic_name": topic_name})
    except Exception as e:
        print(f"upload_terms error: {e}")
        return Response({"error": "Failed to extract terms"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def random_avatar_subject(request, topic_name: str):
    """Return a random subject string from backend/api/topics/<topic_name>.txt.
    This is used by the frontend to seed a deterministic pixel avatar.
    """
    try:
        safe_name = str(topic_name).strip().lower()
        base_dir = os.path.join(os.path.dirname(__file__), 'topics')
        filepath = os.path.join(base_dir, f"{safe_name}.txt")
        if not os.path.isfile(filepath):
            return Response({"error": f"Topic file not found: {safe_name}.txt"}, status=404)
        with open(filepath, 'r') as f:
            items = [line.strip() for line in f if line.strip()]
        if not items:
            return Response({"error": "No subjects in topic file"}, status=400)
        subject = random.choice(items)
        return Response({"subject": subject})
    except Exception as e:
        return Response({"error": f"Failed to select subject: {e}"}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def random_famous_icon(request):
    """Return a random famous icon name from topics/famous_icons.txt.
    Used by the frontend to pick a consistent AI persona across categories.
    """
    try:
        base_dir = os.path.join(os.path.dirname(__file__), 'topics')
        filepath = os.path.join(base_dir, 'famous_icons.txt')
        if not os.path.isfile(filepath):
            return Response({"error": "famous_icons.txt not found"}, status=404)
        with open(filepath, 'r') as f:
            items = [line.strip() for line in f if line.strip()]
        if not items:
            return Response({"error": "No icons listed"}, status=400)
        icon = random.choice(items)
        return Response({"icon": icon})
    except Exception as e:
        return Response({"error": f"Failed to select icon: {e}"}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_topic(request):
    try:
        topic_name = request.data.get('topic_name')
        if not topic_name:
            return Response({"error": "topic_name is required"}, status=400)
        topic_name = str(topic_name).strip()
        topic, _ = Topic.objects.get_or_create(user=request.user, topic_name=topic_name)
        return Response({"success": True, "topic": topic.topic_name})
    except Exception as e:
        return Response({"error": f"Failed to set topic: {e}"}, status=500)