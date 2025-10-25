# Game API Specification

This document specifies the API endpoints needed for the AI Articulate game frontend. The frontend is currently using mock implementations in `/frontend/src/services/gameApi.ts` that need to be replaced with real backend calls.

## Base URL
```
http://localhost:8000/api/game
```

## Authentication
All endpoints require authentication using Token authentication (same as existing chat endpoints).
Include token in header:
```
Authorization: Token <user_token>
```

---

## Endpoints

### 1. Start Game Session
**POST** `/api/game/start`

Start a new game session for the authenticated user.

#### Request Body
```json
{
  "category": "sports",
  "subcategory": "NBA", 
  "totalRounds": 5
}
```

#### Response (201 Created)
```json
{
  "id": "uuid-string",
  "category": "sports",
  "subcategory": "NBA",
  "userId": "user-id",
  "startedAt": "2025-10-25T10:30:00Z",
  "totalRounds": 5,
  "currentRound": 1,
  "score": 0,
  "status": "active"
}
```

#### Implementation Notes
- Create a `GameSession` model to track game state
- Link to authenticated user
- Initialize with round 1, score 0
- Set status to 'active'

---

### 2. Get Word for Round
**GET** `/api/game/{gameSessionId}/word?round={roundNumber}`

Get a random word for the specified round based on the game's category/subcategory.

#### Response (200 OK)
```json
{
  "id": "word-id",
  "word": "Basketball",
  "category": "sports",
  "subcategory": "NBA",
  "difficulty": 3
}
```

#### Implementation Notes
- Maintain a database of words organized by category/subcategory
- Return a random word that hasn't been used in this game session
- Optional: Track difficulty levels (1-5)
- Cache the word for this round to ensure consistency

**Suggested Word Categories:**

<details>
<summary>Sports</summary>

- **NBA**: Basketball, Lakers, Jordan, LeBron, Dunk, Three-pointer, Slam dunk, Kobe, Curry
- **NFL**: Football, Touchdown, Quarterback, Patriots, Brady, Super Bowl, Tackle
- **Soccer**: Goal, Messi, Ronaldo, World Cup, Penalty, Offside, Hat trick
- **Olympics**: Medal, Athlete, Torch, Marathon, Gymnastics, Swimming
- **Tennis**: Serve, Wimbledon, Federer, Grand Slam, Deuce, Love

</details>

<details>
<summary>Politics</summary>

- **US Politics**: President, Congress, Senate, Election, Democracy, Constitution
- **World Leaders**: Prime Minister, Chancellor, Diplomat, Summit
- **Political Systems**: Democracy, Monarchy, Republic, Parliament
- **Elections**: Vote, Ballot, Campaign, Candidate, Polling

</details>

<details>
<summary>Computer Science</summary>

- **Programming**: Python, JavaScript, Algorithm, Function, Variable, Loop
- **Algorithms**: Sorting, Recursion, Binary Search, Dynamic Programming, Graph
- **Web Development**: HTML, CSS, React, API, Database, Frontend
- **Data Structures**: Array, Linked List, Tree, Stack, Queue, Hash Table
- **AI & ML**: Neural Network, Machine Learning, Deep Learning, Training, Model

</details>

<details>
<summary>Geography</summary>

- **Countries**: France, Japan, Brazil, Australia, Canada, Egypt
- **Capitals**: Paris, Tokyo, London, Washington, Beijing, Moscow
- **Landmarks**: Eiffel Tower, Great Wall, Taj Mahal, Statue of Liberty
- **Natural Wonders**: Grand Canyon, Amazon Rainforest, Great Barrier Reef, Mount Everest

</details>

<details>
<summary>History</summary>

- **Ancient Civilizations**: Egypt, Rome, Greece, Mesopotamia, Aztec, Maya
- **World Wars**: D-Day, Pearl Harbor, Hitler, Churchill, Atomic Bomb
- **Renaissance**: Leonardo da Vinci, Michelangelo, Shakespeare, Galileo

</details>

---

### 3. Submit Clue
**POST** `/api/game/{gameSessionId}/clue`

