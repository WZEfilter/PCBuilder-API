# AI PC Builder

This project generates PC build recommendations using OpenRouter's DeepSeek Chat V3 and enriches them with live Amazon affiliate links via SerpAPI.

## Setup

1. Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Send a POST request to `/build`:
   ```bash
   curl http://localhost:3000/build \
     -H "Content-Type: application/json" \
     -d '{
       "budget": 1200,
       "useCase": "gaming",
       "additionalRequirements": "RGB lighting, quiet fans"
     }'
   ```

- **budget** (number): Total budget in USD  
- **useCase** (string): Primary PC use case (e.g., gaming, video editing)  
- **additionalRequirements** (string, optional): Any extra user preferences  

The response will be JSON with parts, titles, prices, and affiliate links.
