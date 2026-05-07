# 🎮 Minecraft Bot Controller

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

Một hệ thống quản lý bot Minecraft mạnh mẽ với giao diện web, hỗ trợ **3D in-game viewer**, **auto-reconnect**, và **captcha solving**.

![3D Viewer Demo](https://via.placeholder.com/800x400?text=Minecraft+Bot+3D+Viewer)

## ✨ Tính năng nổi bật

- 🤖 **Multiple Bot Management** - Quản lý nhiều bot cùng lúc
- 🔄 **Auto-Reconnect** - Tự động reconnect 3 lần khi bot bị disconnect
- 🎮 **3D In-Game Viewer** - Render thế giới Minecraft 3D thực tế
- 📸 **2D Screenshot** - Capture in-game view dạng SVG
- 🔐 **Captcha Solver** - OCR tự động giải captcha
- 📊 **Real-time Monitoring** - Theo dõi health, food, position
- 💬 **Command Sender** - Gửi lệnh trực tiếp đến bot
- 🌐 **Web Dashboard** - Giao diện quản lý trực quan
- 🖥️ **Cross-platform** - Chạy trên Windows, Linux, macOS

## 🚀 Quick Start

### Yêu cầu
- Node.js 18+
- npm 9+

### Cài đặt
```bash
# Clone repository
git clone https://github.com/client1429/Minecraft-Bot-Controller-Clone.git
cd Minecraft-Bot-Controller-Clone

# Cài đặt dependencies
npm install

# Chạy server
node server.js
```

### Truy cập
- **Dashboard**: http://localhost:3000
- **3D Viewer**: http://localhost:3000/3dviewer.html

## 📸 Screenshots

### Dashboard chính
![Dashboard](https://via.placeholder.com/600x300?text=Dashboard)

### 3D In-Game View
![3D View](https://via.placeholder.com/600x300?text=3D+View)

## 🎯 Use Cases

- **Farming bot** - Tự động farm resources
- **AFK bot** - Giữ player online
- **Mining bot** - Đào tự động
- **Trading bot** - Giao dịch tự động
- **Server testing** - Test server load

## 🔧 Cấu hình

### Tạo bot mới
```javascript
POST /api/bots/create
{
  "host": "localhost",
  "port": 25565,
  "username": "Bot1",
  "password": "optional"
}
```

### Gửi lệnh
```javascript
POST /api/bots/1/command
{
  "command": "/help"
}
```

## 🎨 3D Viewer Features

- **First-person camera** - Góc nhìn như đang chơi game
- **Real-time block rendering** - Blocks, entities, players
- **UI in-game** - Health, food, held item display
- **Fullscreen mode** - Trải nghiệm đầy đủ
- **Screenshot capture** - Chụp ảnh 3D view

## 📦 Dependencies chính

- `mineflayer` - Minecraft bot client
- `three.js` - 3D rendering engine
- `express` - Web server framework
- `socket.io` - Real-time communication
- `sharp` - Image processing
- `tesseract.js` - OCR for captcha

## 🐛 Troubleshooting

### Bot không kết nối được
- Kiểm tra server Minecraft đang online
- Thử dùng `npm run mock-server` để test
- Xem log chi tiết tại console

### 3D Viewer không hiển thị block
- Chờ 2-3 giây để world load
- Refresh page
- Kiểm tra bot đã spawn thành công

### Lỗi port 3000 đã được sử dụng
```bash
npx kill-port 3000
```

## 📁 Project Structure

```
minecraft-bot-controller/
├── server.js              # Main Express server
├── botManager.js          # Bot lifecycle management
├── ingameRenderer.js      # 2D SVG renderer
├── public/
│   ├── index.html         # Dashboard UI
│   ├── 3dviewer.html      # 3D game viewer
│   ├── script.js          # Frontend logic
│   └── style.css          # Styling
├── package.json
├── SETUP_GUIDE.md         # Detailed setup guide
└── README.md              # This file
```

## 🚢 Deploy

### Deploy lên VPS (Ubuntu)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name minecraft-bot
pm2 save
pm2 startup
```

### Deploy với Docker
```bash
docker build -t minecraft-bot .
docker run -d -p 3000:3000 --name bot-controller minecraft-bot
```

## 🤝 Contributing

Contributions, issues, và feature requests đều được chào đón!

1. Fork project
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 TODO

- [ ] Thêm authentication
- [ ] Support nhiều version Minecraft
- [ ] Pathfinding tự động
- [ ] Macro system
- [ ] Plugin support
- [ ] API documentation
- [ ] Unit tests

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🙏 Acknowledgments

- [Mineflayer](https://github.com/PrismarineJS/mineflayer) - Minecraft bot API
- [Three.js](https://threejs.org/) - 3D library
- [PrismarineJS](https://github.com/PrismarineJS) - Minecraft tools

## 📞 Contact

- **Author**: Your Name
- **Email**: your.email@example.com
- **Discord**: your-discord
- **Project Link**: https://github.com/yourusername/minecraft-bot-controller

---

⭐️ Star this project if you find it useful!

**Made with ❤️ for Minecraft community**
