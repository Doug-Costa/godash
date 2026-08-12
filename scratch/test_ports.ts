import net from 'net';

function checkPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(4000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function run() {
  const ports = [22, 80, 443, 3306, 8888];
  for (const p of ports) {
    const open = await checkPort('187.77.48.78', p);
    console.log(`Port ${p}: ${open ? 'OPEN ✅' : 'CLOSED/BLOCKED ❌'}`);
  }
  process.exit(0);
}

run();
