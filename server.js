// 필요한 모듈을 가져옵니다.
const WebSocket = require('ws');

// 8080 포트에 WebSocket 서버를 생성합니다.
const wss = new WebSocket.Server({ port: 8080 });

console.log('채팅 서버가 8080 포트에서 시작되었습니다.');

// 클라이언트가 연결되었을 때 실행될 코드를 정의합니다.
wss.on('connection', ws => {
  console.log('새로운 클라이언트가 연결되었습니다.');

  // 클라이언트로부터 메시지를 받았을 때 실행될 코드를 정의합니다.
  ws.on('message', message => {
    console.log(`수신된 메시지: ${message}`);

    // 서버에 연결된 모든 클라이언트에게 받은 메시지를 그대로 전달합니다 (브로드캐스트).
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  // 클라이언트와의 연결이 끊겼을 때 실행될 코드를 정의합니다.
  ws.on('close', () => {
    console.log('클라이언트와의 연결이 끊겼습니다.');
  });

  // 연결 시 환영 메시지를 보냅니다.
  ws.send('채팅 서버에 오신 것을 환영합니다!');
});
