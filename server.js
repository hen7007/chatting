// 필요한 기본 모듈들을 가져옵니다.
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// 1. HTTP 서버를 먼저 생성합니다.
// 이 서버는 웹 페이지를 보여주는 일반적인 요청을 처리합니다.
const server = http.createServer((req, res) => {
  // 브라우저가 아이콘을 요청하는 경우 (오류 방지용)
  if (req.url === '/favicon.ico') {
    res.writeHead(204); // 콘텐츠 없음 응답
    res.end();
    return;
  }

  // 그 외의 모든 요청은 기본 채팅 페이지를 보여줍니다.
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Error: index.html 파일을 찾을 수 없습니다.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
});

// 2. 위에서 만든 HTTP 서버에 웹소켓 서버를 '연결'합니다.
// 이렇게 해야 일반 접속은 HTTP 서버가, 채팅 관련 접속은 웹소켓 서버가 처리합니다.
const wss = new WebSocket.Server({ server });

// 3. 웹소켓 서버의 동작을 정의합니다.
wss.on('connection', ws => {
  console.log('새로운 클라이언트가 연결되었습니다.');

  // 클라이언트로부터 메시지를 받았을 때의 동작
  ws.on('message', message => {
    console.log(`수신된 메시지: ${message}`);

    // 연결된 모든 클라이언트에게 메시지 전송
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // 연결이 끊겼을 때의 동작
  ws.on('close', () => {
    console.log('클라이언트와의 연결이 끊겼습니다.');
  });

  // 처음 연결 시 환영 메시지 전송
  ws.send('채팅 서버에 오신 것을 환영합니다!');
});

// 4. Render가 지정하는 포트로 서버를 실행합니다.
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`서버가 ${PORT} 포트에서 정상적으로 시작되었습니다.`);
});
