# Stage 1: Build & Prune
FROM --platform=linux/amd64 node:24-slim AS builder

WORKDIR /app

# Le runtime final fournit deja les navigateurs Playwright.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation de toutes les dépendances (y compris dev pour Prisma CLI et tsx)
RUN npm ci

# Copie du schéma Prisma et du code source requis pour la génération
COPY prisma ./prisma
COPY src ./src
COPY tsconfig.json prisma.config.ts ./

# Génération du client Prisma
RUN npm run build

# Nettoyage des dépendances de développement pour alléger le dossier node_modules
RUN npm prune --omit=dev && npm cache clean --force

# Stage 2: Final Run Image, alignee sur la version npm de Playwright.
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.65.0-noble

WORKDIR /home/pwuser/app

# Copie des fichiers d'exécution
COPY --chown=pwuser:pwuser package.json entrypoint.sh ./
COPY --chown=pwuser:pwuser --from=builder /app/node_modules ./node_modules
COPY --chown=pwuser:pwuser --from=builder /app/src ./src
COPY --chown=pwuser:pwuser --from=builder /app/prisma ./prisma
COPY --chown=pwuser:pwuser --from=builder /app/prisma.config.ts ./

# Rendre le script d'entrée exécutable
RUN chmod +x entrypoint.sh

USER pwuser

EXPOSE 3001

ENTRYPOINT ["./entrypoint.sh"]
CMD [ "npm", "start" ]