Submit a player's clue (voice transcription or text).

#### Request Body (multipart/form-data)
```
round: 1
clueText: "It's a sport played with a ball"
audio: <audio-blob> (optional)
```

#### Response (201 Created)
```json
{
  "id": "clue-id",
  "gameSessionId": "game-session-id",
  "round": 1,
  "clueText": "It's a sport played with a ball",
  "audioUrl": "https://storage/audio/clue-id.webm",
  "timestamp": "2025-10-25T10:31:15Z"
}
```

#### Implementation Notes
- Store clue in database linked to game session and round
- Optional: Save audio file to storage (S3, local filesystem, etc.)
- Validate that clue doesn't contain the target word
- Return error 400 if target word is in clue

---

### 4. Get AI Guess
**POST** `/api/game/{gameSessionId}/guess`

Get the AI's guess based on accumulated clues. This is where Gemini AI integration happens.

#### Request Body
```json
{
  "round": 1,
  "targetWord": "Basketball",
  "clues": [
    "It's a sport played with a ball",
    "Teams compete on a court",
    "Players try to score in a hoop"
  ]
}
```

#### Response (200 OK)
```json
{
  "id": "guess-id",
  "gameSessionId": "game-session-id",
  "round": 1,
  "guessText": "Basketball",
  "isCorrect": true,
  "confidence": 0.85,
  "timestamp": "2025-10-25T10:31:30Z"
}
```

#### Implementation Notes - **CRITICAL**
This is the core AI integration. Use Gemini API to generate guesses:

```python
# Pseudo-code for Gemini integration
def get_ai_guess(target_word, clues):
    prompt = f"""You are playing a word guessing game. 
    Based on these clues, guess the word:
    
    Clues:
    {' '.join([f'- {clue}' for clue in clues])}
    
    Respond with only the word you're guessing, nothing else.
    Make your guess based on the clues provided.
    """
    
    # Call Gemini API
    response = gemini_interface.get_gemini_response(prompt)
    
    # Check if correct
    is_correct = response.strip().lower() == target_word.lower()
    
    return {
        'guessText': response.strip(),
        'isCorrect': is_correct,
        'confidence': calculate_confidence(response, target_word)
    }
```

**Difficulty Balancing:**
- Early rounds (1-2 clues): AI should be more uncertain, make less accurate guesses
- Later rounds (3+ clues): AI can be more confident and accurate
- Consider using temperature parameter to control AI randomness
- Don't let AI win too quickly - game should be challenging but fair

---

### 5. End Round
**POST** `/api/game/{gameSessionId}/round/end`

Signal that a round has ended (either AI guessed or time ran out).

#### Request Body
```json
{
  "round": 1,
  "playerWon": true,
  "timeElapsed": 45
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Round 1 completed"
}
```

#### Implementation Notes
- Update game session score if player won
- Store round result for history/statistics
- Update currentRound in GameSession

---

### 6. Complete Game
**POST** `/api/game/{gameSessionId}/complete`

Mark the game as completed and return final results.

#### Response (200 OK)
```json
{
  "gameSessionId": "game-session-id",
  "totalRounds": 5,
  "playerScore": 3,
  "aiScore": 2,
  "rounds": [
    {
      "round": 1,
      "word": "Basketball",
      "clues": [...],
      "aiGuesses": [...],
      "playerWon": true,
      "timeElapsed": 45
    }
  ],
  "completedAt": "2025-10-25T10:40:00Z"
}
```

#### Implementation Notes
- Update GameSession status to 'completed'
- Calculate final scores
- Store game results for user statistics
- Return comprehensive game summary

---

### 7. Transcribe Audio
**POST** `/api/game/transcribe`

Transcribe audio recording to text (optional - can use Web Speech API on frontend).

#### Request (multipart/form-data)
```
audio: <audio-blob>
```

#### Response (200 OK)
```json
{
  "text": "It's a sport played with a ball"
}
```

#### Implementation Notes
- Use speech-to-text service (Google Cloud Speech-to-Text, AWS Transcribe, etc.)
- OR skip this endpoint and use Web Speech API directly in frontend
- Handle audio format conversion (webm, wav, mp3)

