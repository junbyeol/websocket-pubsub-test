import Fastify from 'fastify';
import FastifyWebsocket from 'fastify-websocket';
import pino from 'pino';
import { createClient } from 'redis';

async function setup() {
  const subscriber = createClient({
    url: 'redis://localhost:6379',
  });
  const publisher = subscriber.duplicate();

  await subscriber.connect();
  await publisher.connect();

  const WS_CHANNEL = 'ws:messages';
  subscriber.subscribe(WS_CHANNEL, (message, _) => {
    console.log("subscribe!");

    app.websocketServer.clients.forEach(client => {
      client.send(message);
    });
  });

  const app = Fastify({ logger: pino() });

  app.register(FastifyWebsocket);
  app.get('/', { websocket: true }, (conn, req) => {
    conn.socket.send('hello new client');

    conn.socket.on('message', (x: Buffer) => {
      const message = x.toString();

      publisher.publish(WS_CHANNEL, message);
      console.log(message);
    })
  });

  app.listen(5000, '0.0.0.0', (err, address) => { //포트 번호를 바꿔가며, 서버를 여러개 띄워서 테스트해볼것!
    if (err) {
      app.log.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  })
}

setup()
.then(res => console.log(res))
.catch(e => console.error(e));
