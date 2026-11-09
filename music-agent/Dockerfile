# design-bakery's song maker (TASK-DB-0160): makes songs on the owner's Flow Music plan (www.flowmusic.app) by driving a
# signed-in Google Chrome. Chrome runs only while a song is being made or while the owner signs in, then closes; the sign-in
# lives in the /data/profile volume between runs.
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl gnupg xvfb x11vnc novnc websockify \
      fonts-liberation fonts-noto-color-emoji \
    && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
      > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y --no-install-recommends google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY *.mjs ./
# Docker's default seccomp profile refuses the namespaces Chrome's sandbox needs, so Chrome runs with --no-sandbox, as the
# unprivileged `node` user, and only ever opens Flow Music and Google's sign-in.
RUN mkdir -p /data /tmp/.X11-unix && chown node:node /data && chmod 1777 /tmp/.X11-unix
USER node
ENV DATA_DIR=/data NODE_ENV=production
VOLUME /data
EXPOSE 8790 6080
CMD ["node", "server.mjs"]