---

### 8. Get User Stats
**GET** `/api/game/stats`

Get statistics for the authenticated user.

#### Response (200 OK)
```json
{
  "gamesPlayed": 15,
  "totalScore": 42,
  "winRate": 0.68,
  "favoriteCategory": "sports",
  "averageTimePerRound": 35.5
}
```

---

### 9. Get Game History
**GET** `/api/game/history?limit=10`

Get recent games for the authenticated user.

#### Response (200 OK)
```json
[
  {
    "gameSessionId": "game-id-1",
    "category": "sports",
    "subcategory": "NBA",
    "totalRounds": 5,
    "playerScore": 3,
    "aiScore": 2,
    "completedAt": "2025-10-25T10:40:00Z"
  }
]
```

---

## Database Models Needed

### GameSession
```python
class GameSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_rounds = models.IntegerField(default=5)
    current_round = models.IntegerField(default=1)
    player_score = models.IntegerField(default=0)
    ai_score = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=[('active', 'Active'), ('completed', 'Completed')])
```

### Word
```python
class Word(models.Model):
    word = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100)
    difficulty = models.IntegerField(default=3)  # 1-5
    created_at = models.DateTimeField(auto_now_add=True)
```

### Round
```python
class Round(models.Model):
    game_session = models.ForeignKey(GameSession, related_name='rounds', on_delete=models.CASCADE)
    round_number = models.IntegerField()
    word = models.ForeignKey(Word, on_delete=models.CASCADE)
    player_won = models.BooleanField()
    time_elapsed = models.IntegerField()  # seconds
    completed_at = models.DateTimeField(auto_now_add=True)
```

### Clue
```python
class Clue(models.Model):
    round = models.ForeignKey(Round, related_name='clues', on_delete=models.CASCADE)
    clue_text = models.TextField()
    audio_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### AIGuess
```python
class AIGuess(models.Model):
    round = models.ForeignKey(Round, related_name='guesses', on_delete=models.CASCADE)
    guess_text = models.CharField(max_length=200)
    is_correct = models.BooleanField()
    confidence = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

---

## Integration Checklist

Frontend is ready and waiting for:
- [ ] Create Django models (GameSession, Word, Round, Clue, AIGuess)
- [ ] Run migrations
- [ ] Seed database with word lists (at least 50-100 words per subcategory)
- [ ] Implement `/api/game/start` endpoint
- [ ] Implement `/api/game/{id}/word` endpoint
- [ ] Implement `/api/game/{id}/clue` endpoint
- [ ] **Integrate Gemini AI in `/api/game/{id}/guess` endpoint**
- [ ] Implement `/api/game/{id}/round/end` endpoint
- [ ] Implement `/api/game/{id}/complete` endpoint
- [ ] Implement `/api/game/stats` endpoint (optional)
- [ ] Implement `/api/game/history` endpoint (optional)
- [ ] Add API URLs to `backend/api/urls.py`
- [ ] Test with frontend at `http://localhost:5173`

---

## Testing the Integration

Once backend is implemented:

1. **Start frontend:** `cd frontend && npm run dev`
2. **Start backend:** `cd backend && python manage.py runserver`
3. **Login to the app**
4. **Click a category** on dashboard
5. **Select a subcategory**
6. **Play the game** - give clues and see AI guesses
7. **Check browser console** for any API errors
8. **Verify data** is being stored in Django admin

---

## Current Frontend Implementation

The frontend service layer is in `/frontend/src/services/gameApi.ts`. Each function has:
- ✅ **Mock implementation** (currently active)
- 📝 **Commented production code** (ready to uncomment)

To switch to real API:
1. Implement the backend endpoints
2. Uncomment the `/* Production implementation: */` blocks
3. Comment out the mock implementations
4. Test!

---

## Questions?

Contact the frontend team if you need clarification on:
- Expected data formats
- Error handling requirements
- Authentication flow
- Any endpoint behavior

**Frontend is production-ready and waiting for backend! 🚀**
