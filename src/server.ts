import cookieParser from 'cookie-parser';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);
const port = process.env.PORT || 3000;

const users: { [key: string]: string } = {};

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req: Request, res: Response) => {
  res.render('login');
});

app.get('/chat', (req: Request, res: Response) => {
  const username = req.cookies.username || '';
  res.render('chat', { username });
});

io.on('connection', (socket) => {
  const username = socket.handshake.headers.cookie?.split(';')
    .find((cookie: string) => cookie.trim().startsWith('username='))
    ?.split('=')[1];

  if (username) {
    users[socket.id] = username;
  }

  socket.on('new-user', (newUsername: string) => {
    users[socket.id] = newUsername;
    socket.emit('username-updated', newUsername);
  });

  socket.on('chat message', (msg: string) => {
    io.emit('chat message', { username: users[socket.id], message: msg });
  });

  socket.on('image', ({ image, imageName }: { image: string, imageName: string }) => {
    io.emit('image', { image, imageName, username });
  });
});

server.listen(port, () => {
  console.log('Server running at http://localhost:3000');
});
