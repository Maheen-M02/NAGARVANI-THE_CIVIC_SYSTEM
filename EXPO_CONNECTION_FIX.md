# 📱 Fix Expo App Connection to CLIP Server

## 🔍 Problem
Your iOS device can't reach your computer's CLIP server due to network issues:
- Network request timeout
- Different WiFi networks or network restrictions
- Firewall blocking connections

## 🚀 Quick Solutions (Try in Order)

### Solution 1: Use Computer Hotspot (Recommended)
**This creates a direct connection between your phone and computer:**

1. **On Windows:**
   - Settings → Network & Internet → Mobile hotspot
   - Turn on "Share my Internet connection"
   - Note the network name and password

2. **On your iPhone:**
   - Connect to your computer's hotspot WiFi
   - Test connection: Open Safari → `http://192.168.137.1:8000/health`
   - Should show: `{"status":"healthy","model_loaded":true,"mode":"CLIP"}`

3. **Update Expo app:**
   - The app will automatically try different IP addresses
   - Or manually update `NagarvaniExpo/src/services/clipService.js`:
   ```javascript
   this.serverUrls = [
     'http://192.168.137.1:8000',  // Windows hotspot IP
     'http://10.17.113.216:8000',  // Your WiFi IP
   ];
   ```

### Solution 2: Disable Windows Firewall (Temporary)
1. Windows Security → Firewall & network protection
2. Turn off firewall for "Private network"
3. Test connection from iPhone browser: `http://10.17.113.216:8000/health`
4. **Remember to turn firewall back on after testing!**

### Solution 3: Add Firewall Exception
1. Windows Security → Firewall & network protection
2. "Allow an app through firewall"
3. Add Python.exe (usually in `C:\Users\[username]\AppData\Local\Programs\Python\`)
4. Check both "Private" and "Public" boxes

### Solution 4: Use Expo Tunnel (Alternative)
If network issues persist, you can use Expo's tunnel feature:
1. In your Expo project: `npx expo start --tunnel`
2. This creates a public URL that bypasses network issues
3. Update the CLIP service to use the tunnel URL

## 🧪 Testing Your Connection

### From iPhone Browser:
Visit: `http://[YOUR_COMPUTER_IP]:8000/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "mode": "CLIP",
  "message": "API is running properly"
}
```

### From Expo App:
1. Open the FileComplaintScreen
2. Tap "🧪 Test CLIP Connection" button
3. Should show: "✅ Connected! Mode: CLIP"

## 📱 Updated Expo Service

I've enhanced the CLIP service with:
- ✅ **Multiple server URLs** - tries different IP addresses automatically
- ✅ **Better timeouts** - 10s for connection, 15s for image upload
- ✅ **Auto-discovery** - finds working server automatically
- ✅ **Detailed logging** - shows exactly what's happening

## 🔧 Manual IP Configuration

If you know your computer's IP address on the hotspot:

1. **Find your hotspot IP:**
   ```cmd
   ipconfig
   ```
   Look for "Wireless LAN adapter Local Area Connection"

2. **Update the service:**
   ```javascript
   // In NagarvaniExpo/src/services/clipService.js
   this.serverUrls = [
     'http://[YOUR_HOTSPOT_IP]:8000',
     'http://10.17.113.216:8000',
   ];
   ```

## ✅ Success Indicators

When working correctly, you'll see:
- **Console logs:** `[ClipService] Connection test successful`
- **Test button:** Shows "✅ Connected! Mode: CLIP"
- **Photo analysis:** Uses real CLIP (not fallback)
- **Confidence scores:** More realistic (30-80% instead of 80-95%)

## 🚨 Troubleshooting

**Still getting timeouts?**
- Ensure both devices are on the same network
- Try turning off VPN on either device
- Check if your company/school network blocks connections
- Use your phone's personal hotspot instead

**Getting "Connection refused"?**
- Make sure CLIP server is running: `python clip_server.py`
- Check server logs for errors
- Verify port 8000 isn't blocked

**Getting wrong IP address?**
- Run `ipconfig` to find current IP
- Update the `serverUrls` array in clipService.js
- Restart Expo app after changes

## 🎯 Expected Results

Once connected, your Expo app will:
- ✅ Use real CLIP model for image analysis
- ✅ Show realistic confidence scores (30-80%)
- ✅ Provide accurate civic issue detection
- ✅ Display "Mode: CLIP" instead of "Mode: Fallback"

The hotspot solution usually works best as it creates a direct, unrestricted connection between your devices! 🚀