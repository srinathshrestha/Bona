#!/bin/bash

echo "🔒 Applying more secure CORS configuration..."

# Apply secure CORS settings via API
curl -X POST http://localhost:3000/api/debug/s3-cors \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "✅ Secure CORS configuration applied!"
echo ""
echo "🧪 Now test your PNG upload:"
echo "1. Go to http://localhost:3000/dashboard/projects/YOUR_PROJECT_ID"
echo "2. Try uploading a PNG file"
echo "3. Check browser console for upload progress logs"
echo ""
echo "🔍 What changed:"
echo "- Removed wildcard (*) from allowed headers"
echo "- Removed DELETE method (not needed for uploads)"
echo "- Added specific required headers only"
echo "- Increased cache time to 1 hour"
