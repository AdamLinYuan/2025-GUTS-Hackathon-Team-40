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
from chatbot.gemini_interface import get_gemini_response, get_gemini_response_stream

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'score', 'current_word', 'guesses_remaining', 'num_rounds']

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat_stream(request):
    """Full chatbot with history - requires authentication"""
    try:
        # Get conversation ID from request or create a new one
        conversation_id = request.data.get('conversation_id')

        # Important: Check if conversation_id is None, empty string, or "null" string
        if conversation_id and conversation_id != "null" and conversation_id.strip():
            try:
                conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
                print(f"Retrieved existing conversation: {conversation.id}")
            except Exception as e:
                print(f"Error retrieving conversation {conversation_id}: {str(e)}")
                # If conversation doesn't exist, we'll create a new one below
                conversation_id = None

        # Create new conversation if needed
        if not conversation_id or conversation_id == "null" or not conversation_id.strip():
            # Get the first few words of the prompt for a better title
            title_preview = ' '.join(request.data.get('prompt', '').split()[:5])
            if len(title_preview) > 0:
                title = f"Chat about {title_preview}..."
            else:
                topic = "HISTORICAL FIGURES"

                title = f"TOPIC: {topic}"
                
            # Create the conversation with error checking
            try:
                conversation = Conversation.objects.create(
                    user=request.user,
                    title=title,
                    current_word=get_word("historical_figures"),

                )
                request.user.userProfile.rounds_played += 1
                request.user.userProfile.save()
                print(f"Created conversation {conversation.id} for user {request.user.username}")
            except Exception as e:
                print(f"Error creating conversation: {str(e)}")
                return Response({"error": f"Could not create conversation: {str(e)}"}, status=500)
            
        # Save the user message with error checking
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
            
            # For the final turn, add the instruction tag but don't close it
            return formatted_context

        # Get conversation history (last 10 messages)
        history = list(conversation.messages.order_by('-created_at')[:10])
        history.reverse()  # Get in chronological order

        # Format for Llama
        context = format_conversation_for_llama(history)
        full_prompt = context + user_prompt

        start_time = time.time()
        
        # Create a class to hold the response text that will be updated during streaming
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
                    # Create the bot message in the database
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
                    
                    # Check if AI guessed the word OR if user used the backdoor "ORAN"
                    conversation.guesses_remaining -= 1
                    
                    # Check if AI guessed the word OR if user used the backdoor "ORAN"
                    if (conversation.current_word in self.text or "ORAN" in user_prompt):
                        conversation.score += 1
                        conversation.num_rounds -= 1
                        conversation.current_word = get_word("historical_figures") # Hardcoded for testing purposes
                        conversation.guesses_remaining = 3  # Reset to 3 guesses for new word
                    
                    conversation.save()
                        
                    # Log the prompt and response
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
        
        # Initialize the response holder
        response_holder = ResponseHolder()
        
        # Create a streaming response generator
        def event_stream():
            # Use the streaming interface
            for chunk in get_gemini_response_stream(full_prompt):
                # Add the chunk to our complete response
                response_holder.add_text(chunk)
                
                # Format the chunk for the frontend
                data = json.dumps({
                    "chunk": chunk, 
                    "done": False,
                    "conversation_id": None
                })
                yield f"data: {data}\n\n"
            
            # Mark the response as complete
            response_holder.mark_complete()
            
            # Save the bot message
            response_holder.save_message()
            
            # Send a final "done" message
            data = json.dumps({
                "chunk": "", 
                "done": True,
                "conversation_id": str(conversation.id)
            })
            yield f"data: {data}\n\n"
        
        # Start streaming
        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        return response

    except Exception as e:
        print(f"Unexpected error in chat_stream: {str(e)}")
        return Response({"error": f"An unexpected error occurred: {str(e)}"}, status=500)

# Add a limited demo version that doesn't require authentication
@api_view(['POST'])
@permission_classes([AllowAny])  # Allow anyone to use the demo
def chat_demo(request):
    """Limited demo chatbot without history or storage"""
    user_prompt = request.data.get('prompt', '')
    
    if not user_prompt:
        return Response({"error": "Prompt is required"}, status=400)
    
    try:
        # Get the first few words of the prompt for a better title
        title_preview = ' '.join(user_prompt.split()[:5])
        
        # Create a demo conversation
        conversation = Conversation.objects.create(
            user=None,
            title=f"Demo: {title_preview}",
            is_demo=True
        )
        
        # Log the demo usage without associating with a user
        PromptLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            prompt=user_prompt,
            response="[Demo response]",  # This will be replaced
            tokens_used=len(user_prompt.split()),
            processing_time=0.0  # Will be updated
        )
        
        # Get start time for performance tracking
        start_time = time.time()
        
        # Generate a response using the same function as chat_stream
        # but with a shorter context and capped token limit
        response_text = get_gemini_response(user_prompt)
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Update the prompt log
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
    """Get a list of all conversations for the current user"""
    conversations = Conversation.objects.filter(user=request.user).order_by('-updated_at')
    serializer = ConversationSerializer(conversations, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversation_detail(request, conversation_id):
    """Get details for a specific conversation including messages"""
    try:
        conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
        
        # Get conversation data
        conversation_data = ConversationSerializer(conversation).data
        
        # Get messages with explicit ordering
        messages = conversation.messages.all().order_by('created_at')
        messages_data = MessageSerializer(messages, many=True).data
        
        # Debug information about messages
        user_msgs = sum(1 for m in messages if m.sender == 'user')
        bot_msgs = sum(1 for m in messages if m.sender == 'bot')
        print(f"Returning {len(messages_data)} messages for conversation {conversation_id}")
        print(f"User messages: {user_msgs}, Bot messages: {bot_msgs}")
        
        # Combine data
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
    """Get current user information"""
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
    """Logout user by removing their token"""
    request.user.auth_token.delete()
    logout(request)
    return Response({"success": "Successfully logged out"})

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_message(request, message_id):
    """Edit a user message and remove subsequent messages"""
    try:
        # Get the message to edit
        message = get_object_or_404(Message, id=message_id, sender='user')
        
        # Verify the message belongs to a conversation owned by the user
        if message.conversation.user != request.user:
            return Response({"error": "Not authorized to edit this message"}, status=403)
        
        # Update the message content
        message.content = request.data.get('content', '')
        message.save()
        
        # Get the message timestamp
        message_time = message.created_at
        
        # Delete all messages in the conversation that came after this one
        Message.objects.filter(
            conversation=message.conversation,
            created_at__gt=message_time
        ).delete()
        
        # Return the updated message
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
def topic_list(request):
    """Get a list of all topics for the current user"""
    topic_list = Topic.objects.filter(user=request.user).order_by('-updated_at')
    return [name for name in topic_list]

def get_word(topic):
    base_dir = os.path.join(os.path.dirname(__file__), 'data')
    filepath = os.path.join(base_dir, f"{topic}.txt")
    with open(filepath, "r") as f:
        words = [line.strip() for line in f]
    word = random.choice(words)
    print(word)
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