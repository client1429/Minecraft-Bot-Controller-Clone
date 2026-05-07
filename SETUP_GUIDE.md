# Minecraft Bot Controller - Setup Guide

## 🎮 Giới thiệu

Minecraft Bot Controller là một hệ thống quản lý bot Minecraft với giao diện web, hỗ trợ:
- Multiple bots quản lý cùng lúc
- Auto-reconnect khi bot bị disconnect (retry 3 lần)
- In-game 3D viewer (render thế giới thực tế)
- Real-time monitoring (health, food, position, held item)
- Captcha detection & solving (OCR)
- Command line điều khiển bot

## 📋 Yêu cầu hệ thống

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **RAM**: >= 512MB
- **Disk**: >= 200MB
- **Minecraft Server** (Java Edition 1.8 - 1.20)

## 🔧 Cài đặt

### 1. Clone hoặc tải source code
```bash
git clone <your-repo-url>
cd minecraft-bot-controller
```

### 2. Cài đặt dependencies
```bash
npm install
```

Các packages chính:
- express - Web server
- socket.io - Real-time communication
- mineflayer - Minecraft bot client
- three.js - 3D rendering
- sharp - Image processing
- tesseract.js - OCR for captcha

### 3. Cấu hình (nếu cần)

Không cần cấu hình phức tạp. Mặc định chạy port 3000.

## 🚀 Chạy ứng dụng

### Start server:
```bash
node server.js
```

Hoặc dùng nodemon cho development:
```bash
npm run dev
```

### Truy cập:
- **Main Dashboard**: http://localhost:3000
- **3D In-Game Viewer**: http://localhost:3000/3dviewer.html

## 📖 Hướng dẫn sử dụng

### 1. **Tạo bot mới**
- Nhập thông tin server (host, port)
- Nhập username và password (nếu server có auth)
- Click "Create Bot"

### 2. **Quản lý bot**
- Xem danh sách bot với trạng thái real-time
- Theo dõi health, food, position
- Disconnect bot khi cần

### 3. **Gửi lệnh**
```
/help - Xem help
/give @p diamond 64
/tp <player>
```

### 4. **Xem in-game view**
- Cách 1: Click "Capture Screenshot" để xem 2D view
- Cách 2: Mở http://localhost:3000/3dviewer.html cho 3D view

### 5. **Xử lý captcha**
- Bot tự động phát hiện captcha trong chat
- Click "Solve Captcha" để OCR giải mã
- Hỗ trợ map items và text captcha

## 🔄 Auto-reconnect feature

Khi bot bị disconnect:
- Tự động reconnect 3 lần (delay 5 giây mỗi lần)
- Hiển thị trạng thái "reconnecting (X/3)"
- Tools vẫn chạy, không crash
- Log chi tiết số lần retry còn lại

## 🎨 3D Viewer Features

- **First-person camera** - Góc nhìn như đang chơi game
- **Real-time block rendering** - Hiển thị blocks xung quanh
- **Entity tracking** - Thấy các player và mob gần đó
- **UI in-game** - Health, food, held item, position
- **Fullscreen mode** - Trải nghiệm chân thực
- **Screenshot** - Chụp ảnh 3D view

## 🐛 Troubleshooting

### Lỗi "EADDRINUSE: address already in use"
```bash
# Kill process đang dùng port 3000
npx kill-port 3000
# Hoặc
taskkill /F /IM node.exe
```

### Lỗi "pos.floored is not a function"
Đã được fix trong phiên bản mới. Đảm bảo dùng code mới nhất.

### Bot không connect được
- Kiểm tra server Minecraft có online không
- Kiểm tra version (hỗ trợ 1.8-1.20)
- Thử dùng mock server: `npm run mock-server`

### 3D viewer không hiển thị block
- Đảm bảo bot đã spawn thành công
- Chờ 2-3 giây để world load
- Refresh page

## 📁 Cấu trúc project

```
minecraft-bot-controller/
├── server.js              # Main server
├── botManager.js          # Bot management logic
├── ingameRenderer.js      # 2D SVG renderer
├── realRenderer.js        # 3D renderer (optional)
├── viewerRenderer.js      # Prismarine viewer
├── public/
│   ├── index.html         # Main dashboard
│   ├── 3dviewer.html      # 3D game viewer
│   ├── script.js          # Frontend logic
│   └── style.css          # Styling
├── package.json
└── README.md
```

## 🔐 Security Notes

- Không expose port 3000 ra internet nếu không có authentication
- Password được truyền qua HTTP plain text (chỉ dùng trong LAN)
- Nên dùng reverse proxy với HTTPS nếu cần public

## 📝 API Endpoints

```
POST   /api/bots/create           - Tạo bot mới
GET    /api/bots/list             - Lấy danh sách bot
POST   /api/bots/:id/disconnect   - Disconnect bot
POST   /api/bots/disconnect-all   - Disconnect all
POST   /api/bots/:id/command      - Gửi lệnh đến bot
POST   /api/bot/:id/screenshot    - Chụp ảnh 2D
GET    /api/bot/:id/world-data    - Lấy data cho 3D viewer
POST   /api/bot/:id/solve-captcha - Giải captcha
```

## 🚢 Deploy lên server

### Option 1: VPS (Ubuntu/Debian)
```bash
# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Clone và cài đặt
git clone <repo>
cd minecraft-bot-controller
npm install

# Dùng PM2 để chạy background
npm install -g pm2
pm2 start server.js --name minecraft-bot
pm2 save
pm2 startup
```

### Option 2: Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t minecraft-bot .
docker run -p 3000:3000 minecraft-bot
```

### Option 3: Windows Service
Dùng `node-windows` để chạy như service:
```bash
npm install -g node-windows
node-windows start
```

## 📞 Support

- Issue tracker: [Link to issues]
- Discord: [Your Discord server]
- Email: [Your email]

## 📄 License

MIT License - Free to use and modify.

## 🌟 Tính năng nổi bật

✅ **Auto-reconnect** - Bot tự động kết nối lại 3 lần
✅ **3D Viewer** - Render world thực tế như game
✅ **Multiple bots** - Quản lý nhiều bot cùng lúc
✅ **Captcha solver** - OCR cho captcha
✅ **Real-time monitoring** - Theo dõi health, food, position
✅ **Cross-platform** - Chạy trên Windows, Linux, macOS

---

**Made with ❤️ for Minecraft bot automation**
