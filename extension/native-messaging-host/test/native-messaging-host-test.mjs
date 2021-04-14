import os from 'os';
import net from 'net';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import { expect } from 'chai';

describe('KeeWeb extension native module host', function () {
    const hostPath = 'build/keeweb-native-messaging-host';
    const extensionOrigin = 'keeweb-connect@keeweb.info';

    const userInfo = os.userInfo();
    let sockPath;
    if (process.platform === 'win32') {
        sockPath = `\\\\.pipe\\keeweb-browser-${userInfo.username}`;
    } else {
        sockPath = path.join(os.tmpdir(), `keeweb-browser-${userInfo.uid}.sock`);
    }

    let server;
    let serverConnection;

    this.timeout(5000);

    afterEach((done) => {
        serverConnection = undefined;
        if (server) {
            server.close(done);
            server = null;
        } else {
            done();
        }
    });

    it('exits without arguments', (done) => {
        const process = childProcess.spawn(hostPath);
        process.on('exit', (code) => {
            expect(code).to.eql(1);
            done();
        });
    });

    it('exits with bad origin', (done) => {
        const process = childProcess.spawn(hostPath, ['something']);
        process.on('exit', (code) => {
            expect(code).to.eql(1);
            done();
        });
    });

    it('exits on host exit', (done) => {
        startServer();
        const process = childProcess.spawn(hostPath, [extensionOrigin]);
        process.stderr.on('data', (data) => console.error(data.toString()));
        process.on('exit', (code) => {
            expect(code).to.eql(0);
            done();
        });
        setTimeout(() => {
            expect(serverConnection).to.be.ok;
            server.close();
            server = null;
            serverConnection.end();
        }, 500);
    });

    it('sends messages between stdio and socket', (done) => {
        startServer();
        const process = childProcess.spawn(hostPath, [extensionOrigin]);
        process.stderr.on('data', (data) => console.error(data.toString()));
        process.on('exit', (code) => {
            expect(code).to.eql(0);
            done();
        });
        process.stdin.write('ping');
        process.stdout.on('data', (data) => {
            expect(data.toString()).to.eql('ping response');
            server.close();
            server = null;
            serverConnection.end();
        });
    });

    function startServer() {
        try {
            fs.unlinkSync(sockPath);
        } catch {}

        server = net.createServer((socket) => {
            serverConnection = socket;
            socket.on('data', (data) => {
                socket.write(Buffer.concat([data, Buffer.from(' response')]));
            });
        });
        server.listen(sockPath);
    }
});
