#!/bin/bash

echo "🔍 Detecting network configuration for CORS setup..."

# Get the current network IP from Next.js logs or system
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n1)

echo "📡 Detected network configuration:"
echo "   - Localhost: http://localhost:3000"
echo "   - Local IP: http://${LOCAL_IP}:3000"
echo "   - From Next.js logs: http://10.12.39.151:3000"

echo ""
echo "🔧 Recommended CORS origins for S3:"
echo "["
echo "  \"http://localhost:3000\","
echo "  \"https://localhost:3000\","
echo "  \"http://127.0.0.1:3000\","
echo "  \"https://127.0.0.1:3000\","
echo "  \"http://10.12.39.151:3000\","
echo "  \"https://10.12.39.151:3000\""
if [ ! -z "$LOCAL_IP" ] && [ "$LOCAL_IP" != "10.12.39.151" ]; then
    echo "  \"http://${LOCAL_IP}:3000\","
    echo "  \"https://${LOCAL_IP}:3000\""
fi
echo "]"

echo ""
echo "⚠️  Important Notes:"
echo "   1. S3 CORS uses the Origin header from browser requests"
echo "   2. When you access via localhost, browser sends 'http://localhost:3000'"
echo "   3. When you access via IP, browser sends 'http://IP:3000'"
echo "   4. Both must be in CORS AllowedOrigins for uploads to work"

echo ""
echo "🧪 To test which origin your browser is using:"
echo "   1. Open browser developer tools"
echo "   2. Go to Network tab"
echo "   3. Try an upload"
echo "   4. Look for the 'Origin' header in the S3 request"

echo ""
echo "✅ Your current CORS should work with the wildcard (*) setting"
echo "🔒 For security, replace wildcard with specific origins listed above"
