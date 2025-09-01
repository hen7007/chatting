const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 메인 페이지 라우팅
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 현재 접속한 사용자들을 저장할 객체
const users = {};

// Socket.io 연결 처리
io.on('connection', (socket) => {
  console.log('새로운 사용자가 접속했습니다:', socket.id);

  // 사용자 접속 처리
  socket.on('join', (username) => {
    users[socket.id] = username;
    socket.username = username;
    
    // 모든 클라이언트에게 새 사용자 접속 알림
    socket.broadcast.emit('user joined', {
      username: username,
      message: `${username}님이 채팅방에 입장했습니다.`
    });
    
    // 현재 접속자 목록 업데이트
    io.emit('users list', Object.values(users));
    
    console.log(`${username}님이 접속했습니다.`);
  });

  // 채팅 메시지 처리
  socket.on('chat message', (data) => {
    const messageData = {
      username: data.username,
      message: data.message,
      timestamp: new Date().toLocaleTimeString('ko-KR')
    };
    
    // 모든 클라이언트에게 메시지 전송
    io.emit('chat message', messageData);
    console.log(`${data.username}: ${data.message}`);
  });

  // 타이핑 상태 처리
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', {
      username: data.username,
      isTyping: data.isTyping
    });
  });

  // 사용자 연결 해제 처리
  socket.on('disconnect', () => {
    const username = users[socket.id];
    if (username) {
      delete users[socket.id];
      
      // 모든 클라이언트에게 사용자 퇴장 알림
      socket.broadcast.emit('user left', {
        username: username,
        message: `${username}님이 채팅방을 떠났습니다.`
      });
      
      // 현재 접속자 목록 업데이트
      io.emit('users list', Object.values(users));
      
      console.log(`${username}님이 접속을 종료했습니다.`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`채팅 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`http://localhost:${PORT} 에서 접속 가능합니다.`);
});
