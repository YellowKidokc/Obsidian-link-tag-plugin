# Theophysics Backend API

Backend service for the Theophysics Obsidian Plugin. Provides PostgreSQL connectivity for epistemic classifications, timeline events, and analytics.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Configure Obsidian Plugin
1. Open Obsidian
2. Go to Settings → Theophysics Research Automation → Advanced
3. Enter your PostgreSQL connection URL:
   ```
   postgresql://postgres:Moss9pep28$@192.168.1.93:5432/theophysics
   ```
4. Click "Test Connection"
5. Click "Initialize Schema"

## API Endpoints

### Health Check
```
GET /health
```
Returns server status.

### Test Database Connection
```
POST /api/test-connection
Body: { "connectionString": "postgresql://..." }
```

### Initialize Database Schema
```
POST /api/initialize-schema
Body: { "connectionString": "postgresql://..." }
```
Creates all tables and seeds epistemic types.

### Get or Create Note
```
POST /api/note/get-or-create
Body: {
  "connectionString": "postgresql://...",
  "filePath": "path/to/note.md",
  "vaultName": "MyVault",
  "title": "Note Title"
}
```

### Save Classification
```
POST /api/classification/save
Body: {
  "connectionString": "postgresql://...",
  "noteId": "uuid",
  "content": "selected text",
  "typeName": "axiom",
  "startOffset": 0,
  "endOffset": 100,
  "lineStart": 5,
  "lineEnd": 5,
  "taggedBy": "user"
}
```

## Development

### Run with Auto-Reload
```bash
npm run dev
```

### Environment Variables
- `PORT` - Server port (default: 3000)

## Deployment Options

### Option 1: Local (Recommended for Personal Use)
Run on your local machine:
```bash
npm start
```

### Option 2: Server (For Team Use)
Deploy to a server and update the plugin's API URL.

### Option 3: Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Notes

- ⚠️ Connection strings contain passwords - keep them secure
- 🔒 For production, add authentication to API endpoints
- 🌐 Use HTTPS in production environments
- 🔐 Consider using environment variables for sensitive data

## Troubleshooting

### "ECONNREFUSED"
- Make sure the server is running (`npm start`)
- Check the port isn't already in use

### "Connection to PostgreSQL failed"
- Verify PostgreSQL is running
- Check connection string is correct
- Verify network access to database server

### "CORS errors"
- Server has CORS enabled for all origins
- If issues persist, check browser console

## Distribution

To distribute with your Obsidian plugin:

1. **Include backend folder** in your plugin release
2. **Add setup instructions** in main README
3. **Users run:** `cd backend && npm install && npm start`
4. **Plugin connects** to `http://localhost:3000`

## License

MIT
